"""Pydantic schemas for Agent Traceability & Readiness (Commit 3)."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AgentEventResponse(BaseModel):
    """Schema representing an individual traceable agent event."""
    id: int = Field(..., description="Unique event ID", examples=[1])
    complaint_id: str = Field(..., description="Complaint identifier", examples=["C101"])
    agent: str = Field(..., description="Agent name", examples=["sla_monitor"])
    action: str = Field(..., description="Executed event action", examples=["SLA_WARNING"])
    reason: str = Field(..., description="Reasoning or description of the event", examples=["SLA deadline approaching"])
    previous_status: Optional[str] = Field(default=None, description="Complaint status prior to event", examples=["In Progress"])
    new_status: Optional[str] = Field(default=None, description="Complaint status after event", examples=["In Progress"])
    timestamp: datetime = Field(..., description="UTC timestamp of the event")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Optional structured metadata")

    model_config = ConfigDict(from_attributes=True)


class AgentEventListResponse(BaseModel):
    """Schema representing the chronological history of agent events for a complaint."""
    complaint_id: str = Field(..., description="Complaint identifier", examples=["C101"])
    total_events: int = Field(..., description="Total count of events recorded", examples=[2])
    events: List[AgentEventResponse] = Field(..., description="Chronologically ordered event list")

    model_config = ConfigDict(from_attributes=True)


class ReadinessResponse(BaseModel):
    """Schema for service readiness endpoint (/ready)."""
    status: str = Field(..., description="Service readiness status ('ready' or 'not_ready')", examples=["ready"])
    database: str = Field(..., description="Database connection status", examples=["connected"])
    notification_provider: str = Field(..., description="Configured notification provider", examples=["none"])
    environment: str = Field(..., description="Current running environment", examples=["development"])
