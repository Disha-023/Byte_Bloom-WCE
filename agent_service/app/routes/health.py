"""Health check endpoint for Agent Service."""

from fastapi import APIRouter, status
from ..schemas.monitoring import HealthResponse
from ..database import check_db_connection

router = APIRouter(tags=["System"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
)
def get_health() -> HealthResponse:
    """
    Returns the operational status of the Agent Service and database connection.
    """
    db_ok = check_db_connection()
    return HealthResponse(
        status="ok",
        service="agent-service",
        database="connected" if db_ok else "unreachable",
    )
