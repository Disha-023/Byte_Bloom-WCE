"""FastAPI application entry point for Member 4 Agent Service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import (
    health_router,
    monitoring_router,
    agent_router,
    agent_events_router,
)

settings = get_settings()

app = FastAPI(
    title="Smart Civic Agent Service",
    description="Agentic Complaint Monitoring, SLA Enforcement, Escalation & Traceability Service (Member 4)",
    version="1.2.0",
)

# Enable CORS to allow secure communication across local microservices and frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(monitoring_router)
app.include_router(agent_router)
app.include_router(agent_events_router)


@app.get("/", tags=["System"])
def root():
    """Root endpoint providing service metadata."""
    return {
        "service": "Smart Civic Agent Service",
        "member": "Member 4 - Agentic Complaint Monitoring & Traceability",
        "status": "online",
        "version": "1.2.0",
        "endpoints": {
            "health": "/health",
            "ready": "/ready",
            "get_monitor": "/monitor/{complaint_id}",
            "check_monitor": "/monitor/check",
            "run_agent": "/agent/run/{complaint_id}",
            "agent_events": "/agent-events/{complaint_id}",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
    )
