# Backend

Django and Django REST Framework backend for UNMSM Admission Analytics.

Requires Python 3.14.

## Local setup

From this directory, create an environment and install the project:

```bash
uv sync
```

The project defaults to SQLite when `DATABASE_URL` is unset. To use the local
PostgreSQL container, copy the repository `.env.example` to `.env` and run the
commands from the repository root with Docker Compose.

PostgreSQL connections are reused for 60 seconds by default. Set
`DATABASE_CONN_MAX_AGE=0` to disable reuse, or choose another non-negative
number of seconds. Django checks reused connections before each request. Size
the database connection limit for the maximum number of concurrently running
workers across all replicas (currently three Gunicorn workers per replica),
with room for migrations, management commands, and other services. If the
application moves to ASGI, set this value to `0`; Django recommends disabling
persistent connections in async mode.

## Commands

```bash
uv run python manage.py migrate
uv run python manage.py runserver
```

Import one admission process from the separate `Resultados-UNMSM` repository:

```bash
uv run python manage.py import_results /path/to/Resultados-UNMSM/2026/26-2 --dry-run
uv run python manage.py import_results /path/to/Resultados-UNMSM/2026/26-2
```

The importer supports the historical Spanish CSV schema and the newer combined
name schema. It replaces existing results for the selected process and reports
duplicate/rejected rows instead of silently creating inconsistent records.

## Analytics caching

Public analytics responses are cached for 60 seconds. Set `CACHE_VALKEY_URL` to
a Valkey endpoint (for example, `redis://valkey:6379/0`) in production to share entries
and invalidation across API workers. Without it, Django uses a process-local
cache; each worker warms its own entries and changes from other workers or
management commands may remain stale for up to 60 seconds. Use shared Valkey
for invalidation across processes. Cache failures fall through to the database;
if invalidation fails, existing entries may remain stale until their TTL expires.

Docker Compose includes Valkey 8 with a health check, a 256 MiB cache limit,
and `allkeys-lru` eviction. It has no published host port or persistent storage;
cache misses are rebuilt from the database. Start it with `docker compose up -d valkey`
from the repository root. The Compose backend uses this service by default.
For a backend running on the host, use an accessible Valkey endpoint instead of
the Compose-only `valkey` hostname. Use `rediss://` for a TLS-enabled endpoint.

The `redis://` URL scheme, Django's `RedisCache` backend, and the `redis-py`
client are retained for protocol compatibility; the cache server is Valkey.
See [Valkey client compatibility](https://valkey.io/clients/) and
[Django's supported cache client](https://docs.djangoproject.com/en/6.1/topics/cache/).

Imports invalidate once after the replacement transaction commits. Model saves
and deletes also invalidate after commit, including publication changes in admin.
Future writers using `QuerySet.update()`, `bulk_update()`, or `bulk_create()` must
explicitly schedule `invalidate_analytics_cache` with `transaction.on_commit()`;
those operations do not emit model save signals.

## Public API HTTP caching

Successful `GET` responses below `/api/v1/` advertise `Cache-Control: public,
max-age=30, s-maxage=60`. Browsers may reuse a response for 30 seconds; shared
caches such as a CDN may reuse it for up to 60 seconds. This includes public
catalogs, processes, and analytics. Errors, health checks, and API documentation
are not marked publicly cacheable. These headers allow a CDN to cache responses;
they do not configure or purge a CDN. If a CDN is used, include the complete
query string in its cache key so process, modality, area, and faculty filters
cannot share a response. The 60-second shared TTL bounds how long cached data
can remain visible after an import or publication change.

## API resources

The API health check is available at `/health/`. Interactive API documentation is
available at `/api/docs/` (Swagger UI) and `/api/redoc/` (ReDoc); the raw OpenAPI
schema is available at `/api/schema/`. The versioned API root is available at
`/api/v1/` and advertises these read-only resources:

- `/api/v1/academic-areas/`
- `/api/v1/faculties/`
- `/api/v1/majors/`
- `/api/v1/modalities/`
- `/api/v1/processes/`
- `/api/v1/processes/<id>/`
- `/api/v1/analytics/latest/`
- `/api/v1/analytics/overview/`

## HTTP compression

Django compresses eligible responses when the client sends
`Accept-Encoding: gzip`. This covers API JSON independently of the frontend
Nginx server, which serves the built SPA and does not proxy API requests. Frontend
Nginx compresses text, JavaScript, JSON, and SVG responses of at least 1 KiB and
adds `Vary: Accept-Encoding`.

Check both deployed hosts (the API and web app may use different hosts):

```sh
curl -sS -D - -o /dev/null -H 'Accept-Encoding: gzip' \
  https://api.example.com/api/v1/processes/
curl -sS -D - -o /dev/null -H 'Accept-Encoding: gzip' \
  https://www.example.com/
```

For compressible responses, confirm `Content-Encoding: gzip` and
`Vary: Accept-Encoding`. Use `curl --compressed` to download and transparently
decompress a response while checking it remains readable:

```sh
curl --compressed -fsS -H 'Accept-Encoding: gzip' \
  https://api.example.com/api/v1/processes/ | head
```
