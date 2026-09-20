"""
FastAPI Application for AI Intelligence Module.
Provides health monitoring, civic issue classification, and complaint triage analysis.
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

try:
    from .schemas import AnalyzeRequest, AnalyzeResponse, ClassificationResult, HealthResponse
    from .service import analyze_complaint
    from .classifier import classify_issue
except (ImportError, ValueError):
    from schemas import AnalyzeRequest, AnalyzeResponse, ClassificationResult, HealthResponse
    from service import analyze_complaint
    from classifier import classify_issue

app = FastAPI(
    title="Smart Civic AI Intelligence Service",
    description="Microservice for civic complaint triage, severity assessment, and SLA recommendations.",
    version="2.0.0",
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
    "/api/v1/classify",
    response_model=ClassificationResult,
    status_code=status.HTTP_200_OK,
    tags=["Classification"],
    summary="Classify Civic Issue",
)
def classify(request: AnalyzeRequest) -> ClassificationResult:
    """
    Dedicated classification service endpoint.
    Returns controlled category classification, confidence, and factual evidence summary.
    """
    return classify_issue(description=request.description, image_url=request.image_url)


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
    Returns structured categorization, severity, priority, department, SLA, remedial action,
    and image_analyzed status.
    """
    return analyze_complaint(request)
