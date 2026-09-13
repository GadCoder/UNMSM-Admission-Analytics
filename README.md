# UNMSM Admission Analytics

An open-source application for exploring and comparing admission results from
Universidad Nacional Mayor de San Marcos (UNMSM).

## Architecture

The repository is organized as a monorepo:

```text
apps/
  backend/       Django + Django REST Framework API and Django Admin
  fronted/       React public application
packages/        Shared packages, including a future API client
compose.yml      Local PostgreSQL service
```

The backend is a domain-oriented modular monolith. Historical data is loaded
from CSV files through Django management commands; scraping is not part of this
project.

## Getting Started

1. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

The backend and fronted application have separate setup instructions.

For the frontend, see [`apps/fronted/README.md`](apps/fronted/README.md). From that
directory, run `npm install` and `npm run dev`.

## Validation

Frontend checks:

```bash
cd apps/fronted
npm test
npm run lint
npm run build
```

Backend checks:

```bash
cd apps/backend
uv run pytest -q
uv run ruff check .
uv run python manage.py check --deploy
```

To validate the local containers, start the stack with PostgreSQL on an alternate
host port when `5432` is already in use:

```bash
set -eu
POSTGRES_PORT=55432 docker compose up -d postgres backend
ready=false
for i in $(seq 1 30); do
  if curl -fsS http://localhost:8000/health/; then
    ready=true
    break
  fi
  sleep 1
done
$ready
```

The backend image collects static files as the non-root `appuser`; Compose keeps
those files in the named `backend_staticfiles` volume so the development bind
mount does not mask the writable directory.

`check --deploy` intentionally reports HTTPS/cookie/HSTS warnings with local
settings. Production must provide a strong `DJANGO_SECRET_KEY`, disable debug,
and enable the relevant secure transport settings at the reverse proxy and
Django configuration.


The repository follows Gitflow:

- `main` contains production-ready releases.
- `development` is the integration branch.
- Feature work branches from `development` using `feat/<name>` and opens a PR
  back into `development`.
- Release changes are promoted from `development` to `main`.

See [PLAN.md](PLAN.md) for the implementation roadmap.
