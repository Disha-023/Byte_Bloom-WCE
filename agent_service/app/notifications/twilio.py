"""Twilio SMS notification provider with resilient failure handling (Commit 3)."""

import logging
from datetime import datetime, timezone
from typing import Optional
import httpx

from .base import NotificationProvider, NotificationResult
from ..config import Settings

logger = logging.getLogger("agent_service.notifications.twilio")


class TwilioNotificationProvider(NotificationProvider):
    """
    Dispatches SMS alerts via Twilio REST API. Fails gracefully if credentials are
    unconfigured or network/API errors occur.
    """

    def __init__(self, settings: Settings):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.from_number = settings.TWILIO_FROM_NUMBER

    def send(
        self,
        recipient: str,
        message: str,
        subject: Optional[str] = None,
    ) -> NotificationResult:
        now_str = datetime.now(timezone.utc).isoformat()

        if not self.account_sid or not self.auth_token or not self.from_number:
            err = "Twilio account_sid, auth_token, or from_number not configured"
            logger.warning("[TwilioNotification Failed] %s", err)
            return NotificationResult(
                success=False,
                channel="sms",
                provider="twilio",
                recipient=recipient,
                message=message,
                timestamp=now_str,
                error=err,
            )

        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
            data = {
                "To": recipient,
                "From": self.from_number,
                "Body": message,
            }
            resp = httpx.post(
                url,
                data=data,
                auth=(self.account_sid, self.auth_token),
                timeout=5.0,
            )

            if resp.status_code in (200, 201):
                logger.info("[TwilioNotification Sent] To: %s", recipient)
                return NotificationResult(
                    success=True,
                    channel="sms",
                    provider="twilio",
                    recipient=recipient,
                    message=message,
                    timestamp=now_str,
                    error=None,
                )
            else:
                err = f"Twilio API error {resp.status_code}: {resp.text}"
                logger.error("[TwilioNotification Error] %s", err)
                return NotificationResult(
                    success=False,
                    channel="sms",
                    provider="twilio",
                    recipient=recipient,
                    message=message,
                    timestamp=now_str,
                    error=err,
                )
        except Exception as exc:
            logger.error("[TwilioNotification Exception] %s", exc)
            return NotificationResult(
                success=False,
                channel="sms",
                provider="twilio",
                recipient=recipient,
                message=message,
                timestamp=now_str,
                error=str(exc),
            )
