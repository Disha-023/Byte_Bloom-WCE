# Agent Service — Persistent SLA Monitoring & Agentic Workflow

**Member 4: Agentic Complaint Monitoring, SLA Enforcement, Escalation, Traceability, and Agent-Service Integration**

This microservice provides the persistent SLA monitoring foundation and **state-aware LangGraph agentic workflow** for civic complaints in the **Smart Civic Issue Resolution** platform.

> [!NOTE]
> **Commit 1 & 2 Status**:
> - **Commit 1**: Persistent SLA monitoring foundation, data models (`complaint_monitoring`), deterministic calculation engine, and query endpoints.
> - **Commit 2**: State-aware LangGraph decision workflow for automated SLA warning follow-ups, post-follow-up re-checks, SLA breach escalation, and idempotency safeguards.
> - *Commit 3 (Upcoming)*: Real external notifications (Twilio/email), notification credentials, and agent event history audit logs.

---

## 🏗️ Architecture Overview

The Agent Service connects incoming complaint triage data with persistent PostgreSQL tracking and orchestrates autonomous decisions via a compiled LangGraph `StateGraph`.

```text
Complaint / AI SLA Data
          ↓
Agent Monitoring Service (FastAPI)
          ↓
LangGraph StateGraph Workflow
  ├── Resolution Check (Resolved → Halt)
  ├── SLA Evaluation (Normal / Warning / Breached)
  ├── Warning Follow-Up Dispatch (Prevents Duplicates)
  ├── Re-Check Complaint State (Interim Resolution Check)
  └── Breach Escalation (Transitions to 'Escalated')
          ↓
      PostgreSQL
          ↓
Persisted Decision & Lifecycle State
```

---

## 🔄 LangGraph Agentic Workflow

The agentic workflow is modeled as a compiled state graph (`StateGraph`) with typed state (`AgentWorkflowState`), discrete nodes, and conditional edges:

```text
                     START
                       ↓
                [load_complaint]
                       ↓
               [check_resolution]
                 /            \
          (resolved)       (unresolved)
             /                  \
           END             [calculate_sla]
                            /     |     \
                    (normal)  (warning)  (breached)
                       /          |            \
                     END  [trigger_follow_up]   \
                                  |              \
                           [recheck_state]        \
                             /         \           \
                      (resolved)   (unresolved)     \
                         /               \           \
                       END           [check_breach] ←-
                                       /        \
                                (not breached)  (breached & unescalated)
                                     /             \
                                   END     [escalate_complaint]
                                                    ↓
                                                   END
```

### Graph Nodes

1. **`load_complaint`**: Loads the persistent `ComplaintMonitoring` record from PostgreSQL.
2. **`check_resolution`**: Inspects if the complaint is already `Resolved`.
3. **`calculate_sla`**: Computes remaining time and determines temporal status (`NORMAL`, `WARNING`, `BREACHED`).
4. **`trigger_follow_up`**: Dispatches warning follow-up action to municipal departments if approaching deadline and not previously sent.
5. **`recheck_state`**: Reloads complaint from database to observe if status changed to `Resolved` following follow-up.
6. **`check_breach`**: Determines whether the SLA deadline has expired and checks if escalation has already occurred.
7. **`escalate_complaint`**: Transitions complaint lifecycle status to `Escalated`, sets `agent_state = ESCALATED`, and records timestamps.

---

## 🛡️ Idempotency & Decision Logic

| Scenario | Agent Decision & Action | Rationale / Idempotency |
| :--- | :--- | :--- |
| **Status is `Resolved`** | `action_taken: "NONE"` | Resolved issues are never modified or escalated. |
| **SLA is `NORMAL`** | `action_taken: "NONE"` | Remaining duration is $> 20\%$; monitoring continues. |
| **SLA is `WARNING` (1st Run)** | `action_taken: "FOLLOW_UP"` | $\le 20\%$ duration remaining. Follow-up dispatched; `follow_up_sent` set to `True`. |
| **SLA is `WARNING` (Subsequent Runs)** | `action_taken: "NONE"` | `follow_up_sent == True` prevents duplicate follow-ups. |
| **Resolved after Follow-Up** | `action_taken: "NONE"` | Re-check detects interim resolution; halts before breach check. |
| **SLA is `BREACHED` (1st Run)** | `action_taken: "ESCALATED"` | Deadline passed and unescalated; status set to `Escalated`. |
| **Already `Escalated`** | `action_taken: "NONE"` | Prevents redundant escalation cycles. |

