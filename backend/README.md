# Backend

FastAPI backend for UNMSM Admission Analytics.

## Tech

- Python 3.13
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Redis/Valkey cache

## Requirements

- Python 3.13.x
- `uv` (`https://docs.astral.sh/uv/`)

## Setup

```bash
cd backend
uv python install 3.13
uv sync
cp .env.example .env
```

## Run API

```bash
cd backend
uv run python main.py
```

Default API URL: `http://localhost:8000`.

## Database Migrations

```bash
cd backend
uv run alembic -c alembic.ini current
uv run alembic -c alembic.ini upgrade head
```

Alembic reads `DATABASE_URL` from backend env config.

## API Contract Snapshot

- Endpoint report: `backend/ENDPOINTS_REPORT.md`
- Route implementations: `backend/app/api/routes/`

## Service Structure

- `app/api/routes/`: HTTP endpoints
- `app/schemas/`: request/response models
- `app/models/`: SQLAlchemy ORM models
- `app/repositories/`: query/data access layer
- `app/services/`: business logic and caching orchestration
