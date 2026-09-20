"""Integration and endpoint tests for Agent Service API."""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Fixtures (client, db_session, setup_test_database) are provided by conftest.py


def test_health_endpoint(client):
    """Verifies GET /health returns 200 OK and expected structure."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "agent-service"
    assert "database" in data


def test_get_monitor_not_found(client):
    """Verifies GET /monitor/{complaint_id} returns 404 for unknown complaints."""
    response = client.get("/monitor/UNKNOWN_123")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_post_monitor_check_validation_invalid_sla(client):
    """Verifies POST /monitor/check rejects non-positive sla_hours."""
    payload = {
        "complaint_id": "C101",
        "status": "In Progress",
        "priority": "High",
        "department": "Road Public Works",
        "sla_hours": 0,  # Invalid: must be gt=0
    }
    response = client.post("/monitor/check", json=payload)
    assert response.status_code == 422


def test_post_monitor_check_validation_empty_id(client):
    """Verifies POST /monitor/check rejects empty complaint_id."""
    payload = {
        "complaint_id": "   ",  # Invalid: whitespace only
        "status": "In Progress",
        "priority": "High",
        "department": "Road Public Works",
        "sla_hours": 48,
    }
    response = client.post("/monitor/check", json=payload)
    assert response.status_code == 422


def test_post_monitor_check_creates_record(client):
    """Verifies POST /monitor/check creates a new record and calculates SLA."""
    now_str = datetime.now(timezone.utc).isoformat()
    payload = {
        "complaint_id": "C101",
        "status": "In Progress",
        "priority": "High",
        "department": "Roads & Infrastructure",
        "sla_hours": 48,
        "created_at": now_str,
    }
    response = client.post("/monitor/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["complaint_id"] == "C101"
    assert data["status"] == "In Progress"
    assert data["priority"] == "High"
    assert data["department"] == "Roads & Infrastructure"
    assert data["sla_hours"] == 48
    assert data["sla_status"] == "NORMAL"
    assert data["remaining_seconds"] > 0

    # Now verify GET /monitor/{complaint_id} retrieves it
    get_res = client.get("/monitor/C101")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["complaint_id"] == "C101"
    assert get_data["status"] == "In Progress"
    assert get_data["sla_status"] == "NORMAL"


def test_post_monitor_check_breached_record(client):
    """Verifies that an older complaint correctly computes a BREACHED status."""
    # Created 50 hours ago with 24 hour SLA -> BREACHED
    old_created = datetime(2020, 1, 1, 0, 0, 0, tzinfo=timezone.utc).isoformat()
    payload = {
        "complaint_id": "C202",
        "status": "In Progress",
        "priority": "Critical",
        "department": "Water Supply & Sewerage",
        "sla_hours": 24,
        "created_at": old_created,
    }
    response = client.post("/monitor/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["complaint_id"] == "C202"
    assert data["sla_status"] == "BREACHED"
    assert data["remaining_seconds"] < 0
