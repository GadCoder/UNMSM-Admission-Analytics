"""Small, bounded cache for public analytics responses."""

import hashlib
import json
import logging
import uuid
from contextlib import contextmanager
from contextvars import ContextVar

from django.core.cache import cache
from opentelemetry import trace

from config.observability import CACHE_FAILURES, CACHE_LOOKUPS

logger = logging.getLogger(__name__)

CACHE_TIMEOUT = 60
GENERATION_KEY = "analytics:response-generation"
_suspended = ContextVar("analytics_cache_invalidation_suspended", default=False)


def invalidation_suspended():
    return _suspended.get()


@contextmanager
def suspend_invalidation():
    """Suppress row signals while a bulk importer schedules one commit callback."""
    token = _suspended.set(True)
    try:
        yield
    finally:
        _suspended.reset(token)


def _key(view_name, params):
    # A fresh namespace after eviction must not resurrect an older default key.
    generation = cache.get_or_set(
        GENERATION_KEY, lambda: uuid.uuid4().hex, timeout=None
    )
    payload = json.dumps(
        [view_name, generation, params], sort_keys=True, separators=(",", ":")
    )
    return f"analytics:response:{hashlib.sha256(payload.encode()).hexdigest()}"


def get_or_compute(view_name, params, compute):
    with trace.get_tracer(__name__).start_as_current_span(
        "analytics.cache", attributes={"analytics.view": view_name}
    ):
        return _get_or_compute(view_name, params, compute)


def _get_or_compute(view_name, params, compute):
    """Return a cached JSON-safe public response, bypassing cache on backend errors."""
    try:
        key = _key(view_name, params)
        value = cache.get(key)
    except Exception:
        CACHE_FAILURES.labels("read").inc()
        trace.get_current_span().set_attribute("cache.outcome", "bypass")
        CACHE_LOOKUPS.labels(view_name, "bypass").inc()
        logger.warning("Analytics cache read failed; computing response", exc_info=True)
        return compute()
    if value is not None:
        trace.get_current_span().set_attribute("cache.outcome", "hit")
        CACHE_LOOKUPS.labels(view_name, "hit").inc()
        return value
    trace.get_current_span().set_attribute("cache.outcome", "miss")
    CACHE_LOOKUPS.labels(view_name, "miss").inc()
    with trace.get_tracer(__name__).start_as_current_span("analytics.compute"):
        value = compute()
    if value is None:
        return None
    try:
        # Round-trip to plain JSON values so cached serializer objects never leak.
        value = json.loads(json.dumps(value))
        cache.set(key, value, timeout=CACHE_TIMEOUT)
    except Exception:
        CACHE_FAILURES.labels("write").inc()
        logger.warning("Analytics cache write failed", exc_info=True)
    return value


def invalidate_analytics_cache():
    """Change the namespace; old entries expire within CACHE_TIMEOUT seconds."""
    try:
        cache.set(GENERATION_KEY, uuid.uuid4().hex, timeout=None)
    except Exception:
        # Public API requests must survive a cache outage. The 60-second entry TTL
        # bounds staleness until the cache recovers.
        CACHE_FAILURES.labels("invalidation").inc()
        logger.warning("Analytics cache invalidation failed", exc_info=True)
