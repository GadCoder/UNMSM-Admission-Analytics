# UNMSM Admission Analytics

University admission analytics platform for UNMSM.

This project ingests admission results, normalizes them, and provides analytics views for dashboard exploration, comparisons, rankings, and candidate-level results.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis/Valkey cache
- Frontend: React, TypeScript, Vite, Tailwind, TanStack Query

## MVP Scope

- Academic structure APIs (`/areas`, `/faculties`, `/majors`)
- Admission process APIs (`/processes`)
- Candidate results search API (`/results`)
- Dashboard aggregate APIs (`/dashboard/overview`, `/dashboard/rankings`, `/dashboard/trends/*`)
- Major analytics/trends APIs (`/majors/{major_id}/analytics`, `/majors/{major_id}/trends`)
- CSV imports workflow (`/imports`)
- Frontend pages wired to backend for Dashboard, Explore, Compare, Rankings, and Results

## Repository Layout

```text
backend/     FastAPI app, domain models, repositories, services, migrations
frontend/    React app, design system, feature modules, route pages
openspec/    Product/spec workflow artifacts and synced specifications
```

## Local Development

### 1) Backend

Requirements:

- Python 3.13.x
- `uv` (`https://docs.astral.sh/uv/`)

Setup and run:

```bash
cd backend
uv python install 3.13
uv sync
cp .env.example .env
uv run python main.py
```

Backend runs on `http://localhost:8000`.

Useful commands:

```bash
cd backend
uv run alembic -c alembic.ini upgrade head
uv run alembic -c alembic.ini current
```

### 2) Frontend

Requirements:

- Node.js 20+
- pnpm 10+

Setup and run:

```bash
cd frontend
pnpm install
pnpm dev
```

Useful commands:

```bash
cd frontend
pnpm test
pnpm build
```

## Branching and Release Strategy

- `development`: integration branch for feature work
- `main`: production branch for deployment

Recommended release flow:

1. Merge validated work into `development`
2. Open PR `development` -> `main`
3. Merge, tag release (e.g. `v0.1.0-mvp`)
4. Deploy from `main` (or from the release tag)

## Additional Docs

- Backend bootstrap notes: `backend/README.md`
- Frontend package scripts: `frontend/package.json`
- OpenSpec project context: `openspec/project.md`
- Endpoint snapshot: `backend/ENDPOINTS_REPORT.md`
