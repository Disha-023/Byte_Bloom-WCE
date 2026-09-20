"""No-op notification provider for testing and local development (Commit 3)."""

import logging
from datetime import datetime, timezone
from typing import Optional

from .base import NotificationProvider, NotificationResult

logger = logging.getLogger("agent_service.notifications.noop")


class NoOpNotificationProvider(NotificationProvider):
    """
    Default safe provider. Logs the dispatch event without calling external networks
    or requiring third-party credentials.
    """

    def send(
        self,
        recipient: str,
        message: str,
        subject: Optional[str] = None,
    ) -> NotificationResult:
        now_str = datetime.now(timezone.utc).isoformat()
        logger.info(
            "[NoOpNotification] To: '%s' | Subject: '%s' | Message: '%s'",
            recipient,
            subject or "None",
            message,
        )
        return NotificationResult(
            success=True,
            channel="noop",
            provider="none",
            recipient=recipient,
            message=message,
            timestamp=now_str,
            error=None,
        )
