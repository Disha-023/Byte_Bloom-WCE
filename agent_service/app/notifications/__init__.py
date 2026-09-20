"""Notification provider factory and registry (Commit 3)."""

from typing import Optional
from .base import NotificationProvider, NotificationResult
from .noop import NoOpNotificationProvider
from .email import EmailNotificationProvider
from .twilio import TwilioNotificationProvider
from ..config import get_settings, Settings

__all__ = [
    "NotificationProvider",
    "NotificationResult",
    "NoOpNotificationProvider",
    "EmailNotificationProvider",
    "TwilioNotificationProvider",
    "get_notification_provider",
]


def get_notification_provider(settings: Optional[Settings] = None) -> NotificationProvider:
    """Factory creating the configured notification provider."""
    if settings is None:
        settings = get_settings()

    provider_type = (settings.NOTIFICATION_PROVIDER or "none").strip().lower()

    if provider_type == "email":
        return EmailNotificationProvider(settings)
    elif provider_type == "twilio":
        return TwilioNotificationProvider(settings)

    return NoOpNotificationProvider()
