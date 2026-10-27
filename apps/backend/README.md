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

Public analytics responses are cached for 60 seconds. Set `CACHE_REDIS_URL` to
a Redis URL (for example, `redis://redis:6379/0`) in production to share entries
and invalidation across API workers. Without it, Django uses a process-local
cache; each worker warms its own entries and changes from other workers or
management commands may remain stale for up to 60 seconds. Use shared Redis
for invalidation across processes. Cache failures fall through to the database;
if invalidation fails, existing entries may remain stale until their TTL expires.

Imports invalidate once after the replacement transaction commits. Model saves
and deletes also invalidate after commit, including publication changes in admin.
Future writers using `QuerySet.update()`, `bulk_update()`, or `bulk_create()` must
explicitly schedule `invalidate_analytics_cache` with `transaction.on_commit()`;
those operations do not emit model save signals.

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
