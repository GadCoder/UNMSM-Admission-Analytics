import json
import os
import subprocess
import sys

import pytest


def load_database_settings(**overrides):
    env = {key: value for key, value in os.environ.items() if key not in {
        "DATABASE_URL", "DATABASE_CONN_MAX_AGE",
    }}
    env.update(overrides)
    return subprocess.run(
        [sys.executable, "-c", "import json; from config.settings.base import DATABASES; print(json.dumps(DATABASES['default'], default=str))"],
        env=env, capture_output=True, text=True, check=False,
    )


@pytest.mark.parametrize("age, expected", [(None, 60), ("0", 0), ("120", 120)])
def test_postgres_connection_lifetime_is_configurable(age, expected):
    overrides = {"DATABASE_URL": "postgresql://user@localhost/example"}
    if age is not None:
        overrides["DATABASE_CONN_MAX_AGE"] = age
    result = load_database_settings(**overrides)

    assert result.returncode == 0, result.stderr
    database = json.loads(result.stdout)
    assert database["CONN_MAX_AGE"] == expected
    assert database["CONN_HEALTH_CHECKS"] is True


@pytest.mark.parametrize("age", ["", "invalid", "-1", "1.5"])
def test_invalid_postgres_connection_lifetime_fails_at_startup(age):
    result = load_database_settings(
        DATABASE_URL="postgresql://user@localhost/example", DATABASE_CONN_MAX_AGE=age,
    )

    assert result.returncode != 0
    assert "DATABASE_CONN_MAX_AGE must be a non-negative integer" in result.stderr


def test_postgres_connection_configuration_does_not_affect_sqlite():
    result = load_database_settings(DATABASE_CONN_MAX_AGE="invalid")

    assert result.returncode == 0, result.stderr
    database = json.loads(result.stdout)
    assert database["ENGINE"] == "django.db.backends.sqlite3"
    assert "CONN_MAX_AGE" not in database
    assert "CONN_HEALTH_CHECKS" not in database
