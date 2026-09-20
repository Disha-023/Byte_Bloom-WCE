"""
Service layer for AI Intelligence Module (Commit 3).
Orchestrates civic issue classification, evidence analysis, severity/priority assessment,
department routing, suggested remedial actions, and SLA estimation.
Produces structured nested outputs while preserving top-level backwards compatibility.
"""

try:
    from .schemas import (
        AnalyzeRequest,
        AnalyzeResponse,
        ClassificationBlock,
        EvidenceBlock,
    )
    from .classifier import classify_issue
    from .triage import evaluate_triage
except (ImportError, ValueError):
    from schemas import (
        AnalyzeRequest,
        AnalyzeResponse,
        ClassificationBlock,
        EvidenceBlock,
    )
    from classifier import classify_issue
    from triage import evaluate_triage


def analyze_complaint(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Complete AI pipeline:
    citizen complaint
    → text evidence
    → optional image evidence
    → Gemini / fallback classification
    → severity assessment
    → priority assessment
    → department routing
    → suggested action
    → SLA recommendation
    → structured JSON response
    """
    # Step 1: Classification and evidence analysis
    classification = classify_issue(
        description=request.description,
        image_url=request.image_url,
    )

    # Assemble location context from request
    location_context = {
        "latitude": request.latitude,
        "longitude": request.longitude,
        "address": request.address,
    }

    # Step 2: Triage assessment, department routing, action, and SLA
    assessment_block, routing_block, action_block, reason = evaluate_triage(
        issue_type=classification.issue_type,
        description=request.description,
        evidence_summary=classification.evidence_summary,
        location_context=location_context,
    )

    # Step 3: Build structured blocks
    classification_block = ClassificationBlock(
        issue_type=classification.issue_type,
        confidence=classification.confidence,
    )

    evidence_block = EvidenceBlock(
        image_analyzed=classification.image_analyzed,
        summary=classification.evidence_summary,
    )

    # Step 4: Return full structured response with both nested blocks & flat compatibility
    return AnalyzeResponse(
        complaint_id=request.complaint_id,
        classification=classification_block,
        evidence=evidence_block,
        assessment=assessment_block,
        routing=routing_block,
        action=action_block,
        reason=reason,
        # Flat compatibility fields
        issue_type=classification.issue_type,
        severity=assessment_block.severity,
        priority=assessment_block.priority,
        department=routing_block.department,
        sla_hours=action_block.sla_hours,
        confidence=classification.confidence,
        evidence_summary=classification.evidence_summary,
        suggested_action=action_block.suggested,
        image_analyzed=classification.image_analyzed,
    )
