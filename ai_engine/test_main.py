"""
Unit and integration test suite for AI Intelligence Module (Commit 3).
Validates:
1. Pothole complaints (large vs small)
2. Garbage complaints
3. Water leakage complaints
4. Drainage complaints
5. Streetlight complaints
6. Road damage complaints
7. Unclear complaints (fallback to other)
8. Department mapping rules
9. Severity and priority assessment rules
10. Suggested action mapping rules
11. SLA calculation rules
12. Full end-to-end pipeline and structured nested response
13. Health endpoint and input validation
14. Mocked Gemini inference
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

try:
    from .main import app
    from .classifier import classify_issue
    from .triage import (
        ACTION_MAP,
        DEPARTMENT_MAP,
        assess_severity_and_priority,
        calculate_sla,
        evaluate_triage,
    )
except (ImportError, ValueError):
    from main import app
    from classifier import classify_issue
    from triage import (
        ACTION_MAP,
        DEPARTMENT_MAP,
        assess_severity_and_priority,
        calculate_sla,
        evaluate_triage,
    )

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolate_from_live_api(monkeypatch):
    """
    Ensures unit tests do NOT call the live Gemini API over the network,
    satisfying the strict project requirement to use mocks/fallback mode for tests.
    """
    monkeypatch.setenv("GEMINI_API_KEY", "")


# ---------------------------------------------------------------------------
# Test 1: Health Check Endpoint
# ---------------------------------------------------------------------------
def test_health_endpoint():
    """Verify GET /health remains operational."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-intelligence-module"


