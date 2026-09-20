"""Automated test suite for Notifications & Deployment Readiness (Commit 3)."""

import os
from datetime import datetime, timedelta, timezone
import pytest
from app.models.complaint_monitoring import ComplaintMonitoring
from app.agent.graph import run_agent_workflow
from app.config import Settings
from app.notifications import get_notification_provider, NoOpNotificationProvider, EmailNotificationProvider, TwilioNotificationProvider
from app.services.notification_service import NotificationService
from app.services.agent_event_service import get_complaint_events

# Fixtures (client, db_session, setup_test_database) are provided by conftest.py


def test_follow_up_notification_invocation(db_session):
    """Test 6: Verifies follow-up dispatches notification and records NOTIFICATION_SENT event."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-NOTIF-WARN",
        status="In Progress",
        priority="High",
        department="Electrical & Street Lighting",
        sla_hours=10,
        deadline=now + timedelta(hours=1),  # 1 hour <= 2h (20% warning threshold)
        sla_status="WARNING",
        follow_up_sent=False,
        agent_state="MONITORING",
        created_at=now - timedelta(hours=9),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    # Run workflow
    result = run_agent_workflow(db_session, "C-NOTIF-WARN")
    assert result["action_taken"] == "FOLLOW_UP"

    # Verify NOTIFICATION_SENT event
    events = get_complaint_events(db_session, "C-NOTIF-WARN")
    actions = [e.action for e in events]
    assert "FOLLOW_UP_TRIGGERED" in actions
    assert "NOTIFICATION_SENT" in actions


def test_escalation_notification_invocation(db_session):
    """Test 7: Verifies escalation dispatches alert notification and records NOTIFICATION_SENT event."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-NOTIF-ESC",
        status="In Progress",
        priority="Critical",
        department="Water Supply & Sewerage",
        sla_hours=24,
        deadline=now - timedelta(hours=1),  # Breached
        sla_status="BREACHED",
        follow_up_sent=True,
        agent_state="FOLLOW_UP_SENT",
        created_at=now - timedelta(hours=25),
        last_checked_at=now,
    )
    db_session.add(record)
    db_session.commit()

    # Run workflow
    result = run_agent_workflow(db_session, "C-NOTIF-ESC")
    assert result["action_taken"] == "ESCALATED"

    # Verify NOTIFICATION_SENT event
    events = get_complaint_events(db_session, "C-NOTIF-ESC")
    actions = [e.action for e in events]
    assert "ESCALATION_TRIGGERED" in actions
    assert "NOTIFICATION_SENT" in actions


def test_notification_provider_selection():
    """Test 8: Verifies configurable provider selection (none, email, twilio)."""
    s_none = Settings(NOTIFICATION_PROVIDER="none")
    p_none = get_notification_provider(s_none)
    assert isinstance(p_none, NoOpNotificationProvider)

    s_email = Settings(NOTIFICATION_PROVIDER="email", SMTP_HOST="smtp.test.com", SMTP_USERNAME="user")
    p_email = get_notification_provider(s_email)
    assert isinstance(p_email, EmailNotificationProvider)

    s_twilio = Settings(NOTIFICATION_PROVIDER="twilio", TWILIO_ACCOUNT_SID="AC123", TWILIO_AUTH_TOKEN="tok", TWILIO_FROM_NUMBER="+123")
    p_twilio = get_notification_provider(s_twilio)
    assert isinstance(p_twilio, TwilioNotificationProvider)


def test_notification_failure_resilience(db_session):
    """Test 9: Verifies notification failure does not crash workflow and logs NOTIFICATION_FAILED event."""
    now = datetime.now(timezone.utc)
    record = ComplaintMonitoring(
        complaint_id="C-NOTIF-FAIL",
        status="In Progress",
        priority="High",
        department="Roads & Infrastructure",
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

    # Configure an Email provider with missing SMTP credentials to trigger a safe failure
    unconfigured_settings = Settings(NOTIFICATION_PROVIDER="email", SMTP_HOST=None, SMTP_USERNAME=None)
    failing_service = NotificationService(settings=unconfigured_settings)

    # Directly dispatch escalation notification
    result = failing_service.notify_escalation(db_session, record, "Test failure resilience")
    assert result.success is False
    assert result.error is not None

    # Check event history
    events = get_complaint_events(db_session, "C-NOTIF-FAIL")
    actions = [e.action for e in events]
    assert "NOTIFICATION_FAILED" in actions


def test_health_and_readiness_endpoints(client):
    """Test 10 & 11: Verifies GET /health and GET /ready endpoints."""
    # Health probe
    res_h = client.get("/health")
    assert res_h.status_code == 200
    assert res_h.json()["status"] == "ok"
    assert res_h.json()["service"] == "agent-service"

    # Readiness probe
    res_r = client.get("/ready")
    assert res_r.status_code == 200
    data_r = res_r.json()
    assert data_r["status"] == "ready"
    assert data_r["database"] == "connected"
    assert "notification_provider" in data_r


def test_docker_configuration_static_validation():
    """Test 12: Static validation confirming Dockerfile and .dockerignore exist and exclude secrets."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dockerfile_path = os.path.join(base_dir, "Dockerfile")
    dockerignore_path = os.path.join(base_dir, ".dockerignore")

    assert os.path.exists(dockerfile_path), "Dockerfile must exist"
    assert os.path.exists(dockerignore_path), ".dockerignore must exist"

    with open(dockerfile_path, "r", encoding="utf-8") as f:
        df_content = f.read()
    assert "FROM python:" in df_content
    assert "uvicorn" in df_content
    assert "app.main:app" in df_content

    with open(dockerignore_path, "r", encoding="utf-8") as f:
        di_content = f.read()
    assert ".env" in di_content
    assert ".venv" in di_content
