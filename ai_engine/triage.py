"""
Civic Triage, Severity Assessment, and Department Routing Service.
Applies deterministic, evidence-based municipal rules to evaluate
severity, priority, responsible department, suggested actions, SLA, and reasons.
"""

from typing import Any, Dict, Optional, Tuple

try:
    from .schemas import (
        AssessmentBlock,
        ActionBlock,
        DepartmentType,
        PriorityLevel,
        RoutingBlock,
        SeverityLevel,
        SuggestedActionType,
        SupportedCategory,
    )
except (ImportError, ValueError):
    from schemas import (
        AssessmentBlock,
        ActionBlock,
        DepartmentType,
        PriorityLevel,
        RoutingBlock,
        SeverityLevel,
        SuggestedActionType,
        SupportedCategory,
    )

# 1. Department Mapping Table (Strict)
DEPARTMENT_MAP: Dict[SupportedCategory, DepartmentType] = {
    "pothole": "road_public_works",
    "road_damage": "road_public_works",
    "garbage": "sanitation",
    "water_leakage": "water_department",
    "drainage": "drainage_department",
    "streetlight": "electrical_department",
    "other": "other",
}

# 2. Suggested Actions Table (Strict)
ACTION_MAP: Dict[SupportedCategory, SuggestedActionType] = {
    "pothole": "inspect_and_repair",
    "road_damage": "inspect_and_repair",
    "garbage": "inspect_and_remove",
    "water_leakage": "inspect_and_repair_leak",
    "drainage": "inspect_and_clear_drainage",
    "streetlight": "inspect_and_repair_light",
    "other": "review_and_assign",
}

# 3. SLA Matrix (Hours)
SLA_HOURS_MAP = {
    ("critical", "urgent"): 24,
    ("critical", "high"): 24,
    ("high", "urgent"): 24,
    ("high", "high"): 48,
    ("high", "medium"): 48,
    ("medium", "high"): 48,
    ("medium", "medium"): 72,
    ("medium", "low"): 72,
    ("low", "medium"): 72,
    ("low", "low"): 120,
}


def calculate_sla(severity: SeverityLevel, priority: PriorityLevel) -> int:
    """Calculates SLA timeframe in hours based on severity and priority."""
    if severity == "critical" or priority == "urgent":
        return 24
    if severity == "high" or priority == "high":
        return 48
    if severity == "medium" or priority == "medium":
        return 72
    return 120


