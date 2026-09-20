"""Configuration management for Agent Service."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    # Database configuration (PostgreSQL)
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/civic_agent"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    ENVIRONMENT: str = "development"

    # SLA Monitoring thresholds
    # When remaining SLA duration drops to or below this percentage, status transitions to WARNING
    SLA_WARNING_THRESHOLD_PERCENT: float = 20.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Returns a cached instance of application settings."""
    return Settings()
