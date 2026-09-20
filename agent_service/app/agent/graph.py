"""LangGraph workflow definition for SLA monitoring, follow-up, and escalation (Commit 2)."""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, START, END

from .state import AgentWorkflowState
from .nodes import AgentNodes
from ..services.complaint_data_provider import (
    ComplaintDataProvider,
    CentralComplaintApiDataProvider,
    LocalMonitoringComplaintDataProvider,
)
from ..services.monitoring_service import get_monitoring_record
from ..config import get_settings



def route_after_resolution(state: AgentWorkflowState) -> str:
    """Routes to END if complaint is missing/error or resolved; otherwise calculates SLA."""
    if state.get("error"):
        return END
    if state.get("is_resolved"):
        return END
    return "calculate_sla"


def route_after_sla(state: AgentWorkflowState) -> str:
    """Routes based on evaluated SLA status (NORMAL -> END, WARNING -> follow-up, BREACHED -> check_breach)."""
    sla_status = state.get("sla_status", "NORMAL")
    if sla_status == "NORMAL":
        return END
    elif sla_status == "WARNING":
        return "trigger_follow_up"
    elif sla_status == "BREACHED":
        return "check_breach"
    return END


def route_after_recheck(state: AgentWorkflowState) -> str:
    """Routes to END if complaint became resolved after follow-up; otherwise checks breach."""
    if state.get("is_resolved"):
        return END
    return "check_breach"


def route_after_breach_check(state: AgentWorkflowState) -> str:
    """Routes to escalation only if SLA is breached and complaint has not been escalated yet."""
    is_breached = (
        state.get("sla_status") == "BREACHED"
        or state.get("remaining_seconds", 1.0) <= 0
    )
    already_esc = state.get("already_escalated", False)
    if is_breached and not already_esc:
        return "escalate_complaint"
    return END


def build_agent_graph(
    db: Session,
    current_time: Optional[datetime] = None,
    warning_threshold_percent: Optional[float] = None,
    data_provider: Optional[ComplaintDataProvider] = None,
):
    """
    Constructs and compiles the state-aware LangGraph workflow for complaint SLA monitoring.
    """
    nodes = AgentNodes(
        db=db,
        current_time=current_time,
        warning_threshold_percent=warning_threshold_percent,
        data_provider=data_provider,
    )

    builder = StateGraph(AgentWorkflowState)

    # Register graph nodes
    builder.add_node("load_complaint", nodes.load_complaint)
    builder.add_node("check_resolution", nodes.check_resolution)
    builder.add_node("calculate_sla", nodes.calculate_sla)
    builder.add_node("trigger_follow_up", nodes.trigger_follow_up)
    builder.add_node("recheck_state", nodes.recheck_state)
    builder.add_node("check_breach", nodes.check_breach)
    builder.add_node("escalate_complaint", nodes.escalate_complaint_node)

    # Define edges and conditional routing
    builder.add_edge(START, "load_complaint")
    builder.add_edge("load_complaint", "check_resolution")

    builder.add_conditional_edges(
        "check_resolution",
        route_after_resolution,
        {
            END: END,
            "calculate_sla": "calculate_sla",
        },
    )

    builder.add_conditional_edges(
        "calculate_sla",
        route_after_sla,
        {
            END: END,
            "trigger_follow_up": "trigger_follow_up",
            "check_breach": "check_breach",
        },
    )

    builder.add_edge("trigger_follow_up", "recheck_state")

    builder.add_conditional_edges(
        "recheck_state",
        route_after_recheck,
        {
            END: END,
            "check_breach": "check_breach",
        },
    )

    builder.add_conditional_edges(
        "check_breach",
        route_after_breach_check,
        {
            END: END,
            "escalate_complaint": "escalate_complaint",
        },
    )

    builder.add_edge("escalate_complaint", END)

    return builder.compile()


def run_agent_workflow(
    db: Session,
    complaint_id: str,
    current_time: Optional[datetime] = None,
    warning_threshold_percent: Optional[float] = None,
    data_provider: Optional[ComplaintDataProvider] = None,
) -> AgentWorkflowState:
    """
    Executes the compiled LangGraph workflow on a complaint record.
    """
    if data_provider is None:
        if get_monitoring_record(db, complaint_id) is not None:
            data_provider = LocalMonitoringComplaintDataProvider(db)
        else:
            settings = get_settings()
            data_provider = CentralComplaintApiDataProvider(
                base_url=settings.CENTRAL_COMPLAINT_API_URL,
                timeout=getattr(settings, "CENTRAL_COMPLAINT_API_TIMEOUT", 5.0),
            )

    graph = build_agent_graph(
        db,
        current_time=current_time,
        warning_threshold_percent=warning_threshold_percent,
        data_provider=data_provider,
    )
    initial_state: AgentWorkflowState = {
        "complaint_id": complaint_id,
        "action_taken": "NONE",
        "already_escalated": False,
        "follow_up_sent": False,
        "is_resolved": False,
    }
    return graph.invoke(initial_state)


