"""
Unit and integration tests for AI Intelligence Module.
Tests health check, valid complaint analysis, and validation error handling.
"""

import pytest
from fastapi.testclient import TestClient

try:
    from .main import app
except (ImportError, ValueError):
    from main import app

client = TestClient(app)


def test_health_endpoint():
    """Test GET /health returns 200 OK and valid status structure."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-intelligence-module"


def test_analyze_valid_request():
    """
    Test POST /api/v1/analyze with the required sample payload:
    {
      "complaint_id": "C101",
      "description": "There is a large pothole near the college gate.",
      "image_url": null
    }
    """
    payload = {
        "complaint_id": "C101",
        "description": "There is a large pothole near the college gate.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200

    data = response.json()

    # Validate all 10 required response fields exist
    assert data["complaint_id"] == "C101"
    assert "issue_type" in data and isinstance(data["issue_type"], str)
    assert "severity" in data and data["severity"] in ["Low", "Medium", "High", "Critical"]
    assert "priority" in data and data["priority"] in ["P1", "P2", "P3", "P4"]
    assert "department" in data and len(data["department"]) > 0
    assert "sla_hours" in data and isinstance(data["sla_hours"], int) and data["sla_hours"] > 0
    assert "confidence" in data and 0.0 <= data["confidence"] <= 1.0
    assert "evidence_summary" in data and len(data["evidence_summary"]) > 0
    assert "suggested_action" in data and len(data["suggested_action"]) > 0
    assert "reason" in data and len(data["reason"]) > 0

    # Specifically verify pothole classification
    assert data["issue_type"] == "Road & Potholes"
    assert data["severity"] == "High"
    assert data["department"] == "Roads & Infrastructure Department"


def test_analyze_with_image_url():
    """Test POST /api/v1/analyze when image_url is provided."""
    payload = {
        "complaint_id": "C102",
        "description": "Garbage is overflowing from the municipal bin.",
        "image_url": "https://example.com/evidence/bin_overflow.jpg",
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["complaint_id"] == "C102"
    assert data["issue_type"] == "Garbage & Waste"
    assert "Provided" in data["evidence_summary"]


def test_analyze_invalid_request_missing_description():
    """Test POST /api/v1/analyze fails with 422 if description is missing."""
    payload = {
        "complaint_id": "C103",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("description" in err["loc"] for err in errors)


def test_analyze_invalid_request_missing_complaint_id():
    """Test POST /api/v1/analyze fails with 422 if complaint_id is missing."""
    payload = {
        "description": "Streetlight is not working.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422
    errors = response.json()["detail"]
    assert any("complaint_id" in err["loc"] for err in errors)


def test_analyze_invalid_request_empty_body():
    """Test POST /api/v1/analyze fails with 422 if request body is empty."""
    response = client.post("/api/v1/analyze", json={})
    assert response.status_code == 422


def test_analyze_invalid_request_short_description():
    """Test POST /api/v1/analyze fails with 422 if description is too short (min 3 chars)."""
    payload = {
        "complaint_id": "C104",
        "description": "no",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422

