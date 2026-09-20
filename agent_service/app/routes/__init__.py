"""Routes package for Agent Service."""

from .health import router as health_router
from .monitoring import router as monitoring_router

__all__ = ["health_router", "monitoring_router"]
