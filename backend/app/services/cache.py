from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Any

from redis import Redis

from app.core.cache import get_valkey_client
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class CacheService:
    def __init__(
        self,
        client: Redis | Any | None = None,
        enabled: bool | None = None,
        default_ttl_seconds: int | None = None,
    ) -> None:
        settings = get_settings()
        self._client = client if client is not None else get_valkey_client()
        self._enabled = settings.cache_enabled if enabled is None else enabled
        self._default_ttl_seconds = (
            settings.cache_default_ttl_seconds if default_ttl_seconds is None else default_ttl_seconds
        )

    def get_json(self, key: str) -> dict[str, Any] | list[Any] | None:
        if not self._enabled:
            return None
        try:
            raw = self._client.get(key)
            if raw is None:
                return None
            value = json.loads(raw)
            if isinstance(value, dict | list):
                return value
            logger.warning("Cache get returned unsupported JSON type for key=%s", key)
            return None
        except Exception as exc:  # noqa: BLE001
            logger.warning("Cache get failed for key=%s: %s", key, exc)
            return None

    def set_json(self, key: str, value: dict[str, Any] | list[Any], ttl_seconds: int | None = None) -> bool:
        if not self._enabled:
            return False
        try:
            ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl_seconds
            payload = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
            self._client.set(key, payload, ex=ttl)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("Cache set failed for key=%s: %s", key, exc)
            return False


@lru_cache
def get_cache_service() -> CacheService:
    return CacheService()
