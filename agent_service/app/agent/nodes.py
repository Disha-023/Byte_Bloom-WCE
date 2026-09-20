"""Node functions for LangGraph agent workflow with Central Complaint Integration (Commit 4 Milestone)."""

import logging
from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy.orm import Session

from .state import AgentWorkflowState
from ..config import get_settings
from ..models import ComplaintMonitoring
from ..services.monitoring_service import (
    ensure_utc,
    get_monitoring_record,
    calculate_remaining_time,
    calculate_sla_status,
    calculate_deadline,
)
from ..services.follow_up_service import send_follow_up
from ..services.escalation_service import escalate_complaint
from ..services.agent_event_service import record_agent_event
from ..services.notification_service import NotificationService
from ..services.complaint_data_provider import (
    ComplaintDataProvider,
    CentralComplaintApiDataProvider,
    LocalMonitoringComplaintDataProvider,
    CentralApiError,
    CentralApiConnectionError,
    CentralApiTimeoutError,
    CentralApiMalformedDataError,
)

logger = logging.getLogger("agent_service.agent_nodes")


def parse_datetime(val: Any, default: Optional[datetime] = None) -> datetime:
    """Safely parses a datetime or ISO string to a UTC timezone-aware datetime."""
    if isinstance(val, datetime):
        return ensure_utc(val)
    if isinstance(val, str) and val.strip():
        try:
            clean = val.strip().replace("Z", "+00:00")
            return ensure_utc(datetime.fromisoformat(clean))
        except Exception:
            pass
    return default if default is not None else datetime.now(timezone.utc)


