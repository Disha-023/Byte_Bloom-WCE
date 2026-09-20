"""Base interfaces and data schemas for notification providers (Commit 3)."""

from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel, Field


class NotificationResult(BaseModel):
    """Structured result returned by any notification provider dispatch."""
    success: bool = Field(..., description="Whether the notification was successfully sent")
    channel: str = Field(..., description="Communication channel ('email', 'sms', 'noop')")
    provider: str = Field(..., description="Active provider identifier ('none', 'email', 'twilio')")
    recipient: str = Field(..., description="Target recipient address or phone number")
    message: str = Field(..., description="Content dispatched")
    timestamp: str = Field(..., description="UTC ISO timestamp of dispatch")
    error: Optional[str] = Field(default=None, description="Error message if dispatch failed")


class NotificationProvider(ABC):
    """Abstract interface defining the contract for notification providers."""

    @abstractmethod
    def send(
        self,
        recipient: str,
        message: str,
        subject: Optional[str] = None,
    ) -> NotificationResult:
        """Dispatches a notification to the recipient."""
        pass
