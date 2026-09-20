"""Agent event history and audit traceability API endpoints (Commit 3)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.agent_event import AgentEventListResponse
from ..services.agent_event_service import get_complaint_events
from ..services.monitoring_service import get_monitoring_record

router = APIRouter(prefix="/agent-events", tags=["Traceability"])


@router.get(
    "/{complaint_id}",
    response_model=AgentEventListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Agent Audit Trail for a Complaint",
)
def get_complaint_agent_events(
    complaint_id: str,
    db: Session = Depends(get_db),
) -> AgentEventListResponse:
    """
    Retrieves the complete, chronologically ordered event history and decision trail
    for an individual civic complaint:
    - Returns HTTP 404 if the complaint is not found in the monitoring registry.
    - Returns an empty event list with 200 OK if the complaint exists but has no events recorded yet.
    - Orders events ascending by timestamp and ID for reliable deterministic timeline auditing.
    """
    record = get_monitoring_record(db, complaint_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found in monitoring registry",
        )

    events = get_complaint_events(db, complaint_id)
    return AgentEventListResponse(
        complaint_id=complaint_id,
        total_events=len(events),
        events=events,
    )
