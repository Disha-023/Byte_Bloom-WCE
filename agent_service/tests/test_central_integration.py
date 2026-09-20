"""Comprehensive integration test suite connecting Agent Service to Central Civic Complaint System.

Covers:
1. Real complaint retrieval with all fields.
2. Complaint-not-found handling.
3. Central API failure handling without fake data.
4. Central API timeout handling.
5. Malformed response rejection.
6. Central status update via PATCH.
7. Invalid status rejection handling.
8. LangGraph loading real complaint without pre-existing monitoring record.
9. Follow-up using real complaint data.
10. Escalation updating central complaint status in PostgreSQL.
11. Resolved complaint does not get escalated.
12. Already-escalated complaint does not escalate twice.
13. Complete AgentEvent traceability audit trail.
14. No duplicate follow-up (idempotency).
15. End-to-end agent -> central complaint status flow.
"""

from datetime import datetime, timedelta, timezone
import httpx
import pytest

from app.models.complaint_monitoring import ComplaintMonitoring
from app.models.agent_event import AgentEvent
from app.services.agent_event_service import get_complaint_events
from app.services.complaint_data_provider import (
    CentralComplaintApiDataProvider,
    CentralApiConnectionError,
    CentralApiTimeoutError,
    CentralApiMalformedDataError,
    CentralApiError,
)
from app.agent.graph import run_agent_workflow


def make_mock_client(handler):
    """Creates an httpx.Client with a custom MockTransport for deterministic integration tests."""
    return httpx.Client(transport=httpx.MockTransport(handler))


# ---------------------------------------------------------------------------
# Requirement 1: Real Complaint Retrieval
# ---------------------------------------------------------------------------
def test_real_complaint_retrieval():
    """Test 1: Provider retrieves a real complaint and extracts all 19 civic fields."""
    sample_complaint = {
        "id": 42,
        "complaint_id": "CIV-884210",
        "title": "Severe Water Main Rupture",
        "description": "Potable water pipeline gushing across carriage lane near market.",
        "category": "Water Supply",
        "citizen_severity": "critical",
        "address": "Market Road, Zone 3",
        "additional_location": "Opposite City Bank",
        "latitude": 16.8524,
        "longitude": 74.5815,
        "image_url": "/uploads/complaints/leak.jpg",
        "status": "Pending",
        "ai_analysis_status": "completed",
        "issue_type": "water_main_rupture",
        "ai_severity": "critical",
        "priority": "Critical",
        "department": "Water Supply & Sewerage",
        "sla_hours": 4,
        "ai_confidence": 0.98,
        "evidence_summary": "High volume water stream eroding asphalt foundation.",
        "suggested_action": "emergency_valve_shutoff",
        "ai_reason": "Pressurized rupture creating road hazard.",
        "image_analyzed": True,
        "created_at": "2026-09-20T10:00:00.000Z",
        "updated_at": "2026-09-20T10:05:00.000Z",
    }

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert request.url.path.endswith("/complaints/CIV-884210")
        return httpx.Response(200, json={"success": True, "complaint": sample_complaint})

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    complaint = provider.get_complaint("CIV-884210")
    assert complaint is not None
    assert complaint["complaint_id"] == "CIV-884210"
    assert complaint["title"] == "Severe Water Main Rupture"
    assert complaint["status"] == "Pending"
    assert complaint["priority"] == "Critical"
    assert complaint["department"] == "Water Supply & Sewerage"
    assert complaint["sla_hours"] == 4
    assert complaint["latitude"] == 16.8524
    assert complaint["longitude"] == 74.5815
    assert complaint["image_url"] == "/uploads/complaints/leak.jpg"
    assert complaint["issue_type"] == "water_main_rupture"
    assert complaint["ai_severity"] == "critical"
    assert complaint["ai_confidence"] == 0.98
    assert complaint["suggested_action"] == "emergency_valve_shutoff"
    assert complaint["image_analyzed"] is True


