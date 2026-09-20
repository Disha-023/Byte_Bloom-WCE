"""Email notification provider with SMTP support and resilient failure handling (Commit 3)."""

import logging
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from typing import Optional

from .base import NotificationProvider, NotificationResult
from ..config import Settings

logger = logging.getLogger("agent_service.notifications.email")


class EmailNotificationProvider(NotificationProvider):
    """
    Dispatches alerts via SMTP email. Fails gracefully if credentials are not configured
    or if SMTP transmission errors occur.
    """

    def __init__(self, settings: Settings):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAIL_FROM

    def send(
        self,
        recipient: str,
        message: str,
        subject: Optional[str] = None,
    ) -> NotificationResult:
        now_str = datetime.now(timezone.utc).isoformat()

        if not self.host or not self.username:
            err = "SMTP host or credentials not configured"
            logger.warning("[EmailNotification Failed] %s", err)
            return NotificationResult(
                success=False,
                channel="email",
                provider="email",
                recipient=recipient,
                message=message,
                timestamp=now_str,
                error=err,
            )

        try:
            msg = MIMEText(message)
            msg["Subject"] = subject or "Civic Complaint Alert"
            msg["From"] = self.from_email
            msg["To"] = recipient

            with smtplib.SMTP(self.host, self.port, timeout=5) as server:
                server.starttls()
                if self.password:
                    server.login(self.username, self.password)
                server.send_message(msg)

            logger.info("[EmailNotification Sent] To: %s | Subject: %s", recipient, subject)
            return NotificationResult(
                success=True,
                channel="email",
                provider="email",
                recipient=recipient,
                message=message,
                timestamp=now_str,
                error=None,
            )
        except Exception as exc:
            logger.error("[EmailNotification Error] %s", exc)
            return NotificationResult(
                success=False,
                channel="email",
                provider="email",
                recipient=recipient,
                message=message,
                timestamp=now_str,
                error=str(exc),
            )
