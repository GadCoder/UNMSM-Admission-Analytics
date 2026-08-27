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

The API health check is available at `/health/`.
