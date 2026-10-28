import os
from pathlib import Path
from urllib.parse import urlparse

from corsheaders.defaults import default_headers
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parents[2]

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-local-development-key")
DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "modules.academics",
    "modules.admission_processes",
    "modules.results",
    "modules.analytics",
    "modules.ingestion",
    "modules.exports",
]

MIDDLEWARE = [
    "config.observability.RequestObservabilityMiddleware",
    "config.middleware.PublicApiCacheHeadersMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.gzip.GZipMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    raw_conn_max_age = os.getenv("DATABASE_CONN_MAX_AGE", "60")
    try:
        database_conn_max_age = int(raw_conn_max_age)
    except ValueError as error:
        raise ImproperlyConfigured(
            "DATABASE_CONN_MAX_AGE must be a non-negative integer; "
            f"received {raw_conn_max_age!r}."
        ) from error
    if database_conn_max_age < 0:
        raise ImproperlyConfigured(
            "DATABASE_CONN_MAX_AGE must be a non-negative integer; "
            f"received {raw_conn_max_age!r}."
        )

    database = urlparse(DATABASE_URL)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": database.path.lstrip("/"),
            "USER": database.username,
            "PASSWORD": database.password,
            "HOST": database.hostname,
            "PORT": database.port or 5432,
            "CONN_MAX_AGE": database_conn_max_age,
            "CONN_HEALTH_CHECKS": True,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/Lima"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# Configure CACHE_VALKEY_URL in production for a cache shared by API workers.
# The local fallback is process-local and its analytics entries expire in 60s.
CACHE_VALKEY_URL = os.getenv("CACHE_VALKEY_URL")
if CACHE_VALKEY_URL:
    CACHES = {
        "default": {
            # Valkey supports this backend's Redis wire protocol and redis-py client.
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": CACHE_VALKEY_URL,
            "KEY_PREFIX": "unmsm-admission-analytics",
            "OPTIONS": {"socket_connect_timeout": 1, "socket_timeout": 1},
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "unmsm-admission-analytics",
            "TIMEOUT": 60,
        }
    }

SPECTACULAR_SETTINGS = {
    "TITLE": "UNMSM Admission Analytics API",
    "DESCRIPTION": "Public API for UNMSM admission processes and analytics.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

# Metrics are disabled until a dedicated scrape token is configured.
METRICS_BEARER_TOKEN = os.getenv("METRICS_BEARER_TOKEN", "")
APP_RELEASE = os.getenv("APP_RELEASE", "unknown")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"json": {"()": "config.observability.JsonFormatter"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "json"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False}
    },
}

# Allow W3C context from the separately hosted frontend; no baggage propagation.
CORS_ALLOW_HEADERS = (*default_headers, "traceparent", "tracestate")
