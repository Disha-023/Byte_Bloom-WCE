"""
Service layer for AI Intelligence Module.
Orchestrates civic issue classification and triage response construction.
Maintains full backwards compatibility with COMMIT 1.
"""

from typing import Dict, Any

try:
    from .schemas import AnalyzeRequest, AnalyzeResponse, SupportedCategory
    from .classifier import classify_issue
except (ImportError, ValueError):
    from schemas import AnalyzeRequest, AnalyzeResponse, SupportedCategory
    from classifier import classify_issue

# Baseline department and triage mapping for controlled categories
CATEGORY_METADATA: Dict[SupportedCategory, Dict[str, Any]] = {
    "pothole": {
        "severity": "High",
        "priority": "P2",
        "department": "Roads & Infrastructure Department",
        "sla_hours": 48,
        "suggested_action": "Dispatch road inspection team.",
        "reason": "The reported road damage may create a safety risk.",
    },
    "road_damage": {
        "severity": "High",
        "priority": "P2",
        "department": "Roads & Infrastructure Department",
        "sla_hours": 48,
        "suggested_action": "Dispatch road repair crew for asphalt resurfacing.",
        "reason": "Road surface damage poses risk of vehicle accidents and damage.",
    },
    "garbage": {
        "severity": "Medium",
        "priority": "P3",
        "department": "Solid Waste Management Division",
        "sla_hours": 24,
        "suggested_action": "Schedule garbage compactor truck and sanitary worker clearance.",
        "reason": "Accumulated waste creates sanitation and public health risks.",
    },
    "water_leakage": {
        "severity": "High",
        "priority": "P2",
        "department": "Water Supply & Sewerage Board",
        "sla_hours": 24,
        "suggested_action": "Isolate pipeline section and dispatch plumbing repair unit.",
        "reason": "Active water leakage causes potable water wastage and road foundation weakening.",
    },
    "drainage": {
        "severity": "High",
        "priority": "P2",
        "department": "Water Supply & Sewerage Board",
        "sla_hours": 24,
        "suggested_action": "Dispatch jetting machine to unclog drainage lines.",
        "reason": "Blocked drainage can lead to wastewater overflow and urban flooding.",
    },
    "streetlight": {
        "severity": "Medium",
        "priority": "P3",
        "department": "Electrical Engineering & Street Lighting",
        "sla_hours": 72,
        "suggested_action": "Dispatch electrical technician to test fixture wiring and replace lamp.",
        "reason": "Inadequate street lighting impairs nighttime pedestrian and vehicular visibility.",
    },
    "other": {
        "severity": "Medium",
        "priority": "P3",
        "department": "Municipal Public Works Department",
        "sla_hours": 48,
        "suggested_action": "Initiate preliminary site survey by local ward inspector.",
        "reason": "General civic grievance requiring on-ground verification.",
    },
}


def analyze_complaint(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyzes a civic complaint by running classification (Gemini or fallback),
    and assembling the structured triage response.
    """
    # Run separate classification service
    classification = classify_issue(
        description=request.description,
        image_url=request.image_url,
    )

    issue_type = classification.issue_type
    meta = CATEGORY_METADATA.get(issue_type, CATEGORY_METADATA["other"])

    return AnalyzeResponse(
        complaint_id=request.complaint_id,
        issue_type=issue_type,
        severity=meta["severity"],
        priority=meta["priority"],
        department=meta["department"],
        sla_hours=meta["sla_hours"],
        confidence=classification.confidence,
        evidence_summary=classification.evidence_summary,
        suggested_action=meta["suggested_action"],
        reason=meta["reason"],
        image_analyzed=classification.image_analyzed,
    )
