"""
Data schemas for the AI Intelligence Module.
Uses Pydantic for strict request and response validation.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field

# Controlled category taxonomy for civic complaints
SupportedCategory = Literal[
    "pothole",
    "garbage",
    "water_leakage",
    "drainage",
    "streetlight",
    "road_damage",
    "other",
]


class HealthResponse(BaseModel):
    """Schema for health endpoint response."""
    status: str = Field(..., examples=["ok"])
    service: str = Field(..., examples=["ai-intelligence-module"])


class ClassificationResult(BaseModel):
    """
    Structured output from the separate classification service.
    """
    issue_type: SupportedCategory = Field(
        ...,
        description="Controlled civic hazard classification",
        examples=["pothole"],
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score of classification (0.0 to 1.0)",
        examples=[0.94],
    )
    evidence_summary: str = Field(
        ...,
        description="Short, factual summary of observed evidence without chain-of-thought",
        examples=["The complaint describes a large road surface depression consistent with a pothole."],
    )
    image_analyzed: bool = Field(
        default=False,
        description="Indicates whether image evidence was successfully analyzed",
        examples=[False],
    )


class AnalyzeRequest(BaseModel):
    """
    Schema for civic complaint analysis request.
    Example:
    {
      "complaint_id": "C101",
      "description": "There is a large pothole near the college gate.",
      "image_url": null
    }
    """
    complaint_id: str = Field(
        ...,
        min_length=1,
        description="Unique identifier for the civic complaint",
        examples=["C101"],
    )
    description: str = Field(
        ...,
        min_length=3,
        description="Citizen's text description of the civic issue",
        examples=["There is a large pothole near the college gate."],
    )
    image_url: Optional[str] = Field(
        default=None,
        description="Optional URL or path of uploaded image evidence",
        examples=[None],
    )


class AnalyzeResponse(BaseModel):
    """
    Structured schema for AI analysis output.
    Maintains backwards-compatibility with COMMIT 1 and adds image_analyzed flag.
    """
    complaint_id: str = Field(..., description="ID of the analyzed complaint")
    issue_type: SupportedCategory = Field(..., description="Controlled category of civic hazard")
    severity: str = Field(..., description="Severity level: Low, Medium, High, or Critical")
    priority: str = Field(..., description="Triage priority ranking: P1, P2, P3, or P4")
    department: str = Field(..., description="Assigned municipal department responsible for resolution")
    sla_hours: int = Field(..., ge=1, description="Recommended Service Level Agreement resolution timeframe in hours")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the AI classification (0.0 - 1.0)")
    evidence_summary: str = Field(..., description="Short factual summary of text and image evidence")
    suggested_action: str = Field(..., description="Recommended immediate remedial action for field crew")
    reason: str = Field(..., description="Rationale explaining the severity and department routing decisions")
    image_analyzed: bool = Field(default=False, description="Whether image evidence was processed")
