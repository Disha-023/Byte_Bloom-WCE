"""
FastAPI Application for AI Intelligence Module.
Provides health monitoring and civic complaint analysis endpoints.
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

try:
    from .schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse
    from .service import analyze_complaint
except (ImportError, ValueError):
    from schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse
    from service import analyze_complaint

app = FastAPI(
    title="Smart Civic AI Intelligence Service",
    description="Microservice for civic complaint triage, severity assessment, and SLA recommendations.",
    version="1.0.0",
)

# Enable CORS for communication with frontend and backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["System"],
    summary="Service Health Check",
)
def get_health() -> HealthResponse:
    """Returns the operational status of the AI Intelligence service."""
    return HealthResponse(status="ok", service="ai-intelligence-module")


@app.post(
    "/api/v1/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    tags=["AI Analysis"],
    summary="Analyze Civic Complaint",
)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyzes citizen civic report text and image evidence.
    Returns structured categorization, severity, priority, department, SLA, and remedial action.
    """
    return analyze_complaint(request)
