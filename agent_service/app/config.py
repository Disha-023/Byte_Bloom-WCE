"""Configuration management for Agent Service."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


from pathlib import Path

_SERVER_ENV = Path(__file__).resolve().parent.parent.parent / "server" / ".env"
_ENV_FILES = (str(_SERVER_ENV), ".env") if _SERVER_ENV.exists() else (".env",)


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    # Database configuration (PostgreSQL)
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/civic_agent"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    ENVIRONMENT: str = "development"

    # Central Complaint API integration (Node/Express backend)
    CENTRAL_COMPLAINT_API_URL: str = "http://localhost:5000/api"
    CENTRAL_COMPLAINT_API_TIMEOUT: float = 5.0

    # SLA Monitoring thresholds
    # When remaining SLA duration drops to or below this percentage, status transitions to WARNING
    SLA_WARNING_THRESHOLD_PERCENT: float = 20.0

    # Notification configuration ('none', 'email', 'twilio')
    NOTIFICATION_PROVIDER: str = "none"

    # Email / SMTP configuration
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAIL_FROM: str = "noreply@civic.local"

    # Twilio configuration
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_FROM_NUMBER: str | None = None

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Returns a cached instance of application settings."""
    return Settings()