def assess_severity_and_priority(
    issue_type: SupportedCategory,
    description: str,
    evidence_summary: str = "",
    location_context: Optional[Dict[str, Any]] = None,
) -> Tuple[SeverityLevel, PriorityLevel, float, str]:
    """
    Evaluates complaint text, evidence summary, and optional location context to determine:
    (severity, priority, assessment_confidence, reason)
    """
    text = f"{description} {evidence_summary}".lower()

    if issue_type == "pothole":
        # Check for minor indicators first
        if any(w in text for w in ["small", "minor", "shallow", "tiny", "slight", "little"]):
            severity: SeverityLevel = "low"
            priority: PriorityLevel = "low"
            reason = "A small pothole is reported with low immediate risk to vehicular traffic."
        # Check for dangerous / emergency indicators
        elif any(w in text for w in ["accident", "collision", "injury", "fatal", "emergency"]):
            severity = "critical"
            priority = "urgent"
            reason = "A dangerous pothole has caused accidents or immediate road hazard, requiring emergency response."
        else:
            # Default / large pothole
            severity = "high"
            priority = "high"
            reason = "The reported large pothole may create a road safety risk and requires attention from the road/public works department."

        confidence = 0.92

    elif issue_type == "road_damage":
        if any(w in text for w in ["small", "minor", "slight", "hairline", "tiny"]):
            severity = "low"
            priority = "low"
            reason = "Minor road surface wear reported with minimal impact on transit safety."
        elif any(w in text for w in ["collapse", "cave-in", "impassable", "disaster"]):
            severity = "critical"
            priority = "urgent"
            reason = "Severe road collapse or structural breakdown renders the roadway impassable."
        else:
            severity = "high"
            priority = "high"
            reason = "Significant road surface damage creates hazardous driving conditions and requires road crew intervention."

        confidence = 0.90

    elif issue_type == "garbage":
        if any(w in text for w in ["small", "minor", "litter", "few bags", "single"]):
            severity = "low"
            priority = "low"
            reason = "Minor roadside litter reported; suitable for scheduled street cleaning."
        elif any(w in text for w in ["large", "massive", "overflowing", "dump", "health", "hospital", "rotting", "maggots", "days", "toxic"]):
            severity = "high"
            priority = "high"
            reason = "Large or overflowing garbage accumulation presents immediate public health and sanitary concerns."
        else:
            severity = "medium"
            priority = "medium"
            reason = "Accumulated waste requires standard collection and container emptying by sanitation services."

        confidence = 0.91

    elif issue_type == "water_leakage":
        if any(w in text for w in ["small", "minor", "slow drip", "trickle", "seepage"]):
            severity = "medium"
            priority = "medium"
            reason = "Minor water seepage reported; plumbing inspection required to prevent escalation."
        elif any(w in text for w in ["major", "burst", "massive", "flooding", "high pressure", "gushing", "fountain"]):
            severity = "critical"
            priority = "urgent"
            reason = "Major water main rupture causing heavy potable water loss and potential ground erosion."
        else:
            severity = "high"
            priority = "high"
            reason = "Active pipeline leakage threatens water supply conservation and road foundation stability."

        confidence = 0.94

    elif issue_type == "drainage":
        if any(w in text for w in ["small", "minor", "slow drain", "leaves"]):
            severity = "medium"
            priority = "medium"
            reason = "Minor drainage slowdown reported requiring routine conduit clearing."
        elif any(w in text for w in ["flooding", "sewage into homes", "overflowing", "backed up", "hazard", "toxic"]):
            severity = "high"
            priority = "urgent"
            reason = "Drainage backup or sewage overflow creates severe urban flooding and environmental health risks."
        else:
            severity = "high"
            priority = "high"
            reason = "Blocked drainage line requires municipal clearance to avert wastewater overflow."

        confidence = 0.92

    elif issue_type == "streetlight":
        if any(w in text for w in ["school", "crossing", "junction", "highway", "multiple", "consecutive", "crime", "dark street", "dark road"]):
            severity = "high"
            priority = "high"
            reason = "Dark roadway corridor near pedestrian crossing or school zone creates heightened safety risks."
        else:
            severity = "medium"
            priority = "medium"
            reason = "Non-functional streetlight reported; fixture inspection and lamp replacement needed."

        confidence = 0.89

    else:
        # Unclear or general grievance
        severity = "low"
        priority = "low"
        reason = "The complaint does not provide sufficient detail to classify a specific municipal hazard; additional citizen information is needed."
        confidence = 0.70

    return severity, priority, confidence, reason


def evaluate_triage(
    issue_type: SupportedCategory,
    description: str,
    evidence_summary: str = "",
    location_context: Optional[Dict[str, Any]] = None,
) -> Tuple[AssessmentBlock, RoutingBlock, ActionBlock, str]:
    """
    Complete triage evaluator returning typed Assessment, Routing, and Action blocks.
    Location context is accepted as structured context.
    """
    severity, priority, assess_conf, reason = assess_severity_and_priority(
        issue_type=issue_type,
        description=description,
        evidence_summary=evidence_summary,
        location_context=location_context,
    )

    department = DEPARTMENT_MAP.get(issue_type, "other")
    routing_conf = 0.98 if department != "other" else 0.70

    suggested_action = ACTION_MAP.get(issue_type, "review_and_assign")
    sla = calculate_sla(severity, priority)

    assessment_block = AssessmentBlock(
        severity=severity,
        priority=priority,
        confidence=assess_conf,
    )

    routing_block = RoutingBlock(
        department=department,
        confidence=routing_conf,
    )

    action_block = ActionBlock(
        suggested=suggested_action,
        sla_hours=sla,
    )

    return assessment_block, routing_block, action_block, reason