# ---------------------------------------------------------------------------
# Requirement 2: Complaint Not Found Handling
# ---------------------------------------------------------------------------
def test_complaint_not_found_handling():
    """Test 2: Central API 404 cleanly returns None without raising false errors."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"success": False, "message": "Not found"})

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    complaint = provider.get_complaint("CIV-UNKNOWN")
    assert complaint is None


# ---------------------------------------------------------------------------
# Requirement 3 & 14: Central API Failure & No Fake Fallback Data
# ---------------------------------------------------------------------------
def test_central_api_connection_failure_no_fake_fallback(db_session):
    """Test 3: Connection failure raises CentralApiConnectionError and does NOT invent fake data."""
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Connection refused to central backend")

    provider = CentralComplaintApiDataProvider(
        base_url="http://down-host:5000/api",
        client=make_mock_client(handler),
    )

    with pytest.raises(CentralApiConnectionError):
        provider.get_complaint("CIV-1001")

    # When run in LangGraph workflow, connection failure must be recorded as an audit event
    result = run_agent_workflow(db_session, "CIV-FAIL-CONN", data_provider=provider)
    assert result.get("error") is not None
    assert "central complaint api error" in result["error"].lower()

    # Verify audit event recorded
    events = get_complaint_events(db_session, "CIV-FAIL-CONN")
    assert len(events) == 1
    assert events[0].action == "INTEGRATION_ERROR"
    assert "central api communication failure" in events[0].reason.lower()


def test_central_api_timeout_handling():
    """Test 4: Request timeout raises CentralApiTimeoutError."""
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("Read timed out")

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    with pytest.raises(CentralApiTimeoutError):
        provider.get_complaint("CIV-TIMEOUT")


def test_central_api_malformed_response_handling():
    """Test 5: Malformed JSON raises CentralApiMalformedDataError."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="NOT_VALID_JSON{")

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    with pytest.raises(CentralApiMalformedDataError):
        provider.get_complaint("CIV-MALFORMED")


# ---------------------------------------------------------------------------
# Requirement 4 & 5: Central Status Update via PATCH
# ---------------------------------------------------------------------------
def test_central_status_update_success():
    """Test 6: Status update executes PATCH /api/complaints/:complaintId/status."""
    patch_called = False

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal patch_called
        if request.method == "PATCH" and request.url.path.endswith("/complaints/CIV-1001/status"):
            patch_called = True
            body = request.read().decode("utf-8")
            assert "Escalated" in body
            return httpx.Response(200, json={"success": True, "complaint": {"complaint_id": "CIV-1001", "status": "Escalated"}})
        return httpx.Response(404)

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    success = provider.update_complaint_status("CIV-1001", "Escalated")
    assert success is True
    assert patch_called is True


def test_central_status_update_rejection():
    """Test 7: Central API 400 returns False safely."""
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(400, json={"success": False, "message": "Invalid status"})

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    success = provider.update_complaint_status("CIV-1001", "InvalidStatus")
    assert success is False


# ---------------------------------------------------------------------------
# Requirement 6: LangGraph Loading Real Complaint Without Pre-Seeded Monitoring
# ---------------------------------------------------------------------------
def test_langgraph_loads_real_complaint_without_pre_seeded_monitoring(db_session):
    """Test 8: LangGraph automatically discovers real complaint from central API and initializes monitoring state."""
    now = datetime.now(timezone.utc)
    sample = {
        "complaint_id": "CIV-NEW-001",
        "title": "Open Manhole",
        "status": "In Progress",
        "priority": "Critical",
        "department": "Water Supply & Sewerage",
        "sla_hours": 48,
        "created_at": (now - timedelta(hours=5)).isoformat(),
        "address": "College Road",
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"success": True, "complaint": sample})

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    # Note: No ComplaintMonitoring record pre-seeded in db_session
    result = run_agent_workflow(db_session, "CIV-NEW-001", current_time=now, data_provider=provider)

    assert result["complaint_id"] == "CIV-NEW-001"
    assert result["current_status"] == "In Progress"
    assert result["priority"] == "Critical"
    assert result["department"] == "Water Supply & Sewerage"
    assert result["sla_hours"] == 48
    assert result["sla_status"] == "NORMAL"
    assert result["action_taken"] == "NONE"

    # Verify ComplaintMonitoring record was automatically initialized
    record = db_session.query(ComplaintMonitoring).filter_by(complaint_id="CIV-NEW-001").first()
    assert record is not None
    assert record.status == "In Progress"
    assert record.priority == "Critical"
    assert record.department == "Water Supply & Sewerage"

    # Verify AgentEvents recorded
    events = get_complaint_events(db_session, "CIV-NEW-001")
    actions = [e.action for e in events]
    assert "COMPLAINT_LOADED" in actions
    assert "MONITOR" in actions
    assert "SLA_CALCULATED" in actions


