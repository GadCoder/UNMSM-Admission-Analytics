# Backend Bootstrap

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

The service starts on `http://localhost:8000` and exposes:

- `GET /health`

## Alembic

```bash
cd backend
uv run alembic -c alembic.ini current
uv run alembic -c alembic.ini revision -m "init"
uv run alembic -c alembic.ini upgrade head
```

Alembic uses `DATABASE_URL` from `.env` through `app.core.config`.
