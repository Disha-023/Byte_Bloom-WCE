"""Automated test suite for Agent Event Traceability & History (Commit 3)."""

from datetime import datetime, timedelta, timezone
import pytest
from app.models.complaint_monitoring import ComplaintMonitoring
from app.models.agent_event import AgentEvent
from app.services.agent_event_service import record_agent_event, get_complaint_events
from app.agent.graph import run_agent_workflow

# Fixtures (client, db_session, setup_test_database) are provided by conftest.py


def test_agent_event_creation_and_persistence(db_session):
    """Test 1: Verifies that executing a workflow creates and persists AgentEvent records."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-EVENT-01",
        status="In Progress",
        priority="High",
        department="Road Public Works",
        sla_hours=24,
        deadline=now - timedelta(hours=2),  # Breached
        sla_status="BREACHED",
        follow_up_sent=True,
        agent_state="FOLLOW_UP_SENT",
        created_at=now - timedelta(hours=26),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    # Execute workflow
    result = run_agent_workflow(db_session, "C-EVENT-01")
    assert result["action_taken"] == "ESCALATED"

    # Query events
    events = get_complaint_events(db_session, "C-EVENT-01")
    assert len(events) > 0

    actions = [e.action for e in events]
    assert "MONITOR" in actions
    assert "SLA_CALCULATED" in actions
    assert "SLA_BREACHED" in actions
    assert "ESCALATION_TRIGGERED" in actions

    # Verify event fields
    esc_event = [e for e in events if e.action == "ESCALATION_TRIGGERED"][0]
    assert esc_event.agent == "sla_monitor"
    assert esc_event.new_status == "Escalated"
    assert "escalated" in esc_event.reason.lower()


def test_agent_event_chronological_ordering(db_session):
    """Test 2: Verifies that events are returned in strict chronological order."""
    now = datetime.now(timezone.utc)
    complaint_id = "C-EVENT-ORDER"

    # Insert events with explicitly staggered timestamps
    e1 = AgentEvent(
        complaint_id=complaint_id,
        agent="sla_monitor",
        action="MONITOR",
        reason="First event",
        timestamp=now - timedelta(minutes=10),
    )
    e2 = AgentEvent(
        complaint_id=complaint_id,
        agent="sla_monitor",
        action="SLA_CALCULATED",
        reason="Second event",
        timestamp=now - timedelta(minutes=5),
    )
    e3 = AgentEvent(
        complaint_id=complaint_id,
        agent="sla_monitor",
        action="ESCALATION_TRIGGERED",
        reason="Third event",
        timestamp=now,
    )
    db_session.add_all([e3, e1, e2])  # added out of order
    db_session.commit()

    events = get_complaint_events(db_session, complaint_id)
    assert len(events) == 3
    assert events[0].action == "MONITOR"
    assert events[1].action == "SLA_CALCULATED"
    assert events[2].action == "ESCALATION_TRIGGERED"
    assert events[0].timestamp <= events[1].timestamp <= events[2].timestamp


def test_get_agent_events_endpoint(client, db_session):
    """Test 3: Verifies GET /agent-events/{complaint_id} returns 200 with structured audit list."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-EVENT-API",
        status="In Progress",
        priority="Medium",
        department="Sanitation",
        sla_hours=48,
        deadline=now + timedelta(hours=30),
        sla_status="NORMAL",
        created_at=now - timedelta(hours=18),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    # Manually add an event
    record_agent_event(
        db=db_session,
        complaint_id="C-EVENT-API",
        action="MONITOR",
        reason="Complaint loaded into monitoring registry",
        previous_status="In Progress",
        new_status="In Progress",
    )

    response = client.get("/agent-events/C-EVENT-API")
    assert response.status_code == 200
    data = response.json()
    assert data["complaint_id"] == "C-EVENT-API"
    assert data["total_events"] == 1
    assert len(data["events"]) == 1
    assert data["events"][0]["action"] == "MONITOR"
    assert "timestamp" in data["events"][0]


def test_empty_event_history_returns_200(client, db_session):
    """Test 4: Verifies a valid complaint with zero events returns 200 OK with empty events list."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-NO-EVENTS",
        status="Pending",
        priority="Low",
        department="Traffic Management",
        sla_hours=72,
        deadline=now + timedelta(hours=50),
        sla_status="NORMAL",
        created_at=now - timedelta(hours=22),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    response = client.get("/agent-events/C-NO-EVENTS")
    assert response.status_code == 200
    data = response.json()
    assert data["complaint_id"] == "C-NO-EVENTS"
    assert data["total_events"] == 0
    assert data["events"] == []


def test_unknown_complaint_events_returns_404(client):
    """Test 5: Calling /agent-events/{complaint_id} with unknown ID returns HTTP 404."""
    response = client.get("/agent-events/NONEXISTENT_XYZ")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
