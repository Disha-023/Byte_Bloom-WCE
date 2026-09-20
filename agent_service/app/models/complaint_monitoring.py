"""SQLAlchemy model for persistent SLA complaint monitoring."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from ..database import Base


def utc_now() -> datetime:
    """Returns the current UTC timestamp with timezone awareness."""
    return datetime.now(timezone.utc)


class ComplaintMonitoring(Base):
    """
    Persists the active SLA monitoring state for a civic complaint.

    Fields:
    - id: Auto-incrementing primary key.
    - complaint_id: Unique business identifier for the civic issue (e.g., 'C101').
    - status: Operational lifecycle status from the complaint workflow
              (e.g., 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Escalated').
    - priority: Priority rating (e.g., 'Low', 'Medium', 'High', 'Critical').
    - department: Responsible municipal department.
    - sla_hours: Total SLA duration in hours assigned to this complaint.
    - deadline: UTC timestamp when the SLA expires (created_at + sla_hours).
    - sla_status: Current monitoring SLA state ('NORMAL', 'WARNING', 'BREACHED').
    - last_checked_at: Timestamp of the most recent monitoring evaluation.
    - created_at: Initial creation timestamp of the complaint (UTC).
    - updated_at: Last timestamp this monitoring record was updated (UTC).
    """

    __tablename__ = "complaint_monitoring"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String(64), unique=True, index=True, nullable=False)
    status = Column(String(64), nullable=False)
    priority = Column(String(64), nullable=False)
    department = Column(String(128), nullable=False)
    sla_hours = Column(Integer, nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=False)
    sla_status = Column(String(32), nullable=False, default="NORMAL")
    agent_state = Column(String(64), nullable=False, default="MONITORING")
    follow_up_sent = Column(Boolean, nullable=False, default=False)
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    last_action_at = Column(DateTime(timezone=True), nullable=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    def __repr__(self) -> str:
        return (
            f"<ComplaintMonitoring("
            f"complaint_id='{self.complaint_id}', "
            f"status='{self.status}', "
            f"sla_status='{self.sla_status}', "
            f"deadline='{self.deadline}'"
            f")>"
        )
