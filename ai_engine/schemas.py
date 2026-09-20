"""
Data schemas for the AI Intelligence Module (Commit 3).
Defines controlled vocabularies and structured Pydantic models for
civic issue classification, evidence analysis, triage assessment, department routing,
suggested actions, and SLA timeframes.
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

# Controlled severity ratings
SeverityLevel = Literal["low", "medium", "high", "critical"]

# Controlled priority ratings
PriorityLevel = Literal["low", "medium", "high", "urgent"]

# Controlled municipal departments
DepartmentType = Literal[
    "road_public_works",
    "sanitation",
    "water_department",
    "drainage_department",
    "electrical_department",
    "other",
]

# Controlled suggested actions
SuggestedActionType = Literal[
    "inspect_and_repair",
    "inspect_and_remove",
    "inspect_and_repair_leak",
    "inspect_and_clear_drainage",
    "inspect_and_repair_light",
    "review_and_assign",
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
        examples=["The complaint describes a road surface depression consistent with a pothole."],
    )
    image_analyzed: bool = Field(
        default=False,
        description="Indicates whether image evidence was successfully analyzed",
        examples=[False],
    )


class ClassificationBlock(BaseModel):
    """Nested classification details block."""
    issue_type: SupportedCategory
    confidence: float = Field(..., ge=0.0, le=1.0)


class EvidenceBlock(BaseModel):
    """Nested evidence analysis block."""
    image_analyzed: bool
    summary: str


class AssessmentBlock(BaseModel):
    """Nested severity and priority triage assessment block."""
    severity: SeverityLevel
    priority: PriorityLevel
    confidence: float = Field(..., ge=0.0, le=1.0)


class RoutingBlock(BaseModel):
    """Nested departmental routing block."""
    department: DepartmentType
    confidence: float = Field(..., ge=0.0, le=1.0)


class ActionBlock(BaseModel):
    """Nested remedial action and SLA timeframe block."""
    suggested: SuggestedActionType
    sla_hours: int = Field(..., ge=1)


class LocationAnalysisBlock(BaseModel):
    """
    Transparent location reasoning block containing only factual geographic
    context derived from submitted coordinates and address without fabricated infrastructure.
    """
    coordinates_available: bool = Field(..., description="Whether GPS coordinates are present and valid")
    latitude: Optional[float] = Field(default=None, description="Validated latitude")
    longitude: Optional[float] = Field(default=None, description="Validated longitude")
    address_available: bool = Field(..., description="Whether human-readable address was provided")
    location_confidence: float = Field(..., ge=0.0, le=1.0, description="Normalized location confidence score")
    location_source: str = Field(..., description="Source of location context: gps_and_address, gps_only, address_only, or unavailable")
    context_state: str = Field(..., description="Factual location context state")
    summary: str = Field(..., description="Transparent factual summary of location context")


class AnalyzeRequest(BaseModel):
    """
    Schema for civic complaint analysis request.
    Example:
    {
      "complaint_id": "C101",
      "description": "There is a large pothole near the college gate.",
      "latitude": 16.8524,
      "longitude": 74.5815,
      "address": "Near College Gate",
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
    latitude: Optional[float] = Field(
        default=None,
        ge=-90,
        le=90,
        description="Latitude of the reported civic issue",
        examples=[16.8524],
    )
    longitude: Optional[float] = Field(
        default=None,
        ge=-180,
        le=180,
        description="Longitude of the reported civic issue",
        examples=[74.5815],
    )
    address: Optional[str] = Field(
        default=None,
        description="Human-readable location supplied with the complaint",
        examples=["Near College Gate"],
    )
    image_url: Optional[str] = Field(
        default=None,
        description="Optional URL or path of uploaded image evidence",
        examples=[None],
    )


class AnalyzeResponse(BaseModel):
    """
    Structured schema for AI analysis output.
    Contains nested blocks matching the Commit 3 specification,
    while maintaining top-level fields for backwards compatibility with Commit 1 & Commit 2.
    """
    complaint_id: str = Field(..., description="ID of the analyzed complaint")

    # Structured Commit 3 nested blocks
    classification: ClassificationBlock
    evidence: EvidenceBlock
    assessment: AssessmentBlock
    routing: RoutingBlock
    action: ActionBlock
    location_analysis: Optional[LocationAnalysisBlock] = None
    reason: str

    # Backwards-compatible flat fields
    issue_type: SupportedCategory
    severity: SeverityLevel
    priority: PriorityLevel
    department: DepartmentType
    sla_hours: int
    confidence: float
    evidence_summary: str
    suggested_action: SuggestedActionType
    image_analyzed: bool
