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

## Development Workflow

The repository follows Gitflow:

- `main` contains production-ready releases.
- `development` is the integration branch.
- Feature work branches from `development` using `feat/<name>` and opens a PR
  back into `development`.
- Release changes are promoted from `development` to `main`.

See [PLAN.md](PLAN.md) for the implementation roadmap.
