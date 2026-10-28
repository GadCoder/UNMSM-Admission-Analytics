"""Operational metrics with bounded labels and request-correlated JSON logs."""

import json
import logging
import os
import time
import uuid
from contextvars import ContextVar
from datetime import UTC, datetime
from secrets import compare_digest

from django.conf import settings
from django.http import HttpResponse
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    REGISTRY,
    CollectorRegistry,
    Counter,
    Histogram,
    generate_latest,
    multiprocess,
)

request_id_context = ContextVar("request_id", default=None)
logger = logging.getLogger("app.requests")
REQUESTS = Counter(
    "app_http_requests_total", "Completed HTTP requests", ["method", "route", "status"]
)
DURATION = Histogram(
    "app_http_request_duration_seconds",
    "Time to produce response, excluding streaming delivery",
    ["method", "route"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
)
CACHE_LOOKUPS = Counter(
    "app_analytics_cache_lookups_total",
    "Analytics cache lookup outcomes",
    ["view", "outcome"],
)
CACHE_FAILURES = Counter(
    "app_analytics_cache_failures_total", "Analytics cache failures", ["operation"]
)


class JsonFormatter(logging.Formatter):
    def format(self, record):
        data = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_context.get(),
            "release": settings.APP_RELEASE,
        }
        for key in ("method", "route", "status", "duration_ms"):
            if hasattr(record, key):
                data[key] = getattr(record, key)
        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)
        return json.dumps(data, ensure_ascii=False)


class RequestObservabilityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = uuid.uuid4().hex
        token = request_id_context.set(request_id)
        start = time.perf_counter()
        try:
            response = self.get_response(request)
            response["X-Request-ID"] = request_id
            match = request.resolver_match
            route = match.view_name if match and match.view_name else "unmatched"
            if route not in {"metrics", "health-check", "readiness"}:
                method = (
                    request.method
                    if request.method
                    in {
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "HEAD",
                        "OPTIONS",
                        "TRACE",
                    }
                    else "OTHER"
                )
                duration = time.perf_counter() - start
                REQUESTS.labels(method, route, str(response.status_code)).inc()
                DURATION.labels(method, route).observe(duration)
                logger.info(
                    "http_request",
                    extra={
                        "method": method,
                        "route": route,
                        "status": response.status_code,
                        "duration_ms": round(duration * 1000, 3),
                    },
                )
            return response
        finally:
            request_id_context.reset(token)


def metrics_view(request):
    token = settings.METRICS_BEARER_TOKEN
    if not token:
        return HttpResponse(status=404)
    if not compare_digest(
        request.headers.get("Authorization", "").encode(), f"Bearer {token}".encode()
    ):
        return HttpResponse(status=403)
    if request.method != "GET":
        return HttpResponse(status=405)
    if os.environ.get("PROMETHEUS_MULTIPROC_DIR"):
        registry = CollectorRegistry()
        multiprocess.MultiProcessCollector(registry)
    else:
        registry = REGISTRY
    response = HttpResponse(generate_latest(registry), content_type=CONTENT_TYPE_LATEST)
    response["Cache-Control"] = "no-store"
    return response
