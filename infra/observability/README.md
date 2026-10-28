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
`LOG_PROJECT_REGEX=.+` collects all Compose projects by default, and
`LOG_SWARM_SERVICE_REGEX=.+` collects all local Swarm service containers, including
Dokploy Applications. Narrow these independently to actual Compose project / Swarm
service names; setting only the Compose filter does not restrict Swarm collection.
Use a nonmatching pattern such as `a^` to disable either source. A Swarm container
gets `project="swarm"` and its full Swarm service name as `service`. Collection is
local to this Docker host; other Swarm nodes need their own collector.
Loki labels are project/service/container/job;
request IDs and query properties must stay in log content, not labels.

## Connect the instrumented backend

1. Generate a dedicated token locally with `openssl rand -hex 32`.
2. The backend is a Dokploy **Application** built from its Dockerfile, not a
   Compose deployment. Keep its Dockerfile, context, image, and normal startup
   settings unchanged. In its **Environment**, set `METRICS_BEARER_TOKEN` to that
   token and append `unmsm-api-metrics` to the existing `DJANGO_ALLOWED_HOSTS`
   value. Dokploy Application environment settings enter the running container
   directly; no Compose `env_file` is involved. Leave `APP_RELEASE` unset for now.
3. In the backend Application's **Advanced → Swarm Settings → Network**, edit
   its existing `dokploy-network` attachment and add alias `unmsm-api-metrics`.
   Preserve other network attachments and aliases, especially database/cache
   connectivity. If your Dokploy version has a separate Networks panel, use that
   to manage the same attachment. This alias must be unique on the shared network;
   do not reuse it for staging. No backend Compose override is needed. The root
   `compose.yml` remains for local development.
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
   backend service label when other apps also emit JSON logs. For a Dokploy
   Application, start with `{job="docker", project="swarm"}` and select the
   backend's full Swarm `service` label. Do not mistake monitoring-stack logs
   for proof that the backend is being collected. Response
   `X-Request-ID` values correlate with the `request_id` JSON field. Routine
   health/readiness/metrics requests are omitted from request metrics/logs. HTTP
   labels use resolved view names, never IDs, raw paths, or query parameters.

## Remaining work

Configure Grafana contact points, alert rules, and notification policies; verify a
real test notification. Use an external uptime monitor for host-wide outages.
Frontend usage collection is described below. Traces and import/data-quality
instrumentation require separate rollout. API calls include bots, retries and caching effects and
must not be interpreted as distinct user actions. Gunicorn lifecycle lines remain
in Gunicorn's own format; Django/application logs use JSON.

## Verification

The Compose file has passed `docker compose config --quiet`; the user verified
infrastructure targets and Docker logs in the deployed stack. Backend unit and
multiprocess checks run via `cd apps/backend && uv run pytest`. The updated app
still needs deployment and the authenticated backend scrape verified in Dokploy.

## Frontend usage events (Faro)

1. In monitoring's Environment, set `FRONTEND_ORIGIN` to the exact public frontend
   origin, e.g. `https://resultados-unmsm.com` (no path or trailing slash). The
   default only permits local development. Update the Raw Compose and redeploy.
2. Add a Dokploy HTTPS domain such as `telemetry.example.com` pointing to the
   **alloy** service, container port **12347**. Keep port 12345 (Alloy management)
   private. The Faro SDK endpoint is `https://telemetry.example.com/collect`.
   CORS permits the configured frontend origin, payloads are capped at 256 KiB,
   and the receiver is globally limited to 10 requests/s with burst 20. CORS is
   not authentication; non-browser callers can forge events. Do not use these
   events for billing or audit trails. Add edge abuse controls if traffic grows.
3. Set frontend Docker **build argument** `VITE_FARO_URL` to that HTTPS `/collect`
   URL and rebuild/redeploy the frontend. Both frontend Dockerfiles accept it.
   Setting only a runtime container variable cannot change a built Vite bundle.
   No Grafana password, service-account token, or backend scrape token belongs in
   frontend build variables. If using CSP, allow this origin in `connect-src`.
4. Browse careers, search, change filters and add/remove comparison careers.
   In Loki Explore start with `{job="frontend"} | json`; inspect a line to find
   the receiver's flattened event fields, then filter by event name. Example
   event counts: `sum(count_over_time({job="frontend"} |= "career_viewed" [1h]))`.

Events: `page_viewed`, `career_viewed`, `comparison_updated`, `filter_changed`,
`search_completed`, and `results_empty`. Searches emit result counts after 600 ms
without changes, never the typed text. Career events wait for a successful current
result and are deduplicated across refetches. Explicit comparison/filter events
represent actions rather than API requests. Empty search results are instrumented;
other empty-data states can be added separately.

Collection is disabled without `VITE_FARO_URL` and respects Do Not Track. SDK code
is lazy-loaded; import/transport failure must not affect application behavior.
Default browser URL/referrer/console instrumentation, persistent sessions and
personal identity collection are disabled. No automatic click tracking or replay.
Usage events are best-effort and subject to blockers, navigation and rate limits;
counts represent collected actions, not unique users. Seven-day Loki retention
also applies to these events. Self-hosted Faro uses ordinary Loki dashboards;
Grafana Cloud's Frontend Observability UI is not installed by this setup.
