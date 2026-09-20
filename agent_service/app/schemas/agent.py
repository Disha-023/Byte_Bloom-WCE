"""Pydantic schemas for the Agentic Workflow (Commit 2)."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from .monitoring import SLAStatusType


class AgentRunResponse(BaseModel):
    """
    Structured response returned after executing the LangGraph agent workflow.
    """
    complaint_id: str = Field(..., description="Unique complaint identifier", examples=["C101"])
    previous_status: str = Field(..., description="Complaint status prior to workflow execution", examples=["In Progress"])
    current_status: str = Field(..., description="Complaint status after workflow execution", examples=["Escalated"])
    sla_status: SLAStatusType = Field(..., description="Evaluated SLA temporal status", examples=["BREACHED"])
    agent_state: str = Field(..., description="Internal agent workflow state", examples=["ESCALATED"])
    action_taken: str = Field(
        ...,
        description="Action performed by the agent: 'NONE', 'FOLLOW_UP', or 'ESCALATED'",
        examples=["ESCALATED"],
    )
    follow_up_sent: bool = Field(..., description="Whether a warning follow-up has been dispatched")
    already_escalated: bool = Field(..., description="Whether the complaint was already in an escalated state")
    decision_reason: str = Field(
        ...,
        description="Detailed explanation of the decision taken by the agent",
        examples=["SLA breached and complaint was not previously escalated"],
    )
    remaining_seconds: float = Field(..., description="Seconds remaining until SLA deadline (negative if breached)")
    deadline: datetime = Field(..., description="SLA expiration UTC timestamp")
    last_checked_at: datetime = Field(..., description="UTC timestamp of this evaluation")

    model_config = ConfigDict(from_attributes=True)
