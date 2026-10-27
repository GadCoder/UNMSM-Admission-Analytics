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
