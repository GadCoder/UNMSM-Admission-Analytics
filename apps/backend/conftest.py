import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def isolate_cache_between_tests(settings):
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "pytest-unmsm-analytics",
        }
    }
    cache.clear()
    yield
    cache.clear()
    cache.clear()
