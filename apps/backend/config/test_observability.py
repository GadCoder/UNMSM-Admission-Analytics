import json
import logging
import os
import subprocess
import sys

import pytest
from django.db import OperationalError
from django.test import Client
from prometheus_client import REGISTRY

from config.observability import JsonFormatter, request_id_context
from modules.analytics.cache import get_or_compute


def test_metrics_requires_configured_bearer_token(settings):
    client = Client()
    settings.METRICS_BEARER_TOKEN = ""
    assert client.get("/metrics/").status_code == 404
    settings.METRICS_BEARER_TOKEN = "test-scrape-token"
    assert client.get("/metrics/").status_code == 403
    assert client.get("/metrics/", HTTP_AUTHORIZATION="Bearer wrong").status_code == 403
    response = client.get("/metrics/", HTTP_AUTHORIZATION="Bearer test-scrape-token")
    assert response.status_code == 200
    assert "app_http_requests_total" in response.content.decode()
    assert response["Cache-Control"] == "no-store"


def test_request_logs_exclude_query_and_unmatched_path(caplog):
    with caplog.at_level(logging.INFO, logger="app.requests"):
        response = Client().get("/private-arbitrary-path/?secret=do-not-record")
    record = next(r for r in caplog.records if r.name == "app.requests")
    assert record.route == "unmatched"
    assert record.status == 404
    assert len(response["X-Request-ID"]) == 32
    assert "do-not-record" not in record.getMessage()
    assert "private-arbitrary-path" not in record.getMessage()
    assert request_id_context.get() is None


def test_json_log_correlation(settings):
    settings.APP_RELEASE = "test-release"
    record = logging.LogRecord(
        "app.requests", logging.INFO, "", 0, "http_request", (), None
    )
    token = request_id_context.set("request-123")
    try:
        data = json.loads(JsonFormatter().format(record))
    finally:
        request_id_context.reset(token)
    assert data["request_id"] == "request-123"
    assert data["release"] == "test-release"


def test_cache_metrics_record_hit_miss_and_bypass(monkeypatch):
    from modules.analytics import cache as module

    def count(outcome):
        return (
            REGISTRY.get_sample_value(
                "app_analytics_cache_lookups_total",
                {"view": "test", "outcome": outcome},
            )
            or 0
        )

    before = {key: count(key) for key in ("hit", "miss", "bypass")}
    assert get_or_compute("test", {}, lambda: {"value": 1}) == {"value": 1}
    assert get_or_compute("test", {}, lambda: pytest.fail("cache not used")) == {
        "value": 1
    }

    def broken(*args, **kwargs):
        raise ConnectionError("cache down")

    monkeypatch.setattr(module.cache, "get_or_set", broken)
    assert get_or_compute("test", {}, lambda: {"value": 2}) == {"value": 2}
    for outcome in before:
        assert count(outcome) == before[outcome] + 1


@pytest.mark.django_db
def test_readiness_checks_database(monkeypatch):
    from django.db import connection

    assert Client().get("/ready/").status_code == 200

    def broken(*args, **kwargs):
        raise OperationalError("database down")

    monkeypatch.setattr(connection, "cursor", broken)
    response = Client().get("/ready/")
    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}
    assert response["Cache-Control"] == "no-store"


def test_multiprocess_metrics_aggregate_workers(tmp_path):
    env = {**os.environ, "PROMETHEUS_MULTIPROC_DIR": str(tmp_path)}
    env["DJANGO_SETTINGS_MODULE"] = "config.settings"
    env["DJANGO_ALLOWED_HOSTS"] = "testserver"
    env["METRICS_BEARER_TOKEN"] = "multiprocess-test-token"
    writer = "import django; django.setup(); from django.test import Client; assert Client().get('/api/v1/').status_code == 200"
    for _ in range(2):
        subprocess.run(
            [sys.executable, "-c", writer], env=env, check=True, capture_output=True
        )
    reader = "import django; django.setup(); from django.test import Client; r=Client().get('/metrics/', HTTP_AUTHORIZATION='Bearer multiprocess-test-token'); assert r.status_code == 200; print(r.content.decode())"
    result = subprocess.run(
        [sys.executable, "-c", reader],
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )
    assert (
        'app_http_requests_total{method="GET",route="api-root",status="200"} 2.0'
        in result.stdout
    )
