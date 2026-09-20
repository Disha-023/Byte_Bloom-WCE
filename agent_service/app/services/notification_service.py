"""Notification orchestration service connecting workflow actions with providers (Commit 3)."""

import logging
from typing import Optional
from sqlalchemy.orm import Session

from ..models.complaint_monitoring import ComplaintMonitoring
from ..notifications import get_notification_provider, NotificationResult
from ..config import get_settings, Settings
from .agent_event_service import record_agent_event

logger = logging.getLogger("agent_service.notification_service")


class NotificationService:
    """Orchestrates notification dispatches and records corresponding audit events."""

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.provider = get_notification_provider(self.settings)

    def notify_follow_up(
        self,
        db: Session,
        record: ComplaintMonitoring,
        remaining_seconds: float,
    ) -> NotificationResult:
        """
        Dispatches an SLA warning follow-up notification and records audit events.
        """
        recipient = f"{record.department.lower().replace(' ', '_')}@municipal.local"
        subject = f"[SLA Warning] Complaint {record.complaint_id} Approaching Deadline"
        message = (
            f"URGENT: Civic complaint {record.complaint_id} ({record.department}) has "
            f"{remaining_seconds:.0f} seconds remaining before SLA breach. Immediate action required."
        )

        result = self.provider.send(recipient=recipient, message=message, subject=subject)

        # Record notification audit event
        event_action = "NOTIFICATION_SENT" if result.success else "NOTIFICATION_FAILED"
        event_reason = (
            f"Follow-up notification sent via {result.provider} ({result.channel})"
            if result.success
            else f"Follow-up notification failed: {result.error}"
        )

        record_agent_event(
            db=db,
            complaint_id=record.complaint_id,
            action=event_action,
            reason=event_reason,
            previous_status=record.status,
            new_status=record.status,
            details={
                "channel": result.channel,
                "provider": result.provider,
                "recipient": recipient,
                "success": result.success,
                "error": result.error,
            },
        )

        return result

    def notify_escalation(
        self,
        db: Session,
        record: ComplaintMonitoring,
        reason: str,
    ) -> NotificationResult:
        """
        Dispatches an escalation alert notification upon confirmed SLA breach.
        """
        recipient = "commissioner_office@municipal.local"
        subject = f"[CRITICAL ESCALATION] Complaint {record.complaint_id} Breached SLA"
        message = (
            f"CRITICAL ESCALATION: Complaint {record.complaint_id} ({record.department}) "
            f"has breached its SLA deadline. Status changed to Escalated. Reason: {reason}"
        )

        result = self.provider.send(recipient=recipient, message=message, subject=subject)

        event_action = "NOTIFICATION_SENT" if result.success else "NOTIFICATION_FAILED"
        event_reason = (
            f"Escalation notification sent via {result.provider} ({result.channel})"
            if result.success
            else f"Escalation notification failed: {result.error}"
        )

        record_agent_event(
            db=db,
            complaint_id=record.complaint_id,
            action=event_action,
            reason=event_reason,
            previous_status="In Progress",
            new_status="Escalated",
            details={
                "channel": result.channel,
                "provider": result.provider,
                "recipient": recipient,
                "success": result.success,
                "error": result.error,
            },
        )

        return result