---

## 🏷️ Key Distinction: Complaint Status vs. SLA Status vs. Agent State

| Dimension | Values | Meaning |
| :--- | :--- | :--- |
| **Complaint Status** | `Pending`, `Assigned`, `In Progress`, `Resolved`, `Escalated` | Operational lifecycle status aligned with authority workflows. |
| **SLA Status** | `NORMAL`, `WARNING`, `BREACHED` | Temporal compliance status based on deadline and current UTC time. |
| **Agent State** | `MONITORING`, `FOLLOW_UP_SENT`, `ESCALATED`, `RESOLVED` | Internal state of the autonomous workflow engine. |

---

## 📋 Prerequisites

- **Python**: 3.11+ (Python 3.13 supported)
- **PostgreSQL**: 14+ (or compatible PostgreSQL instance)

---

## ⚙️ Installation & Setup

### 1. Navigate to Service Directory
```bash
cd agent_service
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Duplicate `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Configure `DATABASE_URL`:
```env
DATABASE_URL=postgresql+psycopg://<username>:<password>@<host>:5432/civic_agent
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=development
SLA_WARNING_THRESHOLD_PERCENT=20.0
```

### 4. Initialize Database Tables
```bash
python -m app.database
```

---

## 🚀 Running the Service

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

- **API Base URL**: `http://localhost:8001`
- **Swagger Docs**: `http://localhost:8001/docs`

---

## 📡 API Endpoints

### 1. `POST /agent/run/{complaint_id}` (Commit 2)
Executes the state-aware LangGraph workflow for a civic complaint.

**Example Request**:
```bash
curl -X POST "http://localhost:8001/agent/run/C101"
```

**Example Response**:
```json
{
  "complaint_id": "C101",
  "previous_status": "In Progress",
  "current_status": "Escalated",
  "sla_status": "BREACHED",
  "agent_state": "ESCALATED",
  "action_taken": "ESCALATED",
  "follow_up_sent": true,
  "already_escalated": true,
  "decision_reason": "SLA breached and complaint was not previously escalated; complaint escalated.",
  "remaining_seconds": -3600.0,
  "deadline": "2026-09-20T18:00:00Z",
  "last_checked_at": "2026-09-20T19:00:00Z"
}
```

---

### 2. `GET /monitor/{complaint_id}` (Commit 1)
Retrieves current persisted monitoring record.

```bash
curl -X GET "http://localhost:8001/monitor/C101"
```

---

### 3. `POST /monitor/check` (Commit 1)
Establishes or updates monitoring baseline for a complaint.

```bash
curl -X POST "http://localhost:8001/monitor/check" \
  -H "Content-Type: application/json" \
  -d '{
    "complaint_id": "C101",
    "status": "In Progress",
    "priority": "High",
    "department": "Road Public Works",
    "sla_hours": 48,
    "created_at": "2026-09-20T10:00:00Z"
  }'
```

---

### 4. `GET /health`
```bash
curl -X GET "http://localhost:8001/health"
```

---

## 🧪 Testing

Run the full automated test suite:
```bash
pytest tests/ -v
```

**Test Suite Coverage (24 Total Tests)**:
- `tests/test_agent_workflow.py` (10 tests):
  1. Resolved complaint terminates without action.
  2. Normal SLA produces no intervention.
  3. Warning SLA triggers follow-up action.
  4. Warning SLA with follow-up already sent prevents duplicate dispatch.
  5. Re-check after follow-up halts escalation if complaint resolved.
  6. Breached SLA transitions complaint to Escalated status.
  7. Already escalated complaint prevents duplicate escalation.
  8. Repeated workflow execution ensures strict idempotency.
  9. Missing complaint returns HTTP 404.
  10. API endpoint `POST /agent/run/{complaint_id}` integration test.
- `tests/test_api.py` (6 tests): Endpoint validation, 404s, creation, and retrieval.
- `tests/test_sla_calculations.py` (8 tests): Pure deterministic SLA arithmetic, thresholds, and boundaries.
