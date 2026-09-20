"""Automated test suite for LangGraph Agentic Workflow (Commit 2).

Tests:
1. Resolved complaint terminates without action.
2. Normal SLA produces no intervention.
3. Warning SLA triggers follow-up action.
4. Warning SLA with follow-up already sent prevents duplicate dispatch.
5. Re-check after follow-up halts escalation if complaint resolved.
6. Breached SLA transitions complaint to Escalated status.
7. Already escalated complaint prevents duplicate escalation.
8. Repeated workflow execution ensures strict idempotency.
9. Missing complaint returns HTTP 404.
10. API endpoint POST /agent/run/{complaint_id} integration test.
"""

from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from app.models.complaint_monitoring import ComplaintMonitoring
from app.agent.graph import run_agent_workflow

# Fixtures (client, db_session, setup_test_database) are provided by conftest.py


def test_resolved_complaint_stops_workflow(db_session):
    """Test 1: Resolved complaint stops immediately with no follow-up and no escalation."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-RESOLVED",
        status="Resolved",
        priority="High",
        department="Sanitation",
        sla_hours=48,
        deadline=now + timedelta(hours=10),
        sla_status="NORMAL",
        follow_up_sent=False,
        agent_state="MONITORING",
        created_at=now - timedelta(hours=38),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    result = run_agent_workflow(db_session, "C-RESOLVED")

    assert result["is_resolved"] is True
    assert result["action_taken"] == "NONE"
    assert result["current_status"] == "Resolved"
    assert "already resolved" in result["decision_reason"].lower()


def test_normal_sla_no_action(db_session):
    """Test 2: Complaint with normal SLA produces no follow-up and no escalation."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-NORMAL",
        status="In Progress",
        priority="Medium",
        department="Road Public Works",
        sla_hours=48,
        deadline=now + timedelta(hours=40),  # > 20% remaining
        sla_status="NORMAL",
        follow_up_sent=False,
        agent_state="MONITORING",
        created_at=now - timedelta(hours=8),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    result = run_agent_workflow(db_session, "C-NORMAL")

    assert result["sla_status"] == "NORMAL"
    assert result["action_taken"] == "NONE"
    assert result["follow_up_sent"] is False
    assert result["current_status"] == "In Progress"
    assert "normal" in result["decision_reason"].lower()


def test_warning_triggers_follow_up(db_session):
    """Test 3: Complaint approaching SLA deadline triggers follow-up and sets follow_up_sent=True."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-WARN",
        status="In Progress",
        priority="High",
        department="Electrical & Street Lighting",
        sla_hours=10,  # 36,000s total, 20% = 7,200s (2 hrs)
        deadline=now + timedelta(hours=1),  # 1 hour remaining <= 20% threshold -> WARNING
        sla_status="WARNING",
        follow_up_sent=False,
        agent_state="MONITORING",
        created_at=now - timedelta(hours=9),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    result = run_agent_workflow(db_session, "C-WARN")

    assert result["sla_status"] == "WARNING"
    assert result["action_taken"] == "FOLLOW_UP"
    assert result["follow_up_sent"] is True
    assert result["current_status"] == "In Progress"  # Not escalated yet

    # Verify persistent state in DB
    db_session.refresh(record)
    assert record.follow_up_sent is True
    assert record.agent_state == "FOLLOW_UP_SENT"


def test_warning_prevents_duplicate_follow_up(db_session):
    """Test 4: Warning SLA with follow_up_sent=True prevents duplicate follow-up."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-WARN-SENT",
        status="In Progress",
        priority="High",
        department="Electrical & Street Lighting",
        sla_hours=10,
        deadline=now + timedelta(hours=1),
        sla_status="WARNING",
        follow_up_sent=True,  # Already sent
        agent_state="FOLLOW_UP_SENT",
        created_at=now - timedelta(hours=9),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    result = run_agent_workflow(db_session, "C-WARN-SENT")

    assert result["sla_status"] == "WARNING"
    assert result["action_taken"] == "NONE"
    assert result["current_status"] == "In Progress"
    assert "already sent" in result["decision_reason"].lower() or "not breached" in result["decision_reason"].lower()


