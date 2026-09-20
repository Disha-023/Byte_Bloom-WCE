"""Service for handling complaint escalation on SLA breach (Commit 2).

Transitions the complaint lifecycle status to 'Escalated' and updates
the internal agent state and timestamps.
"""

import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from ..models.complaint_monitoring import ComplaintMonitoring

logger = logging.getLogger("agent_service.escalation")


def escalate_complaint(
    db: Session,
    record: ComplaintMonitoring,
) -> ComplaintMonitoring:
    """
    Transitions a complaint to Escalated status upon confirmed SLA breach:
    1. Updates lifecycle status to 'Escalated'.
    2. Updates agent_state to 'ESCALATED'.
    3. Sets escalated_at and last_action_at timestamps in UTC.
    4. Commits the transaction to ensure persistent state.
    5. Returns the updated record.
    """
    now = datetime.now(timezone.utc)

    previous_status = record.status
    record.status = "Escalated"
    record.agent_state = "ESCALATED"
    record.escalated_at = now
    record.last_action_at = now
    record.updated_at = now

    db.commit()
    db.refresh(record)

    logger.warning(
        "Complaint '%s' escalated: status changed from '%s' to 'Escalated' due to SLA breach",
        record.complaint_id,
        previous_status,
    )

    return record
