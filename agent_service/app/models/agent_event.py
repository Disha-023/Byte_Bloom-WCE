"""SQLAlchemy model for persistent Agent Event History & Traceability (Commit 3)."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Index
from ..database import Base


def utc_now() -> datetime:
    """Returns current UTC timestamp with timezone awareness."""
    return datetime.now(timezone.utc)


class AgentEvent(Base):
    """
    Persists an individual autonomous agent action or decision for complete audit traceability.

    Fields:
    - id: Primary key auto-increment.
    - complaint_id: Foreign reference to the civic complaint being monitored.
    - agent: Identifier of the agent that performed the action (e.g., 'sla_monitor').
    - action: Controlled event action vocabulary (e.g., 'MONITOR', 'SLA_CALCULATED', 'SLA_WARNING',
              'FOLLOW_UP_TRIGGERED', 'FOLLOW_UP_SKIPPED', 'RECHECK', 'SLA_BREACHED',
              'ESCALATION_TRIGGERED', 'ESCALATION_SKIPPED', 'NOTIFICATION_SENT', 'NOTIFICATION_FAILED').
    - reason: Human-readable explanation of why the action was taken.
    - previous_status: Lifecycle status of the complaint before this event.
    - new_status: Lifecycle status of the complaint after this event.
    - timestamp: UTC timestamp when the event occurred.
    - details: Optional structured metadata dictionary for contextual auditing.
    """

    __tablename__ = "agent_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String(64), index=True, nullable=False)
    agent = Column(String(64), nullable=False, default="sla_monitor")
    action = Column(String(64), nullable=False)
    reason = Column(Text, nullable=False)
    previous_status = Column(String(64), nullable=True)
    new_status = Column(String(64), nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=utc_now, index=True)
    details = Column(JSON, nullable=True)

    __table_args__ = (
        Index("ix_agent_events_complaint_timestamp", "complaint_id", "timestamp"),
    )

    def __repr__(self) -> str:
        return (
            f"<AgentEvent(id={self.id}, complaint_id='{self.complaint_id}', "
            f"action='{self.action}', timestamp='{self.timestamp}')>"
        )