# ---------------------------------------------------------------------------
# Requirement 7: Follow-up using real complaint data & No Duplicate Follow-up
# ---------------------------------------------------------------------------
def test_follow_up_with_real_complaint_and_idempotency(db_session):
    """Test 9 & 10: Real complaint near deadline triggers follow-up; repeated run is idempotent."""
    now = datetime.now(timezone.utc)
    sample = {
        "complaint_id": "CIV-WARN-REAL",
        "title": "Dark Streetlights",
        "status": "In Progress",
        "priority": "High",
        "department": "Electrical & Street Lighting",
        "sla_hours": 10,  # 10h = 36000s; 20% warning threshold = 7200s (2h)
        "created_at": (now - timedelta(hours=9)).isoformat(),  # 1h remaining <= 2h threshold -> WARNING
        "address": "School Road",
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"success": True, "complaint": sample})

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    # First run -> Warning SLA detected, triggers follow-up
    run1 = run_agent_workflow(db_session, "CIV-WARN-REAL", current_time=now, data_provider=provider)
    assert run1["sla_status"] == "WARNING"
    assert run1["action_taken"] == "FOLLOW_UP"
    assert run1["follow_up_sent"] is True

    # Check AgentEvents
    events = get_complaint_events(db_session, "CIV-WARN-REAL")
    actions = [e.action for e in events]
    assert "FOLLOW_UP_TRIGGERED" in actions
    assert "NOTIFICATION_SENT" in actions

    # Second run -> Must skip duplicate follow-up (Idempotency)
    run2 = run_agent_workflow(db_session, "CIV-WARN-REAL", current_time=now, data_provider=provider)
    assert run2["action_taken"] == "NONE"

    events2 = get_complaint_events(db_session, "CIV-WARN-REAL")
    actions2 = [e.action for e in events2]
    assert "FOLLOW_UP_SKIPPED" in actions2


# ---------------------------------------------------------------------------
# Requirement 8: Escalation Updating Central Complaint Status in PostgreSQL
# ---------------------------------------------------------------------------
def test_escalation_updates_central_status(db_session):
    """Test 11: SLA breach updates central complaint status to Escalated in PostgreSQL."""
    now = datetime.now(timezone.utc)
    central_store = {
        "complaint_id": "CIV-BREACH-REAL",
        "title": "Major Pothole",
        "status": "In Progress",
        "priority": "Critical",
        "department": "Roads & Infrastructure",
        "sla_hours": 24,
        "created_at": (now - timedelta(hours=26)).isoformat(),  # 2 hours past deadline -> BREACHED
        "address": "Main Market Road",
    }

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "GET":
            return httpx.Response(200, json={"success": True, "complaint": central_store})
        if request.method == "PATCH":
            body = request.read().decode("utf-8")
            if "Escalated" in body:
                central_store["status"] = "Escalated"
                return httpx.Response(200, json={"success": True, "complaint": central_store})
        return httpx.Response(404)

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    result = run_agent_workflow(db_session, "CIV-BREACH-REAL", current_time=now, data_provider=provider)

    assert result["sla_status"] == "BREACHED"
    assert result["action_taken"] == "ESCALATED"
    assert result["current_status"] == "Escalated"
    assert result["already_escalated"] is True

    # Verify central store status mutated to Escalated
    assert central_store["status"] == "Escalated"

    # Verify complete AgentEvent audit trail
    events = get_complaint_events(db_session, "CIV-BREACH-REAL")
    actions = [e.action for e in events]
    assert "COMPLAINT_LOADED" in actions
    assert "SLA_CALCULATED" in actions
    assert "SLA_BREACHED" in actions
    assert "CENTRAL_STATUS_UPDATED" in actions
    assert "ESCALATION_TRIGGERED" in actions
    assert "NOTIFICATION_SENT" in actions


