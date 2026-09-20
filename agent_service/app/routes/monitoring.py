"""SLA complaint monitoring endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.monitoring import (
    ComplaintCheckRequest,
    ComplaintMonitoringResponse,
)
from ..services.monitoring_service import (
    get_monitoring_record,
    check_or_create_complaint,
    build_monitoring_response,
)

router = APIRouter(prefix="/monitor", tags=["Monitoring"])


@router.get(
    "/{complaint_id}",
    response_model=ComplaintMonitoringResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Complaint Monitoring State",
)
def get_complaint_monitoring(
    complaint_id: str,
    db: Session = Depends(get_db),
) -> ComplaintMonitoringResponse:
    """
    Retrieves the persisted SLA monitoring state for a specific complaint.
    Returns HTTP 404 if no monitoring record exists for the given complaint ID.
    """
    record = get_monitoring_record(db, complaint_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Monitoring record for complaint '{complaint_id}' not found",
        )
    return build_monitoring_response(record)


@router.post(
    "/check",
    response_model=ComplaintMonitoringResponse,
    status_code=status.HTTP_200_OK,
    summary="Check and Update Complaint SLA Status",
)
def check_complaint_sla(
    request: ComplaintCheckRequest,
    db: Session = Depends(get_db),
) -> ComplaintMonitoringResponse:
    """
    Evaluates SLA progress for a complaint, persists or updates its monitoring record,
    and returns the evaluated monitoring status (NORMAL, WARNING, or BREACHED).
    """
    return check_or_create_complaint(db, request)
