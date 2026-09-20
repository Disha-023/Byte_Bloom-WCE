"""Service abstraction for SLA warning follow-up actions (Commit 2).

Provides internal follow-up dispatch and state persistence. External notifications
(Twilio SMS, Email) belong strictly to Commit 3.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session

from ..models.complaint_monitoring import ComplaintMonitoring

logger = logging.getLogger("agent_service.follow_up")


def send_follow_up(
    db: Session,
    record: ComplaintMonitoring,
    remaining_seconds: float,
) -> Dict[str, Any]:
    """
    Executes a follow-up action for a complaint approaching its SLA deadline:
    1. Logs the follow-up dispatch.
    2. Updates persistent flags (follow_up_sent = True, last_action_at = now, agent_state = FOLLOW_UP_SENT).
    3. Commits the transaction to ensure idempotency.
    4. Returns a structured action summary.
    """
    now = datetime.now(timezone.utc)

    # Persist follow-up flag to prevent duplicate dispatches
    record.follow_up_sent = True
    record.agent_state = "FOLLOW_UP_SENT"
    record.last_action_at = now
    record.updated_at = now

    db.commit()
    db.refresh(record)

    logger.info(
        "Follow-up dispatched for complaint '%s' (Department: '%s', Remaining: %.1fs)",
        record.complaint_id,
        record.department,
        remaining_seconds,
    )

    return {
        "follow_up_sent": True,
        "channel": "internal_dispatch",
        "dispatched_at": now.isoformat(),
        "complaint_id": record.complaint_id,
        "department": record.department,
        "message": (
            f"Follow-up dispatched: Complaint {record.complaint_id} is approaching its "
            f"SLA deadline with {remaining_seconds:.0f} seconds remaining."
        ),
    }
