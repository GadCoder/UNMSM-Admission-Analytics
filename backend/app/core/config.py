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


@lru_cache
def get_settings() -> Settings:
    return Settings()
