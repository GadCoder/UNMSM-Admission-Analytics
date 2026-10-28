# Observability deployment

The self-contained `compose.yml` runs Grafana, Prometheus, Loki, Alloy and Node
Exporter. Paste it into a Dokploy Raw Docker Compose service (Compose >= 2.23.1).
Set `GRAFANA_DOMAIN`, `GRAFANA_ADMIN_USER`, and `GRAFANA_ADMIN_PASSWORD` in Dokploy.
Route only Grafana's port 3000 through Dokploy Domains with HTTPS. Preserve both
Grafana networks when inspecting Dokploy's generated Compose configuration.

Persistent volumes store dashboards, metrics, logs and collector positions.
Metrics retain up to 15 days / 3 GB (whichever limit is reached first); Loki retains
7 days. Loki retention deletion is asynchronous, not a disk quota. Service memory
limits total 2 GiB; monitor for OOM/restarts and tune after measuring real traffic.

Alloy's Docker socket mount grants privileged Docker access despite `:ro`.
`LOG_PROJECT_REGEX=.+` collects all Compose projects by default; restrict it to
actual `com.docker.compose.project` label values when ready. Swarm-only containers
are excluded by that filter. Loki labels are project/service/container/job;
request IDs and query properties must stay in log content, not labels.

## Connect the instrumented backend

1. Generate a dedicated token locally with `openssl rand -hex 32`.
2. In the backend's Dokploy environment set `METRICS_BEARER_TOKEN` to that token,
   and `APP_RELEASE` to the deployed commit or release identifier. Make sure your
   backend Compose `environment` explicitly forwards those variables, or uses
   `env_file: .env`; Dokploy UI variables alone do not enter containers otherwise.
3. Deploy the updated backend image using its normal entrypoint. It prepares fresh
   Prometheus multiprocess storage before Gunicorn starts. Do not override that
   entrypoint or set `PROMETHEUS_MULTIPROC_DIR` manually. `/metrics/` is disabled
   without a token and rejects unauthorized scrapes. `/health/` is liveness;
   `/ready/` executes a PostgreSQL query and returns 503 if it fails. Readiness
   does not validate dataset completeness or require the optional Valkey cache.
4. Join backend and Prometheus to a shared Docker network. For an app already on
   `dokploy-network`, add that network to Prometheus while retaining `telemetry`:

   ```yaml
   prometheus:
     # Keep all existing settings.
     networks: [telemetry, dokploy-network]
   ```

   Give the backend a unique alias on the same network, e.g. `unmsm-api-metrics`:

   ```yaml
   backend:
     # Merge with its existing networks; preserve database/cache connectivity.
     networks:
       dokploy-network:
         aliases: [unmsm-api-metrics]
   networks:
     dokploy-network:
       external: true
   ```

   Use your actual backend service name. This alias points to port 8000 inside
   Docker; do not publish an additional host port. Add `unmsm-api-metrics` to
   `DJANGO_ALLOWED_HOSTS`. A dedicated shared network can be used instead if
   desired; it must exist before either Compose project attaches to it.
5. In monitoring's Dokploy environment add `BACKEND_METRICS_TOKEN` with the same
   token. In the embedded Prometheus `scrape_configs`, append:

   ```yaml
   - job_name: unmsm-backend
     metrics_path: /metrics/
     authorization:
       type: Bearer
       credentials: ${BACKEND_METRICS_TOKEN:?Set the backend scrape token}
     static_configs:
       - targets: ["unmsm-api-metrics:8000"]
   ```

   This placeholder is expanded by Compose in the inline config. Keep tokens out
   of Git. Redeploy monitoring to apply config changes; never paste resolved
   Compose output containing credentials into tickets/chat.
6. Browse the app to produce requests, then verify in Grafana Explore:

   ```promql
   up{job="unmsm-backend"}
   sum by (route, status) (rate(app_http_requests_total[5m]))
   histogram_quantile(0.95, sum by (le, route) (rate(app_http_request_duration_seconds_bucket[5m])))
   sum by (view, outcome) (rate(app_analytics_cache_lookups_total[5m]))
   ```

   The first query should be 1. Other queries need traffic and at least two
   scrapes. Exclude admin routes if building public-API-only panels.

   In Loki use `{job="docker"} | json | message="http_request"`. Scope to the
   backend project/service labels when other apps also emit JSON logs. Response
   `X-Request-ID` values correlate with the `request_id` JSON field. Routine
   health/readiness/metrics requests are omitted from request metrics/logs. HTTP
   labels use resolved view names, never IDs, raw paths, or query parameters.

## Remaining work

Configure Grafana contact points, alert rules, and notification policies; verify a
real test notification. Use an external uptime monitor for host-wide outages.
This phase does not yet implement frontend usage events, traces, or import/data
quality instrumentation. API calls include bots, retries and caching effects and
must not be interpreted as distinct user actions. Gunicorn lifecycle lines remain
in Gunicorn's own format; Django/application logs use JSON.

## Verification

The Compose file has passed `docker compose config --quiet`; the user verified
infrastructure targets and Docker logs in the deployed stack. Backend unit and
multiprocess checks run via `cd apps/backend && uv run pytest`. The updated app
still needs deployment and the authenticated backend scrape verified in Dokploy.
