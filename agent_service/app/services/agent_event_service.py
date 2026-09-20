"""Service for persisting and querying Agent Event audit history (Commit 3)."""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from ..models.agent_event import AgentEvent

logger = logging.getLogger("agent_service.events")


def record_agent_event(
    db: Session,
    complaint_id: str,
    action: str,
    reason: str,
    agent: str = "sla_monitor",
    previous_status: Optional[str] = None,
    new_status: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> AgentEvent:
    """
    Persists an agent action or decision event to the PostgreSQL database.
    """
    event = AgentEvent(
        complaint_id=complaint_id,
        agent=agent,
        action=action,
        reason=reason,
        previous_status=previous_status,
        new_status=new_status,
        timestamp=datetime.now(timezone.utc),
        details=details,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    logger.info(
        "AgentEvent recorded [id=%d, complaint_id='%s', action='%s', reason='%s']",
        event.id,
        event.complaint_id,
        event.action,
        event.reason,
    )
    return event


def get_complaint_events(
    db: Session,
    complaint_id: str,
) -> List[AgentEvent]:
    """
    Retrieves all recorded events for a complaint ordered chronologically.
    """
    return (
        db.query(AgentEvent)
        .filter(AgentEvent.complaint_id == complaint_id)
        .order_by(AgentEvent.timestamp.asc(), AgentEvent.id.asc())
        .all()
    )