class AgentNodes:
    """Encapsulates LangGraph node implementations with central complaint data provider, session, and notifications."""

    def __init__(
        self,
        db: Session,
        current_time: Optional[datetime] = None,
        warning_threshold_percent: Optional[float] = None,
        data_provider: Optional[ComplaintDataProvider] = None,
    ):
        self.db = db
        self.current_time = current_time
        settings = get_settings()
        self.threshold = (
            warning_threshold_percent
            if warning_threshold_percent is not None
            else settings.SLA_WARNING_THRESHOLD_PERCENT
        )
        self.notification_service = NotificationService(settings=settings)
        if data_provider is not None:
            self.data_provider = data_provider
        elif getattr(settings, "CENTRAL_COMPLAINT_API_URL", None):
            self.data_provider = CentralComplaintApiDataProvider(
                base_url=settings.CENTRAL_COMPLAINT_API_URL,
                timeout=getattr(settings, "CENTRAL_COMPLAINT_API_TIMEOUT", 5.0),
            )
        else:
            self.data_provider = LocalMonitoringComplaintDataProvider(db)

    def _get_now(self) -> datetime:
        if self.current_time is not None:
            return ensure_utc(self.current_time)
        return datetime.now(timezone.utc)

    def load_complaint(self, state: AgentWorkflowState) -> dict:
        """Loads real complaint data from central system, synchronizes monitoring state, and logs audit trace."""
        complaint_id = state.get("complaint_id", "")
        logger.info("Agent started for complaint '%s'", complaint_id)

        now = self._get_now()

        # Step 1: Read real complaint from data provider
        try:
            complaint_data = self.data_provider.get_complaint(complaint_id)
        except (CentralApiConnectionError, CentralApiTimeoutError, CentralApiMalformedDataError, CentralApiError) as exc:
            logger.error("Failed to load complaint '%s' from central API: %s", complaint_id, exc)
            record_agent_event(
                db=self.db,
                complaint_id=complaint_id,
                action="INTEGRATION_ERROR",
                reason=f"Central API communication failure: {str(exc)}",
                details={"error": str(exc), "stage": "load_complaint"},
            )
            return {"error": f"Central complaint API error: {str(exc)}"}

        if not complaint_data:
            logger.warning("Complaint '%s' not found in central repository", complaint_id)
            return {"error": f"Complaint '{complaint_id}' not found"}

        # Step 2: Extract real fields from central complaint
        real_status = complaint_data.get("status") or "Pending"
        real_priority = complaint_data.get("priority") or "Medium"
        real_department = complaint_data.get("department") or "Unassigned"
        real_sla_hours = int(complaint_data.get("sla_hours") or 48)

        created_at_dt = parse_datetime(complaint_data.get("created_at"), default=now)

        if "deadline" in complaint_data and complaint_data["deadline"]:
            deadline_dt = parse_datetime(complaint_data["deadline"], default=calculate_deadline(created_at_dt, real_sla_hours))
        else:
            deadline_dt = calculate_deadline(created_at_dt, real_sla_hours)

        # Step 3: Synchronize or initialize local ComplaintMonitoring operational tracking record
        record = get_monitoring_record(self.db, complaint_id)
        if record is None:
            record = ComplaintMonitoring(
                complaint_id=complaint_id,
                status=real_status,
                priority=real_priority,
                department=real_department,
                sla_hours=real_sla_hours,
                deadline=deadline_dt,
                sla_status="NORMAL",
                agent_state="MONITORING",
                follow_up_sent=False,
                last_checked_at=now,
                created_at=created_at_dt,
                updated_at=now,
            )
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
        else:
            # Sync authoritative complaint status & SLA from central system while preserving agent operational flags
            record.status = real_status
            record.priority = real_priority
            record.department = real_department
            record.sla_hours = real_sla_hours
            record.deadline = deadline_dt
            record.last_checked_at = now
            record.updated_at = now
            self.db.commit()
            self.db.refresh(record)

        already_esc = (
            real_status.strip().lower() == "escalated"
            or getattr(record, "agent_state", "") == "ESCALATED"
        )
        is_res = real_status.strip().lower() == "resolved"

        # Step 4: Record audit events (COMPLAINT_LOADED and MONITOR)
        record_agent_event(
            db=self.db,
            complaint_id=complaint_id,
            action="COMPLAINT_LOADED",
            reason="Complaint loaded from central system for SLA monitoring",
            previous_status=real_status,
            new_status=real_status,
            details={
                "title": complaint_data.get("title"),
                "priority": real_priority,
                "department": real_department,
                "sla_hours": real_sla_hours,
                "deadline": deadline_dt.isoformat(),
                "address": complaint_data.get("address"),
                "issue_type": complaint_data.get("issue_type"),
            },
        )

        record_agent_event(
            db=self.db,
            complaint_id=complaint_id,
            action="MONITOR",
            reason="Complaint loaded for SLA monitoring",
            previous_status=real_status,
            new_status=real_status,
            details={"sla_hours": real_sla_hours, "deadline": deadline_dt.isoformat()},
        )

        return {
            "complaint_id": complaint_id,
            "current_status": real_status,
            "previous_status": real_status,
            "priority": real_priority,
            "department": real_department,
            "sla_hours": real_sla_hours,
            "deadline": deadline_dt,
            "follow_up_sent": getattr(record, "follow_up_sent", False),
            "already_escalated": already_esc,
            "is_resolved": is_res,
            "action_taken": "NONE",
            "agent_state": getattr(record, "agent_state", "MONITORING"),
            "last_checked_at": now,
            "error": None,
        }

    def check_resolution(self, state: AgentWorkflowState) -> dict:
        """Checks if complaint is already in 'Resolved' status."""
        if state.get("error"):
            return {}

        current_status = state.get("current_status", "")
        if current_status.strip().lower() == "resolved" or state.get("is_resolved"):
            logger.info("Complaint '%s' is already resolved; stopping workflow", state.get("complaint_id"))
            record_agent_event(
                db=self.db,
                complaint_id=state.get("complaint_id", ""),
                action="WORKFLOW_COMPLETED",
                reason="Complaint is already resolved; workflow completed without action",
                previous_status=current_status,
                new_status=current_status,
            )
            return {
                "is_resolved": True,
                "action_taken": "NONE",
                "agent_state": "RESOLVED",
                "decision_reason": "Complaint is already resolved; workflow completed without action.",
            }

        return {"is_resolved": False}

    def calculate_sla(self, state: AgentWorkflowState) -> dict:
        """Calculates SLA temporal state (NORMAL, WARNING, BREACHED) and logs audit events."""
        now = self._get_now()
        deadline = state["deadline"]
        sla_hours = state["sla_hours"]

        remaining_sec = calculate_remaining_time(deadline, current_time=now)
        sla_status = calculate_sla_status(sla_hours, remaining_sec, self.threshold)

        # Update monitoring record last checked timestamp and sla_status
        record = get_monitoring_record(self.db, state["complaint_id"])
        if record:
            record.last_checked_at = now
            record.sla_status = sla_status
            self.db.commit()
            self.db.refresh(record)

        logger.info(
            "Complaint '%s' evaluated: SLA status is '%s' (Remaining: %.1fs)",
            state["complaint_id"],
            sla_status,
            remaining_sec,
        )

        # Record SLA calculation audit event
        record_agent_event(
            db=self.db,
            complaint_id=state["complaint_id"],
            action="SLA_CALCULATED",
            reason=f"SLA evaluated to {sla_status} with {remaining_sec:.0f}s remaining",
            previous_status=state.get("current_status"),
            new_status=state.get("current_status"),
            details={"sla_status": sla_status, "remaining_seconds": remaining_sec},
        )

        updates = {
            "sla_status": sla_status,
            "remaining_seconds": remaining_sec,
            "last_checked_at": now,
        }

        if sla_status == "NORMAL":
            updates["action_taken"] = "NONE"
            updates["decision_reason"] = "SLA is within normal duration; no intervention required."
        elif sla_status == "WARNING":
            record_agent_event(
                db=self.db,
                complaint_id=state["complaint_id"],
                action="SLA_WARNING",
                reason=f"SLA warning threshold reached ({remaining_sec:.0f}s remaining)",
                previous_status=state.get("current_status"),
                new_status=state.get("current_status"),
            )
            if state.get("follow_up_sent"):
                updates["action_taken"] = "NONE"
                updates["decision_reason"] = "Warning SLA detected but follow-up was already sent; continuing monitoring."
            else:
                updates["decision_reason"] = "SLA approaching deadline; evaluating follow-up requirement."
        elif sla_status == "BREACHED":
            record_agent_event(
                db=self.db,
                complaint_id=state["complaint_id"],
                action="SLA_BREACHED",
                reason=f"SLA deadline breached by {abs(remaining_sec):.0f}s",
                previous_status=state.get("current_status"),
                new_status=state.get("current_status"),
            )
            updates["decision_reason"] = "SLA deadline has been breached; evaluating escalation."

        return updates

    def trigger_follow_up(self, state: AgentWorkflowState) -> dict:
        """Dispatches follow-up and notifications for complaints approaching SLA deadline."""
        if state.get("follow_up_sent"):
            logger.info(
                "Follow-up already sent for complaint '%s'; skipping duplicate dispatch",
                state["complaint_id"],
            )
            record_agent_event(
                db=self.db,
                complaint_id=state["complaint_id"],
                action="FOLLOW_UP_SKIPPED",
                reason="Warning SLA detected but follow-up was already sent; skipping duplicate dispatch",
                previous_status=state.get("current_status"),
                new_status=state.get("current_status"),
            )
            return {
                "action_taken": "NONE",
                "decision_reason": "Warning SLA detected but follow-up was already sent; no duplicate dispatched.",
            }

        record = get_monitoring_record(self.db, state["complaint_id"])
        if record:
            send_follow_up(self.db, record, state.get("remaining_seconds", 0.0))
            self.notification_service.notify_follow_up(
                db=self.db,
                record=record,
                remaining_seconds=state.get("remaining_seconds", 0.0),
            )

        record_agent_event(
            db=self.db,
            complaint_id=state["complaint_id"],
            action="FOLLOW_UP_TRIGGERED",
            reason="SLA warning threshold reached; follow-up dispatched to department",
            previous_status=state.get("current_status"),
            new_status=state.get("current_status"),
        )

        logger.info("Follow-up action executed for complaint '%s'", state["complaint_id"])
        return {
            "follow_up_sent": True,
            "action_taken": "FOLLOW_UP",
            "agent_state": "FOLLOW_UP_SENT",
            "decision_reason": "SLA warning threshold reached; follow-up dispatched to department.",
        }

    def recheck_state(self, state: AgentWorkflowState) -> dict:
        """Reloads complaint from central data provider to observe any status mutations."""
        complaint_id = state["complaint_id"]
        current_status = state.get("current_status", "")

        try:
            latest = self.data_provider.get_complaint(complaint_id)
            if latest and latest.get("status"):
                current_status = latest["status"]
        except Exception as exc:
            logger.warning("Could not recheck central complaint '%s': %s", complaint_id, exc)

        record = get_monitoring_record(self.db, complaint_id)
        if record:
            record.status = current_status
            self.db.commit()
            self.db.refresh(record)

        is_resolved = current_status.strip().lower() == "resolved"

        logger.info(
            "Complaint '%s' rechecked: current status is '%s'",
            complaint_id,
            current_status,
        )

        record_agent_event(
            db=self.db,
            complaint_id=complaint_id,
            action="RECHECK",
            reason=f"Complaint state rechecked; current status is '{current_status}'",
            previous_status=state.get("current_status"),
            new_status=current_status,
        )

        if is_resolved:
            return {
                "current_status": current_status,
                "is_resolved": True,
                "agent_state": "RESOLVED",
                "decision_reason": "Complaint was resolved following follow-up; workflow completed without escalation.",
            }

        return {
            "current_status": current_status,
            "is_resolved": False,
        }

    def check_breach(self, state: AgentWorkflowState) -> dict:
        """Checks if SLA is breached and verifies whether escalation has occurred."""
        is_breached = (
            state.get("sla_status") == "BREACHED"
            or state.get("remaining_seconds", 1.0) <= 0
        )

        if not is_breached:
            logger.info("Complaint '%s' has not breached SLA; ending check", state["complaint_id"])
            return {
                "decision_reason": state.get("decision_reason") or "SLA is not breached; continuing monitoring.",
            }

        already_esc = (
            state.get("already_escalated", False)
            or state.get("current_status", "").strip().lower() == "escalated"
        )

        if already_esc:
            logger.info(
                "Complaint '%s' breached SLA but is already escalated; no duplicate escalation",
                state["complaint_id"],
            )
            record_agent_event(
                db=self.db,
                complaint_id=state["complaint_id"],
                action="ESCALATION_SKIPPED",
                reason="SLA breached but complaint is already escalated; no duplicate escalation",
                previous_status=state.get("current_status"),
                new_status=state.get("current_status"),
            )
            return {
                "already_escalated": True,
                "decision_reason": "SLA breached but complaint is already escalated; no duplicate escalation.",
            }

        logger.info("Complaint '%s' SLA breached and unescalated; escalation required", state["complaint_id"])
        return {
            "already_escalated": False,
            "decision_reason": "SLA breached and complaint was not previously escalated; proceeding to escalation.",
        }

    def escalate_complaint_node(self, state: AgentWorkflowState) -> dict:
        """Executes complaint escalation: updates central PostgreSQL status, records events, and notifies."""
        complaint_id = state["complaint_id"]
        prev_status = state.get("previous_status", state.get("current_status"))

        # Step 1: Update central complaint status in PostgreSQL via central data provider
        try:
            status_updated = self.data_provider.update_complaint_status(complaint_id, "Escalated")
        except Exception as exc:
            logger.error("Failed to update central status for '%s': %s", complaint_id, exc)
            status_updated = False

        if not status_updated:
            logger.error("Central complaint status update to 'Escalated' failed for '%s'", complaint_id)
            record_agent_event(
                db=self.db,
                complaint_id=complaint_id,
                action="STATUS_UPDATE_FAILED",
                reason="Central API status update to 'Escalated' failed; central status unchanged",
                previous_status=prev_status,
                new_status=prev_status,
                details={"target_status": "Escalated", "success": False},
            )
            return {
                "error": "Failed to update central complaint status to 'Escalated'",
                "action_taken": "NONE",
                "decision_reason": "SLA breached but central status update failed; escalation incomplete.",
            }

        # Step 2: Record CENTRAL_STATUS_UPDATED AgentEvent
        record_agent_event(
            db=self.db,
            complaint_id=complaint_id,
            action="CENTRAL_STATUS_UPDATED",
            reason=f"Central complaint status updated from '{prev_status}' to 'Escalated' in PostgreSQL",
            previous_status=prev_status,
            new_status="Escalated",
            details={"field": "status", "target": "complaints_table", "success": True},
        )

        # Step 3: Update local monitoring record & dispatch notification
        record = get_monitoring_record(self.db, complaint_id)
        if record:
            escalate_complaint(self.db, record)
            self.notification_service.notify_escalation(
                db=self.db,
                record=record,
                reason="SLA deadline expired without resolution",
            )

        # Step 4: Record ESCALATION_TRIGGERED AgentEvent
        record_agent_event(
            db=self.db,
            complaint_id=complaint_id,
            action="ESCALATION_TRIGGERED",
            reason="SLA breached and complaint was not previously escalated; complaint escalated",
            previous_status=prev_status,
            new_status="Escalated",
        )

        logger.info("Complaint '%s' successfully escalated in central system and monitoring registry", complaint_id)
        return {
            "previous_status": prev_status,
            "current_status": "Escalated",
            "agent_state": "ESCALATED",
            "already_escalated": True,
            "action_taken": "ESCALATED",
            "decision_reason": "SLA breached and complaint was not previously escalated; complaint escalated.",
        }
