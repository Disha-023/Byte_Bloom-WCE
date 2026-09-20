"""Pydantic request and response schemas for SLA monitoring."""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


SLAStatusType = Literal["NORMAL", "WARNING", "BREACHED"]


class ComplaintCheckRequest(BaseModel):
    """
    Schema for establishing or updating SLA monitoring on a complaint.
    """
    complaint_id: str = Field(
        ...,
        min_length=1,
        description="Unique identifier for the civic complaint",
        examples=["C101"],
    )
    status: str = Field(
        ...,
        min_length=1,
        description="Current complaint lifecycle status (e.g., 'Pending', 'In Progress', 'Assigned')",
        examples=["In Progress"],
    )
    priority: str = Field(
        ...,
        min_length=1,
        description="Assigned priority level (e.g., 'Low', 'Medium', 'High', 'Critical')",
        examples=["High"],
    )
    department: str = Field(
        ...,
        min_length=1,
        description="Responsible municipal department",
        examples=["Road Public Works"],
    )
    sla_hours: int = Field(
        ...,
        gt=0,
        description="Total SLA resolution duration in hours",
        examples=[48],
    )
    created_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp when the complaint was lodged (UTC). If omitted, current UTC time is used.",
        examples=["2026-09-20T10:00:00Z"],
    )

    @field_validator("complaint_id", "status", "priority", "department")
    @classmethod
    def check_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Field cannot be empty or whitespace only")
        return stripped


class ComplaintMonitoringResponse(BaseModel):
    """
    Structured response conveying current SLA monitoring state.
    """
    complaint_id: str = Field(..., description="Complaint identifier", examples=["C101"])
    status: str = Field(..., description="Current complaint lifecycle status", examples=["In Progress"])
    priority: str = Field(..., description="Complaint priority", examples=["High"])
    department: str = Field(..., description="Responsible municipal department", examples=["Road Public Works"])
    sla_hours: int = Field(..., description="Total SLA allocated in hours", examples=[48])
    deadline: datetime = Field(..., description="UTC timestamp at which the SLA expires")
    sla_status: SLAStatusType = Field(
        ...,
        description="Calculated SLA monitoring status: NORMAL, WARNING, or BREACHED",
        examples=["NORMAL"],
    )
    remaining_seconds: float = Field(
        ...,
        description="Seconds remaining until deadline (negative if breached)",
        examples=[123456.0],
    )
    last_checked_at: datetime = Field(..., description="UTC timestamp of the most recent monitoring check")
    created_at: Optional[datetime] = Field(default=None, description="Complaint creation UTC timestamp")
    updated_at: Optional[datetime] = Field(default=None, description="Monitoring record last updated UTC timestamp")

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    """Service health check response schema."""
    status: str = Field(..., examples=["ok"])
    service: str = Field(..., examples=["agent-service"])
    database: Optional[str] = Field(default=None, description="Database status ('connected' or 'unreachable')")
