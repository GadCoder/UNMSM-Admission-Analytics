"""Exercise real Gunicorn workers and OTLP export, not mocked SDK internals."""

import json
import os
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest
from opentelemetry.proto.collector.trace.v1.trace_service_pb2 import (
    ExportTraceServiceRequest,
)


@pytest.mark.parametrize("enabled", [False, True])
def test_gunicorn_propagates_and_exports_sampled_trace(tmp_path, enabled):
    exports = []

    class Collector(BaseHTTPRequestHandler):
        def do_POST(self):
            body = self.rfile.read(int(self.headers["Content-Length"]))
            exports.append(ExportTraceServiceRequest.FromString(body))
            self.send_response(200)
            self.send_header("Content-Type", "application/x-protobuf")
            self.end_headers()

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Collector)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    sock.listen()
    port = sock.getsockname()[1]
    env = {
        **os.environ,
        "DJANGO_SETTINGS_MODULE": "config.settings",
        "DJANGO_ALLOWED_HOSTS": "127.0.0.1",
        "DATABASE_URL": "",
        "OTEL_TRACES_SAMPLER_ARG": "0",
        "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT": f"http://127.0.0.1:{server.server_port}/v1/traces"
        if enabled
        else "",
    }
    # Match the entrypoint with isolated multiprocess storage for this master.
    metrics_dir = tmp_path / "metrics"
    metrics_dir.mkdir()
    env["PROMETHEUS_MULTIPROC_DIR"] = str(metrics_dir)
    proc = None
    try:
        with (tmp_path / "gunicorn.log").open("w+") as log:
            proc = subprocess.Popen(
                [
                    sys.executable,
                    "-m",
                    "gunicorn",
                    "config.wsgi:application",
                    "--config",
                    "config/gunicorn.py",
                    "--workers",
                    "2",
                    "--bind",
                    f"fd://{sock.fileno()}",
                ],
                env=env,
                pass_fds=(sock.fileno(),),
                stdout=log,
                stderr=log,
            )
            sock.close()
            trace_id = "a" * 32
            req = urllib.request.Request(
                f"http://127.0.0.1:{port}/api/v1/",
                headers={"traceparent": f"00-{trace_id}-{'b' * 16}-01"},
            )
            deadline = time.monotonic() + 15
            while True:
                try:
                    with urllib.request.urlopen(req, timeout=1) as response:
                        request_id = response.headers["X-Request-ID"]
                        assert response.status == 200
                    break
                except (OSError, urllib.error.URLError):
                    if proc.poll() is not None or time.monotonic() >= deadline:
                        log.seek(0)
                        pytest.fail(log.read())
                    time.sleep(0.1)
            proc.terminate()
            proc.wait(timeout=10)
            log.seek(0)
            assert proc.returncode == 0, log.read()
            log.seek(0)
            records = [json.loads(line) for line in log if line.startswith("{")]
        request_log = next(
            r
            for r in records
            if r.get("request_id") == request_id and r.get("message") == "http_request"
        )
        spans = [
            span
            for export in exports
            for resource in export.resource_spans
            for scope in resource.scope_spans
            for span in scope.spans
        ]
        if enabled:
            assert request_log["trace_id"] == trace_id
            assert any(
                span.trace_id.hex() == trace_id
                and span.parent_span_id.hex() == "b" * 16
                for span in spans
            )
        else:
            assert "trace_id" not in request_log
            assert not spans
    finally:
        sock.close()
        if proc and proc.poll() is None:
            proc.kill()
            proc.wait()
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def test_browser_trace_context_preflight():
    from django.test import Client

    response = Client().options(
        "/api/v1/",
        HTTP_ORIGIN="http://localhost:5173",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="traceparent,tracestate",
    )
    assert response.status_code == 200
    assert "traceparent" in response["Access-Control-Allow-Headers"]
