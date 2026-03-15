from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.core.db import SessionLocal, engine


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
    )

    app.include_router(api_router, prefix=settings.api_prefix)
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = SessionLocal
    return app


app = create_app()
