"""Business logic for SLA calculation and complaint monitoring persistence."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models.complaint_monitoring import ComplaintMonitoring
from ..schemas.monitoring import (
    ComplaintCheckRequest,
    ComplaintMonitoringResponse,
    SLAStatusType,
)


def ensure_utc(dt: datetime) -> datetime:
    """Ensures a datetime object is timezone-aware and set to UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def calculate_deadline(created_at: datetime, sla_hours: int) -> datetime:
    """
    Calculates the exact SLA deadline timestamp given the complaint creation time and SLA duration in hours.

    deadline = created_at + sla_hours
    """
    utc_created = ensure_utc(created_at)
    return utc_created + timedelta(hours=sla_hours)


def calculate_remaining_time(
    deadline: datetime,
    current_time: Optional[datetime] = None,
) -> float:
    """
    Calculates remaining time in seconds until SLA expiration.
    Returns a negative value if the deadline has already passed.

    remaining_time = deadline - current_utc_time
    """
    now = ensure_utc(current_time) if current_time is not None else datetime.now(timezone.utc)
    utc_deadline = ensure_utc(deadline)
    return (utc_deadline - now).total_seconds()


def calculate_sla_status(
    sla_hours: int,
    remaining_seconds: float,
    warning_threshold_percent: float = 20.0,
) -> SLAStatusType:
    """
    Determines the SLA monitoring status (NORMAL, WARNING, BREACHED) based on
    the remaining time compared to the total SLA duration.

    Threshold Logic:
    - remaining_seconds <= 0                       -> BREACHED
    - remaining_seconds <= (total_sla * threshold)  -> WARNING
    - remaining_seconds >  (total_sla * threshold)  -> NORMAL
    """
    if remaining_seconds <= 0:
        return "BREACHED"

    total_duration_seconds = float(sla_hours * 3600)
    warning_threshold_seconds = total_duration_seconds * (warning_threshold_percent / 100.0)

    if remaining_seconds <= warning_threshold_seconds:
        return "WARNING"

    return "NORMAL"


def get_monitoring_record(db: Session, complaint_id: str) -> Optional[ComplaintMonitoring]:
    """Retrieves an existing complaint monitoring record by complaint_id."""
    return (
        db.query(ComplaintMonitoring)
        .filter(ComplaintMonitoring.complaint_id == complaint_id)
        .first()
    )


def build_monitoring_response(
    record: ComplaintMonitoring,
    current_time: Optional[datetime] = None,
) -> ComplaintMonitoringResponse:
    """Constructs a clean Pydantic response from a database monitoring record."""
    now = ensure_utc(current_time) if current_time is not None else datetime.now(timezone.utc)
    remaining_sec = calculate_remaining_time(record.deadline, current_time=now)

    return ComplaintMonitoringResponse(
        complaint_id=record.complaint_id,
        status=record.status,
        priority=record.priority,
        department=record.department,
        sla_hours=record.sla_hours,
        deadline=record.deadline,
        sla_status=record.sla_status,
        remaining_seconds=remaining_sec,
        last_checked_at=record.last_checked_at,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


def check_or_create_complaint(
    db: Session,
    request: ComplaintCheckRequest,
    current_time: Optional[datetime] = None,
    warning_threshold_percent: Optional[float] = None,
) -> ComplaintMonitoringResponse:
    """
    Performs a monitoring evaluation for a complaint:
    1. Loads existing monitoring data or creates a new record.
    2. Determines current UTC time.
    3. Calculates deadline and remaining time.
    4. Computes SLA status (NORMAL, WARNING, BREACHED).
    5. Updates last_checked_at and persists state.
    6. Returns structured monitoring response.
    """
    settings = get_settings()
    threshold = (
        warning_threshold_percent
        if warning_threshold_percent is not None
        else settings.SLA_WARNING_THRESHOLD_PERCENT
    )
    now = ensure_utc(current_time) if current_time is not None else datetime.now(timezone.utc)

    record = get_monitoring_record(db, request.complaint_id)

    if record is None:
        # Create new monitoring record
        complaint_created_at = (
            ensure_utc(request.created_at)
            if request.created_at is not None
            else now
        )
        deadline = calculate_deadline(complaint_created_at, request.sla_hours)
        remaining_seconds = calculate_remaining_time(deadline, current_time=now)
        sla_status = calculate_sla_status(request.sla_hours, remaining_seconds, threshold)

        record = ComplaintMonitoring(
            complaint_id=request.complaint_id,
            status=request.status,
            priority=request.priority,
            department=request.department,
            sla_hours=request.sla_hours,
            deadline=deadline,
            sla_status=sla_status,
            last_checked_at=now,
            created_at=complaint_created_at,
            updated_at=now,
        )
        db.add(record)
    else:
        # Update existing record
        record.status = request.status
        record.priority = request.priority
        record.department = request.department

        # If SLA hours changed, recalculate deadline based on original created_at
        if record.sla_hours != request.sla_hours:
            record.sla_hours = request.sla_hours
            record.deadline = calculate_deadline(record.created_at, record.sla_hours)

        remaining_seconds = calculate_remaining_time(record.deadline, current_time=now)
        record.sla_status = calculate_sla_status(record.sla_hours, remaining_seconds, threshold)
        record.last_checked_at = now
        record.updated_at = now

    db.commit()
    db.refresh(record)

    return build_monitoring_response(record, current_time=now)
