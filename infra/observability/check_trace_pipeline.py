"""Local-only integration check: temporary Alloy/Tempo containers, cleaned on exit."""

import json
import os
import pathlib
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import uuid

root = pathlib.Path(__file__).resolve().parents[2]
os.chdir(root)
env = {
    **os.environ,
    "GRAFANA_DOMAIN": "grafana.example.com",
    "GRAFANA_ADMIN_PASSWORD": "test-only",
    "BACKEND_METRICS_TOKEN": "test-only",
}
r = json.loads(
    subprocess.check_output(
        [
            "docker",
            "compose",
            "-f",
            "infra/observability/compose.yml",
            "config",
            "--format",
            "json",
        ],
        env=env,
        text=True,
    )
)
alloy = (
    r["configs"]["alloy"]["content"]
    .split("logging {")[0]
    .replace("logs = [loki.write.local.receiver]", "logs = []")
)
project = "unmsm-trace-check-" + uuid.uuid4().hex[:8]
with tempfile.TemporaryDirectory() as d:
    p = pathlib.Path(d) / "compose.json"
    cfg = {
        "services": {
            "tempo": {
                "image": r["services"]["tempo"]["image"],
                "command": r["services"]["tempo"]["command"],
                "mem_limit": "768m",
                "configs": [{"source": "tempo", "target": "/etc/tempo/config.yml"}],
                "volumes": ["tempo_data:/var/tempo"],
                "ports": ["127.0.0.1::3200"],
            },
            "alloy": {
                "image": r["services"]["alloy"]["image"],
                "command": r["services"]["alloy"]["command"],
                "mem_limit": "256m",
                "configs": [{"source": "alloy", "target": "/etc/alloy/config.alloy"}],
                "environment": {"FRONTEND_ORIGIN": "https://app.example.com"},
                "ports": ["127.0.0.1::4318", "127.0.0.1::12347"],
            },
        },
        "configs": {
            "tempo": {"content": r["configs"]["tempo"]["content"]},
            "alloy": {"content": alloy},
        },
        "volumes": {"tempo_data": {}},
    }
    p.write_text(json.dumps(cfg))
    cmd = ["docker", "compose", "-p", project, "-f", str(p)]

    def run(*args, **kwargs):
        return subprocess.check_output(cmd + list(args), text=True, **kwargs)

    def addr(service, port):
        return "http://" + run("port", service, str(port)).strip()

    def request(url, data=None, headers=None):
        with urllib.request.urlopen(
            urllib.request.Request(url, data=data, headers=headers or {}), timeout=3
        ) as response:
            return response.read()

    try:
        run("up", "-d", stderr=subprocess.DEVNULL)
        tempo, otlp, faro = (
            addr("tempo", 3200),
            addr("alloy", 4318),
            addr("alloy", 12347),
        )
        deadline = time.monotonic() + 45
        while True:
            try:
                request(tempo + "/ready")
                break
            except Exception:
                if time.monotonic() > deadline:
                    raise
                time.sleep(0.25)
        deadline = time.monotonic() + 30
        while True:
            try:
                request(faro + "/collect")
                break
            except urllib.error.HTTPError:
                break
            except OSError:
                if time.monotonic() > deadline:
                    raise
                time.sleep(0.25)
        print(
            "PASS: Tempo starts with persistent non-root storage and reaches readiness",
            flush=True,
        )
        now = time.time_ns()
        traceid = "a" * 32

        def resource(name, spanid, parent=None):
            span = {
                "traceId": traceid,
                "spanId": spanid,
                "name": "test-operation",
                "startTimeUnixNano": str(now),
                "endTimeUnixNano": str(now + 1000000),
                "attributes": [
                    {
                        "key": "db.statement",
                        "value": {"stringValue": "private-query-value"},
                    }
                ],
            }
            if parent:
                span["parentSpanId"] = parent
            return {
                "resource": {
                    "attributes": [
                        {"key": "service.name", "value": {"stringValue": name}}
                    ]
                },
                "scopeSpans": [
                    {"scope": {"name": "integration-test"}, "spans": [span]}
                ],
            }

        browser = resource("unmsm-frontend", "b" * 16)
        backend = resource("unmsm-backend", "c" * 16, "b" * 16)
        request(
            faro + "/collect",
            json.dumps(
                {
                    "meta": {"app": {"name": "unmsm-frontend"}},
                    "traces": {"resourceSpans": [browser]},
                }
            ).encode(),
            {"Content-Type": "application/json", "Origin": "https://app.example.com"},
        )
        request(
            otlp + "/v1/traces",
            json.dumps({"resourceSpans": [backend]}).encode(),
            {"Content-Type": "application/json"},
        )
        deadline = time.monotonic() + 30
        while True:
            try:
                data = request(
                    tempo + "/api/traces/" + traceid,
                    headers={"Accept": "application/json"},
                )
                if b"unmsm-frontend" in data and b"unmsm-backend" in data:
                    break
            except urllib.error.HTTPError:
                pass
            if time.monotonic() > deadline:
                raise RuntimeError("Both services did not appear in Tempo")
            time.sleep(0.5)
        assert b"private-query-value" not in data
        print(
            "PASS: Faro browser spans and backend OTLP spans join in Tempo; sensitive SQL attribute removed",
            flush=True,
        )
    except Exception:
        print(run("ps", "-a"), flush=True)
        print(run("logs", "alloy", "--tail", "30"), flush=True)
        raise
    finally:
        subprocess.run(
            cmd + ["down", "-v", "--remove-orphans"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
