"""
Service layer for AI Intelligence Module.
Provides safe placeholder / mock decision logic for Milestone 1.
"""

try:
    from .schemas import AnalyzeRequest, AnalyzeResponse
except (ImportError, ValueError):
    from schemas import AnalyzeRequest, AnalyzeResponse


def analyze_complaint(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyzes a civic complaint using rule-based mock intelligence.
    Acts as a robust placeholder before Gemini LLM integration in Milestone 2.
    """
    desc_lower = request.description.lower()

    # Rule-based mock classification aligned with municipal categories
    if any(word in desc_lower for word in ["pothole", "road", "asphalt", "crater"]):
        issue_type = "Road & Potholes"
        severity = "High"
        priority = "P2"
        department = "Roads & Infrastructure Department"
        sla_hours = 48
        confidence = 0.94
        evidence_summary = (
            f"Citizen reported road damage: '{request.description}'. "
            f"Image evidence: {'Provided (' + request.image_url + ')' if request.image_url else 'None provided'}."
        )
        suggested_action = "Dispatch road inspection team with asphalt patching equipment."
        reason = "Road hazard near pedestrian or transit area poses risk of vehicle accidents and damage."

    elif any(word in desc_lower for word in ["garbage", "trash", "waste", "dump", "bin"]):
        issue_type = "Garbage & Waste"
        severity = "Medium"
        priority = "P3"
        department = "Solid Waste Management Division"
        sla_hours = 24
        confidence = 0.91
        evidence_summary = (
            f"Citizen reported solid waste accumulation: '{request.description}'. "
            f"Image evidence: {'Provided (' + request.image_url + ')' if request.image_url else 'None provided'}."
        )
        suggested_action = "Schedule garbage compactor truck and sanitary worker clearance."
        reason = "Accumulated waste creates sanitation and public health risks."

    elif any(word in desc_lower for word in ["light", "dark", "lamp", "streetlight"]):
        issue_type = "Streetlight"
        severity = "Medium"
        priority = "P3"
        department = "Electrical Engineering & Street Lighting"
        sla_hours = 72
        confidence = 0.89
        evidence_summary = (
            f"Citizen reported lighting failure: '{request.description}'. "
            f"Image evidence: {'Provided (' + request.image_url + ')' if request.image_url else 'None provided'}."
        )
        suggested_action = "Dispatch electrical technician to test fixture wiring and replace lamp."
        reason = "Inadequate street lighting impairs nighttime pedestrian and vehicular visibility."

    elif any(word in desc_lower for word in ["water", "leak", "pipe", "burst"]):
        issue_type = "Water Supply"
        severity = "High"
        priority = "P2"
        department = "Water Supply & Sewerage Board"
        sla_hours = 24
        confidence = 0.93
        evidence_summary = (
            f"Citizen reported water leakage: '{request.description}'. "
            f"Image evidence: {'Provided (' + request.image_url + ')' if request.image_url else 'None provided'}."
        )
        suggested_action = "Isolate pipeline section and dispatch plumbing repair unit."
        reason = "Active water leakage causes potable water wastage and road foundation weakening."

    else:
        # Safe default placeholder
        issue_type = "General Civic Hazard"
        severity = "Medium"
        priority = "P3"
        department = "Municipal Public Works Department"
        sla_hours = 48
        confidence = 0.85
        evidence_summary = (
            f"Citizen reported issue: '{request.description}'. "
            f"Image evidence: {'Provided (' + request.image_url + ')' if request.image_url else 'None provided'}."
        )
        suggested_action = "Initiate preliminary site survey by local ward inspector."
        reason = "General civic grievance requiring on-ground verification."

    return AnalyzeResponse(
        complaint_id=request.complaint_id,
        issue_type=issue_type,
        severity=severity,
        priority=priority,
        department=department,
        sla_hours=sla_hours,
        confidence=confidence,
        evidence_summary=evidence_summary,
        suggested_action=suggested_action,
        reason=reason,
    )
