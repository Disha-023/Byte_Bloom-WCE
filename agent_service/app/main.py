"""FastAPI application entry point for Member 4 Agent Service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import health_router, monitoring_router

settings = get_settings()

app = FastAPI(
    title="Smart Civic Agent Service",
    description="Agentic Complaint Monitoring & SLA Enforcement Service (Member 4 - Commit 1 Foundation)",
    version="1.0.0",
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


@app.get("/", tags=["System"])
def root():
    """Root endpoint providing service metadata."""
    return {
        "service": "Smart Civic Agent Service",
        "member": "Member 4 - Agentic Complaint Monitoring",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "get_monitor": "/monitor/{complaint_id}",
            "check_monitor": "/monitor/check",
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
