import json
import os
import subprocess
import sys

import pytest


@pytest.mark.parametrize("url", [None, "redis://valkey:6379/0", "rediss://cache.example:6379/0"])
def test_valkey_cache_configuration(url):
    env = {key: value for key, value in os.environ.items() if key != "CACHE_VALKEY_URL"}
    if url is not None:
        env["CACHE_VALKEY_URL"] = url
    result = subprocess.run(
        [sys.executable, "-c", "import json; from config.settings.base import CACHES; print(json.dumps(CACHES['default']))"],
        env=env, capture_output=True, text=True, check=True,
    )
    cache = json.loads(result.stdout)

    if url is None:
        assert cache["BACKEND"] == "django.core.cache.backends.locmem.LocMemCache"
        assert cache["TIMEOUT"] == 60
    else:
        assert cache["BACKEND"] == "django.core.cache.backends.redis.RedisCache"
        assert cache["LOCATION"] == url
        assert cache["OPTIONS"] == {"socket_connect_timeout": 1, "socket_timeout": 1}