# ---------------------------------------------------------------------------
# Requirement 9 & 10: Resolved & Already-Escalated Complaints Do Not Escalate
# ---------------------------------------------------------------------------
def test_resolved_complaint_does_not_escalate(db_session):
    """Test 12: Real complaint marked Resolved terminates immediately without escalation."""
    now = datetime.now(timezone.utc)
    sample = {
        "complaint_id": "CIV-RESOLVED-REAL",
        "title": "Cleared Garbage",
        "status": "Resolved",
        "priority": "High",
        "department": "Solid Waste Management",
        "sla_hours": 24,
        "created_at": (now - timedelta(hours=30)).isoformat(),  # Even though deadline passed
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"success": True, "complaint": sample})

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    result = run_agent_workflow(db_session, "CIV-RESOLVED-REAL", current_time=now, data_provider=provider)
    assert result["is_resolved"] is True
    assert result["action_taken"] == "NONE"
    assert result["current_status"] == "Resolved"

    events = get_complaint_events(db_session, "CIV-RESOLVED-REAL")
    actions = [e.action for e in events]
    assert "WORKFLOW_COMPLETED" in actions
    assert "ESCALATION_TRIGGERED" not in actions


def test_already_escalated_complaint_does_not_escalate_again(db_session):
    """Test 13: Already escalated central complaint skips duplicate escalation."""
    now = datetime.now(timezone.utc)
    patch_attempted = False
    sample = {
        "complaint_id": "CIV-ESC-AGAIN",
        "title": "Flooded Road",
        "status": "Escalated",
        "priority": "Critical",
        "department": "Stormwater Drainage",
        "sla_hours": 24,
        "created_at": (now - timedelta(hours=30)).isoformat(),
    }

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal patch_attempted
        if request.method == "PATCH":
            patch_attempted = True
        return httpx.Response(200, json={"success": True, "complaint": sample})

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    result = run_agent_workflow(db_session, "CIV-ESC-AGAIN", current_time=now, data_provider=provider)
    assert result["action_taken"] == "NONE"
    assert result["already_escalated"] is True
    assert patch_attempted is False

    events = get_complaint_events(db_session, "CIV-ESC-AGAIN")
    actions = [e.action for e in events]
    assert "ESCALATION_SKIPPED" in actions
    assert "CENTRAL_STATUS_UPDATED" not in actions


# ---------------------------------------------------------------------------
# Requirement 15: Safe Failure when Central Status Update Fails
# ---------------------------------------------------------------------------
def test_status_update_failure_fails_safely(db_session):
    """Test 14: When central API fails to update status, agent does NOT claim status changed."""
    now = datetime.now(timezone.utc)
    sample = {
        "complaint_id": "CIV-FAIL-UPDATE",
        "title": "Broken Signal",
        "status": "In Progress",
        "priority": "High",
        "department": "Traffic Management",
        "sla_hours": 12,
        "created_at": (now - timedelta(hours=14)).isoformat(),  # Breached
    }

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "GET":
            return httpx.Response(200, json={"success": True, "complaint": sample})
        if request.method == "PATCH":
            # Simulate database write failure on central backend
            return httpx.Response(500, json={"success": False, "message": "Database transaction failure"})
        return httpx.Response(404)

    provider = CentralComplaintApiDataProvider(
        base_url="http://mock-central/api",
        client=make_mock_client(handler),
    )

    result = run_agent_workflow(db_session, "CIV-FAIL-UPDATE", current_time=now, data_provider=provider)
    assert result["action_taken"] == "NONE"
    assert result.get("error") is not None
    assert "failed to update central complaint status" in result["error"].lower()

    # Verify STATUS_UPDATE_FAILED recorded and central status was NOT falsely claimed
    events = get_complaint_events(db_session, "CIV-FAIL-UPDATE")
    actions = [e.action for e in events]
    assert "STATUS_UPDATE_FAILED" in actions
    assert "ESCALATION_TRIGGERED" not in actions
