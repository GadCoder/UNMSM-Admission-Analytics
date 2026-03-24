from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="UNMSM Admission Analytics API")
    app_version: str = Field(default="0.1.0")
    api_prefix: str = Field(default="")
    debug: bool = Field(default=False)

    database_url: str = Field(..., description="SQLAlchemy database URL")
    valkey_url: str = Field(default="redis://localhost:6379/0")
    cache_enabled: bool = Field(default=False)
    cache_default_ttl_seconds: int = Field(default=3600, ge=1)

    cors_allow_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
    cors_allow_credentials: bool = Field(default=True)
    cors_allow_methods: list[str] = Field(default_factory=lambda: ["*"])
    cors_allow_headers: list[str] = Field(default_factory=lambda: ["*"])

    admin_username: str = Field(default="admin")
    admin_password: str = Field(default="admin123")
    auth_jwt_secret: str = Field(default="change-me-in-production")
    auth_jwt_algorithm: str = Field(default="HS256")
    auth_access_token_expire_minutes: int = Field(default=120, ge=1)

    bulk_max_files_per_batch: int = Field(default=100, ge=1)
    bulk_max_file_size_mb: int = Field(default=25, ge=1)
    bulk_max_total_batch_size_mb: int = Field(default=1024, ge=1)
    bulk_max_import_workers: int = Field(default=4, ge=1)
    bulk_max_items_per_run: int = Field(default=50, ge=1)
    bulk_staging_success_retention_hours: int = Field(default=24, ge=1)
    bulk_staging_failure_retention_hours: int = Field(default=168, ge=1)

    s3_bucket: str | None = Field(default=None)
    s3_region: str = Field(default="us-east-1")
    s3_endpoint_url: str | None = Field(default=None)
    s3_access_key_id: str | None = Field(default=None)
    s3_secret_access_key: str | None = Field(default=None)
    s3_prefix: str = Field(default="imports")
    s3_staging_prefix: str = Field(default="imports-staging")


@lru_cache
def get_settings() -> Settings:
    return Settings()
