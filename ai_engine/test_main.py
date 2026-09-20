"""
Unit and integration test suite for AI Intelligence Module (COMMIT 2).
Tests cover:
1. Pothole complaint
2. Garbage complaint
3. Water leakage complaint
4. Streetlight complaint
5. Road damage complaint
6. Unclear complaint
7. Missing Gemini API key / fallback mode
8. Existing COMMIT 1 health endpoint
9. Existing POST /api/v1/analyze endpoint
10. Invalid request validation
Additional tests: Gemini mocked call and graceful image failure handling.
"""

import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

try:
    from .main import app
    from .classifier import classify_issue
except (ImportError, ValueError):
    from main import app
    from classifier import classify_issue

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolate_from_live_api(monkeypatch):
    """
    Ensures unit tests do NOT call the real Gemini API over the network,
    matching the strict project requirement to use mocks/fallback mode for automated testing.
    """
    monkeypatch.setenv("GEMINI_API_KEY", "")



# ---------------------------------------------------------------------------
# Test 1: Pothole complaint
# ---------------------------------------------------------------------------
def test_pothole_complaint():
    """Test classification of a pothole complaint into the 'pothole' category."""
    payload = {
        "complaint_id": "P-101",
        "description": "Dangerous pothole crater in the center of the road causing tire damage.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["issue_type"] == "pothole"
    assert data["severity"] == "High"
    assert data["department"] == "Roads & Infrastructure Department"
    assert data["confidence"] >= 0.8
    assert data["image_analyzed"] is False


# ---------------------------------------------------------------------------
# Test 2: Garbage complaint
# ---------------------------------------------------------------------------
def test_garbage_complaint():
    """Test classification of uncollected solid waste into the 'garbage' category."""
    payload = {
        "complaint_id": "G-102",
        "description": "Overflowing garbage dump and rubbish bins spreading on the sidewalk.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["issue_type"] == "garbage"
    assert data["department"] == "Solid Waste Management Division"
    assert data["confidence"] >= 0.8


# ---------------------------------------------------------------------------
# Test 3: Water leakage complaint
# ---------------------------------------------------------------------------
def test_water_leakage_complaint():
    """Test classification of municipal pipeline leak into 'water_leakage'."""
    payload = {
        "complaint_id": "W-103",
        "description": "Massive water leak from a burst pipe flooding the residential corner.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["issue_type"] == "water_leakage"
    assert data["department"] == "Water Supply & Sewerage Board"
    assert data["confidence"] >= 0.8


# ---------------------------------------------------------------------------
# Test 4: Streetlight complaint
# ---------------------------------------------------------------------------
def test_streetlight_complaint():
    """Test classification of broken street light into 'streetlight'."""
    payload = {
        "complaint_id": "S-104",
        "description": "The street light is dark and lamp post has blown bulb near school.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["issue_type"] == "streetlight"
    assert data["department"] == "Electrical Engineering & Street Lighting"
    assert data["confidence"] >= 0.8


# ---------------------------------------------------------------------------
# Test 5: Road damage complaint
# ---------------------------------------------------------------------------
def test_road_damage_complaint():
    """Test classification of road surface deterioration into 'road_damage'."""
    payload = {
        "complaint_id": "R-105",
        "description": "Severe road damage and cracked asphalt pavement along the bypass.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["issue_type"] == "road_damage"
    assert data["department"] == "Roads & Infrastructure Department"
    assert data["confidence"] >= 0.8


# ---------------------------------------------------------------------------
# Test 6: Unclear complaint
# ---------------------------------------------------------------------------
def test_unclear_complaint():
    """Test ambiguous or unmapped complaint falls back gracefully to 'other'."""
    payload = {
        "complaint_id": "U-106",
        "description": "Something strange is happening in our neighborhood.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["issue_type"] == "other"
    assert "general" in data["evidence_summary"].lower() or "unidentifiable" in data["evidence_summary"].lower()


# ---------------------------------------------------------------------------
# Test 7: Missing Gemini API key / fallback mode
# ---------------------------------------------------------------------------
def test_fallback_mode_without_api_key(monkeypatch):
    """Test that missing GEMINI_API_KEY triggers deterministic fallback without crashing."""
    monkeypatch.setenv("GEMINI_API_KEY", "")

    result = classify_issue(
        description="Big pothole in front of gate",
        image_url=None,
    )
    assert result.issue_type == "pothole"
    assert result.confidence > 0.8
    assert result.image_analyzed is False
    assert "pothole" in result.evidence_summary.lower()


# ---------------------------------------------------------------------------
# Test 8: Existing COMMIT 1 health endpoint
# ---------------------------------------------------------------------------
def test_health_endpoint():
    """Verify GET /health remains fully operational from COMMIT 1."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-intelligence-module"


# ---------------------------------------------------------------------------
# Test 9: Existing POST /api/v1/analyze endpoint (backwards compatibility)
# ---------------------------------------------------------------------------
def test_analyze_endpoint_contract():
    """Verify POST /api/v1/analyze matches the exact contract required by user."""
    payload = {
        "complaint_id": "C101",
        "description": "There is a large pothole near the college gate.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify all fields from COMMIT 1 and extended fields are present
    expected_fields = [
        "complaint_id",
        "issue_type",
        "severity",
        "priority",
        "department",
        "sla_hours",
        "confidence",
        "evidence_summary",
        "suggested_action",
        "reason",
        "image_analyzed",
    ]
    for field in expected_fields:
        assert field in data, f"Missing required field: {field}"

    assert data["complaint_id"] == "C101"
    assert data["issue_type"] == "pothole"
    assert data["severity"] == "High"
    assert data["priority"] == "P2"
    assert data["department"] == "Roads & Infrastructure Department"
    assert data["sla_hours"] == 48
    assert data["image_analyzed"] is False


# ---------------------------------------------------------------------------
# Test 10: Invalid request validation
# ---------------------------------------------------------------------------
def test_invalid_request_missing_description():
    """Test 422 returned when description is omitted."""
    response = client.post("/api/v1/analyze", json={"complaint_id": "C107"})
    assert response.status_code == 422


def test_invalid_request_missing_complaint_id():
    """Test 422 returned when complaint_id is omitted."""
    response = client.post("/api/v1/analyze", json={"description": "Valid pothole description"})
    assert response.status_code == 422


def test_invalid_request_empty_body():
    """Test 422 returned when payload is empty."""
    response = client.post("/api/v1/analyze", json={})
    assert response.status_code == 422


def test_invalid_request_short_description():
    """Test 422 returned when description is fewer than 3 characters."""
    response = client.post("/api/v1/analyze", json={"complaint_id": "C108", "description": "hi"})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Additional Test: Mocked Gemini API Success
# ---------------------------------------------------------------------------
def test_gemini_mocked_successful_inference(monkeypatch):
    """Verify Gemini client integration when mocked response is returned."""
    monkeypatch.setenv("GEMINI_API_KEY", "fake_test_key_12345")

    mock_response = MagicMock()
    mock_response.text = (
        '{"issue_type": "water_leakage", "confidence": 0.98, '
        '"evidence_summary": "Active high-pressure water pipe rupture observed.", '
        '"image_analyzed": false}'
    )

    with patch("google.genai.Client") as mock_client_cls:
        mock_client_instance = MagicMock()
        mock_client_cls.return_value = mock_client_instance
        mock_client_instance.models.generate_content.return_value = mock_response

        result = classify_issue("Water pipe burst on main road", image_url=None)
        assert result.issue_type == "water_leakage"
        assert result.confidence == 0.98
        assert "water pipe rupture" in result.evidence_summary.lower()


# ---------------------------------------------------------------------------
# Additional Test: Separate /api/v1/classify endpoint
# ---------------------------------------------------------------------------
def test_separate_classify_endpoint():
    """Verify POST /api/v1/classify returns pure ClassificationResult schema."""
    payload = {
        "complaint_id": "CLS-201",
        "description": "Streetlight on sector 9 is dark and damaged.",
        "image_url": None,
    }
    response = client.post("/api/v1/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["issue_type"] == "streetlight"
    assert "confidence" in data
    assert "evidence_summary" in data
    assert "image_analyzed" in data


# ---------------------------------------------------------------------------
# Additional Test: Unreachable Image URL Handling
# ---------------------------------------------------------------------------
def test_unreachable_image_url_does_not_crash():
    """Verify unreachable image does not crash service and sets image_analyzed=False."""
    payload = {
        "complaint_id": "IMG-301",
        "description": "Drainage gutter is blocked and overflowing.",
        "image_url": "https://invalid-domain-does-not-exist-xyz.com/fake.jpg",
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["issue_type"] == "drainage"
    assert data["image_analyzed"] is False
    assert "could not be" in data["evidence_summary"].lower() or "drainage" in data["evidence_summary"].lower()
