"""Unit tests for pure SLA calculation logic (deterministic, no DB required)."""

from datetime import datetime, timedelta, timezone
import pytest

from app.services.monitoring_service import (
    calculate_deadline,
    calculate_remaining_time,
    calculate_sla_status,
)


def test_deadline_calculation():
    """Verifies deadline = created_at + sla_hours."""
    created_at = datetime(2026, 9, 20, 10, 0, 0, tzinfo=timezone.utc)
    sla_hours = 48
    expected_deadline = datetime(2026, 9, 22, 10, 0, 0, tzinfo=timezone.utc)

    calculated = calculate_deadline(created_at, sla_hours)
    assert calculated == expected_deadline


def test_remaining_time_calculation():
    """Verifies remaining time calculation in seconds."""
    now = datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)
    deadline = datetime(2026, 9, 20, 15, 0, 0, tzinfo=timezone.utc)

    # 3 hours = 10,800 seconds
    remaining = calculate_remaining_time(deadline, current_time=now)
    assert remaining == 10800.0


def test_remaining_time_negative_when_breached():
    """Verifies remaining time is negative when deadline has passed."""
    now = datetime(2026, 9, 20, 16, 0, 0, tzinfo=timezone.utc)
    deadline = datetime(2026, 9, 20, 15, 0, 0, tzinfo=timezone.utc)

    # 1 hour past deadline = -3600 seconds
    remaining = calculate_remaining_time(deadline, current_time=now)
    assert remaining == -3600.0


def test_sla_status_normal():
    """Verifies SLA status is NORMAL when remaining time > 20% threshold."""
    sla_hours = 10  # 36,000 seconds total
    # 20% of 36,000s = 7,200s
    # 8,000 seconds remaining (> 7,200s) -> NORMAL
    status = calculate_sla_status(
        sla_hours=sla_hours,
        remaining_seconds=8000.0,
        warning_threshold_percent=20.0,
    )
    assert status == "NORMAL"


def test_sla_status_warning_at_threshold():
    """Verifies SLA status is WARNING when remaining time <= 20% threshold and > 0."""
    sla_hours = 10  # 36,000 seconds total
    # Exactly 20% = 7,200 seconds -> WARNING
    status_exact = calculate_sla_status(
        sla_hours=sla_hours,
        remaining_seconds=7200.0,
        warning_threshold_percent=20.0,
    )
    assert status_exact == "WARNING"

    # Below 20% (e.g., 3,600s = 10%) -> WARNING
    status_below = calculate_sla_status(
        sla_hours=sla_hours,
        remaining_seconds=3600.0,
        warning_threshold_percent=20.0,
    )
    assert status_below == "WARNING"


def test_sla_status_breached_at_zero():
    """Verifies SLA status is BREACHED when remaining time is 0."""
    sla_hours = 10
    status = calculate_sla_status(
        sla_hours=sla_hours,
        remaining_seconds=0.0,
        warning_threshold_percent=20.0,
    )
    assert status == "BREACHED"


def test_sla_status_breached_when_negative():
    """Verifies SLA status is BREACHED when remaining time is negative."""
    sla_hours = 48
    status = calculate_sla_status(
        sla_hours=sla_hours,
        remaining_seconds=-500.0,
        warning_threshold_percent=20.0,
    )
    assert status == "BREACHED"


def test_sla_configurable_threshold():
    """Verifies that the warning threshold percentage is configurable."""
    sla_hours = 10  # 36,000s total
    # With a 30% threshold (10,800s):
    # 10,000s remaining is WARNING with 30% threshold, but NORMAL with 20% threshold
    status_30 = calculate_sla_status(
        sla_hours=sla_hours,
        remaining_seconds=10000.0,
        warning_threshold_percent=30.0,
    )
    assert status_30 == "WARNING"

    status_20 = calculate_sla_status(
        sla_hours=sla_hours,
        remaining_seconds=10000.0,
        warning_threshold_percent=20.0,
    )
    assert status_20 == "NORMAL"