# ---------------------------------------------------------------------------
# Test 2: Large Pothole Complaint Pipeline
# ---------------------------------------------------------------------------
def test_large_pothole_pipeline():
    """Test deep/large pothole assigns high severity, road_public_works, and inspect_and_repair."""
    payload = {
        "complaint_id": "C-101",
        "description": "There is a large pothole near the college gate causing vehicle hazards.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Nested structured response validation
    assert data["complaint_id"] == "C-101"
    assert data["classification"]["issue_type"] == "pothole"
    assert data["classification"]["confidence"] >= 0.8
    assert data["evidence"]["image_analyzed"] is False
    assert len(data["evidence"]["summary"]) > 0
    assert data["assessment"]["severity"] == "high"
    assert data["assessment"]["priority"] == "high"
    assert data["routing"]["department"] == "road_public_works"
    assert data["action"]["suggested"] == "inspect_and_repair"
    assert data["action"]["sla_hours"] == 48
    assert "road safety risk" in data["reason"] or "pothole" in data["reason"]

    # Flat compatibility fields validation
    assert data["issue_type"] == "pothole"
    assert data["severity"] == "high"
    assert data["priority"] == "high"
    assert data["department"] == "road_public_works"
    assert data["sla_hours"] == 48


# ---------------------------------------------------------------------------
# Test 3: Small Pothole Complaint Pipeline
# ---------------------------------------------------------------------------
def test_small_pothole_pipeline():
    """Test minor/small pothole receives low severity and longer SLA."""
    payload = {
        "complaint_id": "C-102",
        "description": "A small shallow pothole in the residential back lane.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["classification"]["issue_type"] == "pothole"
    assert data["assessment"]["severity"] in ["low", "medium"]
    assert data["assessment"]["priority"] in ["low", "medium"]
    assert data["routing"]["department"] == "road_public_works"
    assert data["action"]["suggested"] == "inspect_and_repair"
    assert data["action"]["sla_hours"] in [72, 120]


# ---------------------------------------------------------------------------
# Test 4: Garbage Complaint Pipeline
# ---------------------------------------------------------------------------
def test_garbage_pipeline():
    """Test overflowing garbage maps to sanitation and inspect_and_remove."""
    payload = {
        "complaint_id": "C-103",
        "description": "Massive overflowing garbage dump on the street corner spreading odor and flies.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["classification"]["issue_type"] == "garbage"
    assert data["routing"]["department"] == "sanitation"
    assert data["action"]["suggested"] == "inspect_and_remove"
    assert data["assessment"]["severity"] in ["medium", "high"]
    assert data["action"]["sla_hours"] in [48, 72]


# ---------------------------------------------------------------------------
# Test 5: Major Water Leakage Pipeline
# ---------------------------------------------------------------------------
def test_major_water_leakage_pipeline():
    """Test burst water pipe maps to water_department and critical/urgent SLA."""
    payload = {
        "complaint_id": "C-104",
        "description": "Major burst water pipe flooding the whole avenue with high pressure water.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["classification"]["issue_type"] == "water_leakage"
    assert data["routing"]["department"] == "water_department"
    assert data["action"]["suggested"] == "inspect_and_repair_leak"
    assert data["assessment"]["severity"] in ["high", "critical"]
    assert data["assessment"]["priority"] in ["high", "urgent"]
    assert data["action"]["sla_hours"] in [24, 48]


# ---------------------------------------------------------------------------
# Test 6: Drainage Issue Pipeline
# ---------------------------------------------------------------------------
def test_drainage_pipeline():
    """Test blocked drainage maps to drainage_department and inspect_and_clear_drainage."""
    payload = {
        "complaint_id": "C-105",
        "description": "Blocked drainage conduit and overflowing sewer creating flooding on sidewalk.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["classification"]["issue_type"] == "drainage"
    assert data["routing"]["department"] == "drainage_department"
    assert data["action"]["suggested"] == "inspect_and_clear_drainage"
    assert data["assessment"]["severity"] in ["high", "critical"]
    assert data["action"]["sla_hours"] in [24, 48]


# ---------------------------------------------------------------------------
# Test 7: Broken Streetlight Pipeline
# ---------------------------------------------------------------------------
def test_broken_streetlight_pipeline():
    """Test broken streetlight maps to electrical_department and inspect_and_repair_light."""
    payload = {
        "complaint_id": "C-106",
        "description": "The streetlight is dark and lamp post has blown fixture near the school crossing.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["classification"]["issue_type"] == "streetlight"
    assert data["routing"]["department"] == "electrical_department"
    assert data["action"]["suggested"] == "inspect_and_repair_light"
    assert data["assessment"]["severity"] in ["medium", "high"]
    assert data["action"]["sla_hours"] in [48, 72]


# ---------------------------------------------------------------------------
# Test 8: Road Damage Pipeline
# ---------------------------------------------------------------------------
def test_road_damage_pipeline():
    """Test road damage maps to road_public_works and inspect_and_repair."""
    payload = {
        "complaint_id": "C-107",
        "description": "Severe road damage and cracked asphalt pavement along the bypass route.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["classification"]["issue_type"] == "road_damage"
    assert data["routing"]["department"] == "road_public_works"
    assert data["action"]["suggested"] == "inspect_and_repair"
    assert data["assessment"]["severity"] in ["high", "critical"]
    assert data["action"]["sla_hours"] in [24, 48]


# ---------------------------------------------------------------------------
# Test 9: Unclear Complaint Pipeline
# ---------------------------------------------------------------------------
def test_unclear_complaint_pipeline():
    """Test unclear complaint maps to other, conservative SLA, and review_and_assign."""
    payload = {
        "complaint_id": "C-108",
        "description": "Something seems strange and unfamiliar in our neighborhood.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["classification"]["issue_type"] == "other"
    assert data["routing"]["department"] == "other"
    assert data["action"]["suggested"] == "review_and_assign"
    assert data["assessment"]["severity"] == "low"
    assert data["assessment"]["priority"] == "low"
    assert data["action"]["sla_hours"] == 120
    assert "additional" in data["reason"].lower() or "detail" in data["reason"].lower()


# ---------------------------------------------------------------------------
# Test 10: Department Mapping Completeness
# ---------------------------------------------------------------------------
def test_department_mapping_rules():
    """Verify exact departmental mapping rules required by Commit 3."""
    assert DEPARTMENT_MAP["pothole"] == "road_public_works"
    assert DEPARTMENT_MAP["road_damage"] == "road_public_works"
    assert DEPARTMENT_MAP["garbage"] == "sanitation"
    assert DEPARTMENT_MAP["water_leakage"] == "water_department"
    assert DEPARTMENT_MAP["drainage"] == "drainage_department"
    assert DEPARTMENT_MAP["streetlight"] == "electrical_department"
    assert DEPARTMENT_MAP["other"] == "other"


# ---------------------------------------------------------------------------
# Test 11: Action Mapping Completeness
# ---------------------------------------------------------------------------
def test_action_mapping_rules():
    """Verify exact suggested action mappings required by Commit 3."""
    assert ACTION_MAP["pothole"] == "inspect_and_repair"
    assert ACTION_MAP["road_damage"] == "inspect_and_repair"
    assert ACTION_MAP["garbage"] == "inspect_and_remove"
    assert ACTION_MAP["water_leakage"] == "inspect_and_repair_leak"
    assert ACTION_MAP["drainage"] == "inspect_and_clear_drainage"
    assert ACTION_MAP["streetlight"] == "inspect_and_repair_light"
    assert ACTION_MAP["other"] == "review_and_assign"


# ---------------------------------------------------------------------------
# Test 12: SLA Calculation Rules
# ---------------------------------------------------------------------------
def test_sla_calculation_rules():
    """Verify SLA calculation produces expected deterministic hours."""
    assert calculate_sla("critical", "urgent") == 24
    assert calculate_sla("high", "high") == 48
    assert calculate_sla("medium", "medium") == 72
    assert calculate_sla("low", "low") == 120


# ---------------------------------------------------------------------------
# Test 13: Complete End-to-End Structured Response
# ---------------------------------------------------------------------------
def test_complete_structured_response_contract():
    """Verify the exact final response structure specified in Commit 3."""
    payload = {
        "complaint_id": "C101",
        "description": "There is a large pothole near the college gate.",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify all nested blocks are present
    assert "classification" in data
    assert "issue_type" in data["classification"]
    assert "confidence" in data["classification"]

    assert "evidence" in data
    assert "image_analyzed" in data["evidence"]
    assert "summary" in data["evidence"]

    assert "assessment" in data
    assert "severity" in data["assessment"]
    assert "priority" in data["assessment"]
    assert "confidence" in data["assessment"]

    assert "routing" in data
    assert "department" in data["routing"]
    assert "confidence" in data["routing"]

    assert "action" in data
    assert "suggested" in data["action"]
    assert "sla_hours" in data["action"]

    assert "reason" in data
    assert isinstance(data["reason"], str) and len(data["reason"]) > 0


# ---------------------------------------------------------------------------
# Test 14: Input Validation Errors (HTTP 422)
# ---------------------------------------------------------------------------
def test_validation_errors():
    """Verify invalid payloads return HTTP 422."""
    assert client.post("/api/v1/analyze", json={"complaint_id": "X"}).status_code == 422
    assert client.post("/api/v1/analyze", json={"description": "Valid"}).status_code == 422
    assert client.post("/api/v1/analyze", json={}).status_code == 422
    assert client.post("/api/v1/analyze", json={"complaint_id": "X", "description": "a"}).status_code == 422


# ---------------------------------------------------------------------------
# Test 15: Mocked Gemini Pipeline
# ---------------------------------------------------------------------------
def test_gemini_mocked_pipeline(monkeypatch):
    """Verify the pipeline integrates when Gemini returns classification."""
    monkeypatch.setenv("GEMINI_API_KEY", "fake_test_key_abc")

    mock_resp = MagicMock()
    mock_resp.text = (
        '{"issue_type": "water_leakage", "confidence": 0.98, '
        '"evidence_summary": "Major pipeline burst observed."}'
    )

    with patch("google.genai.Client") as mock_client_cls:
        mock_instance = MagicMock()
        mock_client_cls.return_value = mock_instance
        mock_instance.models.generate_content.return_value = mock_resp

        payload = {
            "complaint_id": "C-MOCK-1",
            "description": "Major burst pipeline",
            "image_url": None,
        }
        response = client.post("/api/v1/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["classification"]["issue_type"] == "water_leakage"
        assert data["routing"]["department"] == "water_department"
        assert data["action"]["suggested"] == "inspect_and_repair_leak"


# ---------------------------------------------------------------------------
# Test 16: Separate /api/v1/classify Endpoint
# ---------------------------------------------------------------------------
def test_separate_classify_endpoint():
    """Verify POST /api/v1/classify remains functional."""
    payload = {
        "complaint_id": "CLS-1",
        "description": "Streetlight fixture is broken and dark.",
        "image_url": None,
    }
    response = client.post("/api/v1/classify", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["issue_type"] == "streetlight"
    assert "confidence" in data
    assert "evidence_summary" in data


# ---------------------------------------------------------------------------
# Test 17: Unreachable Image URL Handling
# ---------------------------------------------------------------------------
def test_unreachable_image_url_does_not_crash():
    """Verify unreachable image does not crash the service."""
    payload = {
        "complaint_id": "IMG-1",
        "description": "Drainage gutter is blocked and overflowing.",
        "image_url": "https://invalid-non-existent-domain-xyz.com/photo.jpg",
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["classification"]["issue_type"] == "drainage"
    assert data["evidence"]["image_analyzed"] is False


# ---------------------------------------------------------------------------
# Test 18: Analyze Request with Real Location Coordinates & Address
# ---------------------------------------------------------------------------
def test_analyze_with_location_payload():
    """Verify /api/v1/analyze accepts latitude, longitude, and address, and succeeds."""
    payload = {
        "complaint_id": "C-LOC-101",
        "description": "Large pothole near college gate causing traffic issues.",
        "latitude": 16.8524,
        "longitude": 74.5815,
        "address": "Near College Gate, Main Road",
        "image_url": None,
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["complaint_id"] == "C-LOC-101"
    assert data["classification"]["issue_type"] == "pothole"
    assert data["assessment"]["severity"] == "high"
    assert data["routing"]["department"] == "road_public_works"


# ---------------------------------------------------------------------------
# Test 19: Location Boundary Validation Errors (HTTP 422)
# ---------------------------------------------------------------------------
def test_analyze_location_validation_errors():
    """Verify invalid latitude (>90 or <-90) and longitude (>180 or <-180) are rejected."""
    # Latitude > 90
    resp_lat_high = client.post(
        "/api/v1/analyze",
        json={"complaint_id": "C-VAL-1", "description": "Pothole on road", "latitude": 95.0, "longitude": 74.5},
    )
    assert resp_lat_high.status_code == 422

    # Latitude < -90
    resp_lat_low = client.post(
        "/api/v1/analyze",
        json={"complaint_id": "C-VAL-2", "description": "Pothole on road", "latitude": -91.5, "longitude": 74.5},
    )
    assert resp_lat_low.status_code == 422

    # Longitude > 180
    resp_lng_high = client.post(
        "/api/v1/analyze",
        json={"complaint_id": "C-VAL-3", "description": "Pothole on road", "latitude": 16.5, "longitude": 185.0},
    )
    assert resp_lng_high.status_code == 422

    # Longitude < -180
    resp_lng_low = client.post(
        "/api/v1/analyze",
        json={"complaint_id": "C-VAL-4", "description": "Pothole on road", "latitude": 16.5, "longitude": -185.0},
    )
    assert resp_lng_low.status_code == 422


# ---------------------------------------------------------------------------
# Test 20: Structured Location Analysis Object & All 4 Context States
# ---------------------------------------------------------------------------
def test_location_analysis_states():
    """Verify structured location_analysis object and deterministic states without fabricated data."""
    # State 1: Both GPS and address available
    resp1 = client.post(
        "/api/v1/analyze",
        json={
            "complaint_id": "C-LOC-1",
            "description": "Large pothole in roadway.",
            "latitude": 16.8524,
            "longitude": 74.5815,
            "address": "Opposite City Hospital",
        },
    )
    assert resp1.status_code == 200
    loc1 = resp1.json().get("location_analysis")
    assert loc1 is not None
    assert loc1["coordinates_available"] is True
    assert loc1["latitude"] == 16.8524
    assert loc1["longitude"] == 74.5815
    assert loc1["address_available"] is True
    assert loc1["location_confidence"] == 1.0
    assert loc1["location_source"] == "gps_and_address"
    assert loc1["context_state"] == "both GPS and address available"
    assert "Valid GPS coordinates and the submitted address are available" in loc1["summary"]
    assert "Valid GPS coordinates and the submitted address are available" in resp1.json()["reason"]

    # State 2: GPS only (no address)
    resp2 = client.post(
        "/api/v1/analyze",
        json={
            "complaint_id": "C-LOC-2",
            "description": "Large pothole in roadway.",
            "latitude": 16.8524,
            "longitude": 74.5815,
        },
    )
    assert resp2.status_code == 200
    loc2 = resp2.json().get("location_analysis")
    assert loc2 is not None
    assert loc2["coordinates_available"] is True
    assert loc2["address_available"] is False
    assert loc2["location_confidence"] == 0.85
    assert loc2["location_source"] == "gps_only"
    assert loc2["context_state"] == "GPS coordinates available + valid"
    assert "Valid GPS coordinates are available" in loc2["summary"]
    assert "Valid GPS coordinates are available" in resp2.json()["reason"]

    # State 3: Address only (no GPS)
    resp3 = client.post(
        "/api/v1/analyze",
        json={
            "complaint_id": "C-LOC-3",
            "description": "Large pothole in roadway.",
            "address": "Opposite City Hospital",
        },
    )
    assert resp3.status_code == 200
    loc3 = resp3.json().get("location_analysis")
    assert loc3 is not None
    assert loc3["coordinates_available"] is False
    assert loc3["address_available"] is True
    assert loc3["location_confidence"] == 0.60
    assert loc3["location_source"] == "address_only"
    assert loc3["context_state"] == "address available"
    assert "Submitted address is available" in loc3["summary"]
    assert "Submitted address is available" in resp3.json()["reason"]

    # State 4: Location unavailable (no GPS and no address)
    resp4 = client.post(
        "/api/v1/analyze",
        json={
            "complaint_id": "C-LOC-4",
            "description": "Large pothole in roadway.",
        },
    )
    assert resp4.status_code == 200
    loc4 = resp4.json().get("location_analysis")
    assert loc4 is not None
    assert loc4["coordinates_available"] is False
    assert loc4["address_available"] is False
    assert loc4["location_confidence"] == 0.0
    assert loc4["location_source"] == "unavailable"
    assert loc4["context_state"] == "location unavailable"
    assert "Location coordinates and address are unavailable" in loc4["summary"]
    assert "Location coordinates and address are unavailable" in resp4.json()["reason"]
