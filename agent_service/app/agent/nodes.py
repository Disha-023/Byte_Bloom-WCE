"""Node functions for LangGraph agent workflow with Traceability & Notifications (Commit 3)."""

import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from .state import AgentWorkflowState
from ..config import get_settings
from ..services.monitoring_service import (
    ensure_utc,
    get_monitoring_record,
    calculate_remaining_time,
    calculate_sla_status,
)
from ..services.follow_up_service import send_follow_up
from ..services.escalation_service import escalate_complaint
from ..services.agent_event_service import record_agent_event
from ..services.notification_service import NotificationService

logger = logging.getLogger("agent_service.agent_nodes")


class AgentNodes:
    """Encapsulates LangGraph node implementations with database session, traceability, and notifications."""

    def __init__(
        self,
        db: Session,
        current_time: Optional[datetime] = None,
        warning_threshold_percent: Optional[float] = None,
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

    def _get_now(self) -> datetime:
        if self.current_time is not None:
            return ensure_utc(self.current_time)
        return datetime.now(timezone.utc)

    def load_complaint(self, state: AgentWorkflowState) -> dict:
        """Loads complaint monitoring record from PostgreSQL and logs audit trace."""
        complaint_id = state.get("complaint_id", "")
        logger.info("Agent started for complaint '%s'", complaint_id)

        record = get_monitoring_record(self.db, complaint_id)
        if not record:
            logger.warning("Complaint '%s' not found in database", complaint_id)
            return {"error": f"Complaint '{complaint_id}' not found"}

        now = self._get_now()
        already_esc = (
            record.status.strip().lower() == "escalated"
            or getattr(record, "agent_state", "") == "ESCALATED"
        )
        is_res = record.status.strip().lower() == "resolved"

        # Record MONITOR audit event
        record_agent_event(
            db=self.db,
            complaint_id=record.complaint_id,
            action="MONITOR",
            reason="Complaint loaded for SLA monitoring",
            previous_status=record.status,
            new_status=record.status,
            details={"sla_hours": record.sla_hours, "deadline": record.deadline.isoformat()},
        )

        return {
            "complaint_id": record.complaint_id,
            "current_status": record.status,
            "previous_status": record.status,
            "priority": record.priority,
            "department": record.department,
            "sla_hours": record.sla_hours,
            "deadline": record.deadline,
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
        """Reloads complaint from database to observe any status mutations."""
        record = get_monitoring_record(self.db, state["complaint_id"])
        if not record:
            return {}

        self.db.refresh(record)
        current_status = record.status
        is_resolved = current_status.strip().lower() == "resolved"

        logger.info(
            "Complaint '%s' rechecked: current status is '%s'",
            state["complaint_id"],
            current_status,
        )

        record_agent_event(
            db=self.db,
            complaint_id=state["complaint_id"],
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
        """Executes complaint escalation transition, notifies authority, and logs event."""
        record = get_monitoring_record(self.db, state["complaint_id"])
        prev_status = state.get("previous_status", state.get("current_status"))

        if record:
            escalate_complaint(self.db, record)
            self.notification_service.notify_escalation(
                db=self.db,
                record=record,
                reason="SLA deadline expired without resolution",
            )

        record_agent_event(
            db=self.db,
            complaint_id=state["complaint_id"],
            action="ESCALATION_TRIGGERED",
            reason="SLA breached and complaint was not previously escalated; complaint escalated",
            previous_status=prev_status,
            new_status="Escalated",
        )

        logger.info("Complaint '%s' successfully escalated", state["complaint_id"])
        return {
            "previous_status": prev_status,
            "current_status": "Escalated",
            "agent_state": "ESCALATED",
            "already_escalated": True,
            "action_taken": "ESCALATED",
            "decision_reason": "SLA breached and complaint was not previously escalated; complaint escalated.",
        }