def test_follow_up_then_resolved_stops_escalation(db_session):
    """Test 5: If complaint becomes Resolved after follow-up, workflow terminates without escalation."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-RECHECK-RES",
        status="In Progress",
        priority="High",
        department="Water Supply & Sewerage",
        sla_hours=10,
        deadline=now - timedelta(minutes=10),  # Expired
        sla_status="BREACHED",
        follow_up_sent=True,
        agent_state="FOLLOW_UP_SENT",
        created_at=now - timedelta(hours=11),
        last_checked_at=now,
    )
    # Simulate authority marking it Resolved before or during recheck
    record.status = "Resolved"
    db_session.add(record)
    db_session.commit()

    result = run_agent_workflow(db_session, "C-RECHECK-RES")

    assert result["is_resolved"] is True
    assert result["current_status"] == "Resolved"
    assert result["action_taken"] == "NONE"


def test_sla_breached_escalates_complaint(db_session):
    """Test 6: Breached SLA escalates an unresolved, unescalated complaint."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-BREACH",
        status="In Progress",
        priority="Critical",
        department="Roads & Infrastructure",
        sla_hours=24,
        deadline=now - timedelta(hours=2),  # 2 hours past deadline -> BREACHED
        sla_status="BREACHED",
        follow_up_sent=True,
        agent_state="FOLLOW_UP_SENT",
        created_at=now - timedelta(hours=26),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    result = run_agent_workflow(db_session, "C-BREACH")

    assert result["sla_status"] == "BREACHED"
    assert result["action_taken"] == "ESCALATED"
    assert result["current_status"] == "Escalated"
    assert result["agent_state"] == "ESCALATED"

    # Verify DB persistence
    db_session.refresh(record)
    assert record.status == "Escalated"
    assert record.agent_state == "ESCALATED"
    assert record.escalated_at is not None


def test_already_escalated_prevents_duplicate_escalation(db_session):
    """Test 7: Already escalated complaint prevents duplicate escalation action."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-ALREADY-ESC",
        status="Escalated",
        priority="Critical",
        department="Roads & Infrastructure",
        sla_hours=24,
        deadline=now - timedelta(hours=5),
        sla_status="BREACHED",
        follow_up_sent=True,
        agent_state="ESCALATED",
        escalated_at=now - timedelta(hours=4),
        created_at=now - timedelta(hours=29),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    result = run_agent_workflow(db_session, "C-ALREADY-ESC")

    assert result["action_taken"] == "NONE"
    assert result["already_escalated"] is True
    assert result["current_status"] == "Escalated"
    assert "already escalated" in result["decision_reason"].lower()


def test_idempotency_repeated_workflow_execution(db_session):
    """Test 8: Running the workflow twice produces action on run 1 and no duplicate on run 2."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-IDEMPOTENT",
        status="In Progress",
        priority="High",
        department="Stormwater Drainage",
        sla_hours=10,
        deadline=now - timedelta(hours=1),  # Breached
        sla_status="BREACHED",
        follow_up_sent=False,
        agent_state="MONITORING",
        created_at=now - timedelta(hours=11),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    # First run -> Escalates
    run1 = run_agent_workflow(db_session, "C-IDEMPOTENT")
    assert run1["action_taken"] == "ESCALATED"
    assert run1["current_status"] == "Escalated"

    # Second run -> No duplicate action
    run2 = run_agent_workflow(db_session, "C-IDEMPOTENT")
    assert run2["action_taken"] == "NONE"
    assert run2["already_escalated"] is True
    assert run2["current_status"] == "Escalated"
    assert "already escalated" in run2["decision_reason"].lower()


def test_complaint_not_found_returns_404(client):
    """Test 9: Calling /agent/run/{complaint_id} with unknown ID returns HTTP 404."""
    response = client.post("/agent/run/NONEXISTENT_999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_api_endpoint_agent_run(client, db_session):
    """Test 10: API integration test verifying POST /agent/run/{complaint_id} response shape."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-API-TEST",
        status="In Progress",
        priority="High",
        department="Road Public Works",
        sla_hours=24,
        deadline=now - timedelta(hours=1),  # Breached
        sla_status="BREACHED",
        follow_up_sent=False,
        agent_state="MONITORING",
        created_at=now - timedelta(hours=25),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    response = client.post("/agent/run/C-API-TEST")
    assert response.status_code == 200

    data = response.json()
    assert data["complaint_id"] == "C-API-TEST"
    assert data["previous_status"] == "In Progress"
    assert data["current_status"] == "Escalated"
    assert data["sla_status"] == "BREACHED"
    assert data["action_taken"] == "ESCALATED"
    assert data["agent_state"] == "ESCALATED"
    assert data["already_escalated"] is True
    assert "decision_reason" in data
    assert data["remaining_seconds"] < 0
