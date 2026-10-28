"""Optional OpenTelemetry setup, initialized inside each Gunicorn worker."""

import logging
import os

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.psycopg import PsycopgInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import ParentBased, TraceIdRatioBased

logger = logging.getLogger(__name__)
_provider = None


def setup_tracing():
    """Return None when disabled; never create exporter threads in the master."""
    global _provider
    endpoint = os.getenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "")
    if not endpoint or _provider is not None:
        return _provider
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        ratio = float(os.getenv("OTEL_TRACES_SAMPLER_ARG", "0.1"))
        if not 0 <= ratio <= 1:
            raise ValueError("Sampling ratio must be between 0 and 1")
        provider = TracerProvider(
            resource=Resource.create(
                {
                    "service.name": "unmsm-backend",
                    "service.version": os.getenv("APP_RELEASE", "unknown"),
                }
            ),
            sampler=ParentBased(TraceIdRatioBased(ratio)),
        )
        provider.add_span_processor(
            BatchSpanProcessor(
                OTLPSpanExporter(endpoint=endpoint, timeout=3),
                max_queue_size=512,
                max_export_batch_size=64,
                schedule_delay_millis=1000,
            )
        )
        trace.set_tracer_provider(provider)
        # Instrument before WSGI initializes Django's middleware chain.
        DjangoInstrumentor().instrument(
            excluded_urls=r".*/(?:health|ready|metrics)/?$",
            tracer_provider=provider,
        )
        PsycopgInstrumentor().instrument(
            tracer_provider=provider, capture_parameters=False
        )
        RedisInstrumentor().instrument(tracer_provider=provider)
        _provider = provider
        return provider
    except Exception:
        # A telemetry misconfiguration must not make the API unavailable.
        logger.exception("Tracing initialization failed; serving without tracing")
        return None


def shutdown_tracing():
    if _provider is not None:
        _provider.shutdown()
