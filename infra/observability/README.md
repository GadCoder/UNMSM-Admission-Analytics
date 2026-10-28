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
2. In the backend's Dokploy environment set `METRICS_BEARER_TOKEN` to that token.
   `env_file: .env` in the base Compose forwards it into the backend. Keep
   `DJANGO_ALLOWED_HOSTS` set to your existing API hostnames. Leave `APP_RELEASE`
   unset for now; it defaults to `unknown` until deployment automation supplies it.
3. Configure the backend's Dokploy Compose deployment to load **both files**, in
   this order: `compose.yml`, then `compose.dokploy.yml`. The equivalent CLI is:

   ```sh
   docker compose -f compose.yml -f compose.dokploy.yml up -d --build
   ```

   Use Dokploy's Compose file selection or configure its command to include both
   files while retaining its generated project name and other deployment flags.
   Preview the resulting configuration: backend must retain the `default` network
   for PostgreSQL/Valkey and join `dokploy-network` with alias `unmsm-api-metrics`.
   The override appends that alias to `DJANGO_ALLOWED_HOSTS` automatically. This
   alias must be unique across the shared network; do not reuse it for staging.
   Local development continues to use `compose.yml` alone without Dokploy.
4. Deploy the updated backend image using its normal entrypoint. It prepares fresh
   Prometheus multiprocess storage before Gunicorn starts. Do not override that
   entrypoint or set `PROMETHEUS_MULTIPROC_DIR` manually. `/metrics/` is disabled
   without a token and rejects unauthorized scrapes. `/health/` is liveness;
   `/ready/` executes a PostgreSQL query and returns 503 if it fails. Readiness
   does not validate dataset completeness or require the optional Valkey cache.
5. In monitoring's Dokploy environment add `BACKEND_METRICS_TOKEN` with the same
   token. Update its Raw Compose from `infra/observability/compose.yml` and
   redeploy. It now connects Prometheus to `dokploy-network` and includes the
   authenticated `unmsm-backend` scrape job. Both projects must run on the same
   Docker host, and Dokploy's external network must already exist. No additional
   host ports are needed. Keep secrets in Dokploy; do not commit token values or
   share resolved Compose output. Existing named volumes must be retained.
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
