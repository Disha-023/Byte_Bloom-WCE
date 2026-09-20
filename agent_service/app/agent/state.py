"""State definition for LangGraph agent workflow (Commit 2)."""

from datetime import datetime
from typing import Optional, TypedDict


class AgentWorkflowState(TypedDict, total=False):
    """
    Typed state object for the LangGraph SLA follow-up and escalation workflow.

    Fields:
    - complaint_id: Unique civic complaint identifier.
    - current_status: Current lifecycle status of the complaint ('Pending', 'In Progress', 'Resolved', 'Escalated').
    - previous_status: Complaint status before this workflow run.
    - priority: Priority rating ('Low', 'Medium', 'High', 'Critical').
    - department: Responsible municipal department.
    - sla_hours: Total SLA allocated in hours.
    - deadline: UTC timestamp when SLA expires.
    - sla_status: Evaluated SLA status ('NORMAL', 'WARNING', 'BREACHED').
    - remaining_seconds: Seconds remaining until deadline (negative if breached).
    - follow_up_sent: Whether an SLA warning follow-up has been dispatched.
    - already_escalated: Whether the complaint has already been escalated.
    - is_resolved: Whether the complaint is in 'Resolved' status.
    - action_taken: Action executed during this run ('NONE', 'FOLLOW_UP', 'ESCALATED').
    - agent_state: Internal agent workflow state ('MONITORING', 'FOLLOW_UP_SENT', 'ESCALATED', 'RESOLVED').
    - decision_reason: Human-readable explanation of the agent's decision.
    - last_checked_at: Timestamp of the latest evaluation.
    - error: Optional error message if the workflow encountered a failure.
    """

    complaint_id: str
    current_status: str
    previous_status: str
    priority: str
    department: str
    sla_hours: int
    deadline: datetime
    sla_status: str
    remaining_seconds: float
    follow_up_sent: bool
    already_escalated: bool
    is_resolved: bool
    action_taken: str
    agent_state: str
    decision_reason: str
    last_checked_at: datetime
    error: Optional[str]
