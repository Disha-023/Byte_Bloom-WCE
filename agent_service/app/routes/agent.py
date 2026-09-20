"""Agent workflow execution API endpoint (Commit 2)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.agent import AgentRunResponse
from ..agent import run_agent_workflow

router = APIRouter(prefix="/agent", tags=["Agent Workflow"])


@router.post(
    "/run/{complaint_id}",
    response_model=AgentRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute LangGraph Agent Workflow for a Complaint",
)
def run_complaint_agent(
    complaint_id: str,
    db: Session = Depends(get_db),
) -> AgentRunResponse:
    """
    Executes the state-aware LangGraph agent workflow for a civic complaint:
    - Verifies current resolution status.
    - Evaluates SLA temporal state (NORMAL, WARNING, BREACHED).
    - Triggers warning follow-up if approaching deadline (preventing duplicates).
    - Re-checks complaint status after follow-up.
    - Escalates complaint if breached and not previously escalated.
    - Persists state transitions to PostgreSQL.
    """
    result = run_agent_workflow(db, complaint_id)

    if result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"],
        )

    return AgentRunResponse(
        complaint_id=result["complaint_id"],
        previous_status=result.get("previous_status", result.get("current_status")),
        current_status=result["current_status"],
        sla_status=result["sla_status"],
        agent_state=result.get("agent_state", "MONITORING"),
        action_taken=result.get("action_taken", "NONE"),
        follow_up_sent=result.get("follow_up_sent", False),
        already_escalated=result.get("already_escalated", False),
        decision_reason=result.get("decision_reason", "Workflow completed"),
        remaining_seconds=result.get("remaining_seconds", 0.0),
        deadline=result["deadline"],
        last_checked_at=result["last_checked_at"],
    )
