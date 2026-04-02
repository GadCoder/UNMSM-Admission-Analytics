from __future__ import annotations

from functools import lru_cache

from redis import Redis

from app.core.config import get_settings


@lru_cache
def get_valkey_client() -> Redis:
    settings = get_settings()
    return Redis.from_url(settings.valkey_url, decode_responses=True)
