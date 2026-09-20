"""Health and readiness endpoints for Agent Service (Commit 3)."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..schemas.monitoring import HealthResponse
from ..schemas.agent_event import ReadinessResponse
from ..database import get_db
from ..config import get_settings

router = APIRouter(tags=["System"])
settings = get_settings()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Process Liveness Probe",
)
def get_health(db: Session = Depends(get_db)) -> HealthResponse:
    """
    Liveness check confirming the FastAPI process is running and database is reachable.
    """
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return HealthResponse(
        status="ok",
        service="agent-service",
        database="connected" if db_ok else "unreachable",
    )


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Service Readiness Probe",
)
def get_readiness(response: Response, db: Session = Depends(get_db)) -> ReadinessResponse:
    """
    Readiness probe verifying that all required dependencies (database connection)
    are accessible and responsive.
    Returns HTTP 200 if ready, HTTP 503 if dependencies are unavailable.
    """
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadinessResponse(
            status="not_ready",
            database="unreachable",
            notification_provider=settings.NOTIFICATION_PROVIDER,
            environment=settings.ENVIRONMENT,
        )

    response.status_code = status.HTTP_200_OK
    return ReadinessResponse(
        status="ready",
        database="connected",
        notification_provider=settings.NOTIFICATION_PROVIDER,
        environment=settings.ENVIRONMENT,
    )
