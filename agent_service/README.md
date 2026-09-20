# Agent Service — Persistent SLA Monitoring, LangGraph Workflow, Traceability & Notifications

**Member 4: Agentic Complaint Monitoring, SLA Enforcement, Escalation, Traceability, and Agent-Service Integration**

This microservice provides the complete production-oriented agentic service for the **Smart Civic Issue Resolution** platform, combining:
1. **Persistent SLA Monitoring** (PostgreSQL + SQLAlchemy + Pydantic)
2. **State-Aware Decision Workflow** (LangGraph StateGraph with conditional transitions)
3. **Audit Traceability & Event History** (`agent_events` table & API)
4. **Pluggable Notification Abstraction** (Email / Twilio / No-op)
5. **System Readiness & Containerization** (Health/Ready probes + Dockerfile)

---

## 🏗️ Architecture Overview

```text
                 ┌───────────────────────┐
                 │ Existing Complaint    │
                 │ / Authority System    │
                 │     Member 3          │
                 └───────────┬───────────┘
                             │
                       complaint data
                             │
                             ▼
                 ┌───────────────────────┐
                 │      YOUR AGENT       │
                 │    agent_service      │
                 └───────────┬───────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
         Monitor         Follow-up        Escalate
             │               │                │
             │               ▼                ▼
             │       NotificationService (Email / Twilio / No-op)
             │               │                │
             └───────────────┼────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Agent Events      │
                  │   PostgreSQL        │
                  └─────────────────────┘
                             │
                             ▼
                  GET /agent-events/{id}
                             │
                             ▼
                       Traceability
```

---

## 🔄 LangGraph Agentic Workflow

The decision workflow is orchestrated as a state-aware LangGraph `StateGraph`:

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

---

## 📜 Agent Event History & Traceability

Every meaningful decision and state transition is permanently recorded in the `agent_events` PostgreSQL table.

### Event Action Vocabulary
- `MONITOR`: Complaint loaded into the monitoring registry.
- `SLA_CALCULATED`: SLA temporal state evaluated against current UTC time.
- `SLA_WARNING`: Warning threshold reached ($\le 20\%$ remaining).
- `FOLLOW_UP_TRIGGERED`: Warning follow-up action initiated.
- `FOLLOW_UP_SKIPPED`: Warning follow-up bypassed because it was already sent.
- `RECHECK`: Complaint status re-evaluated from the database after follow-up.
- `SLA_BREACHED`: Deadline expired without resolution.
- `ESCALATION_TRIGGERED`: Complaint transitioned to `Escalated` status.
- `ESCALATION_SKIPPED`: Escalation bypassed because complaint was already escalated.
- `NOTIFICATION_SENT`: External alert successfully dispatched by notification provider.
- `NOTIFICATION_FAILED`: Notification provider encountered a dispatch error.
- `WORKFLOW_COMPLETED`: Agent workflow terminated cleanly.

---

## 🔔 Notification Abstraction

The `NotificationService` acts as an intermediary between workflow actions and pluggable delivery providers:

```text
                 Agent Workflow
                       │
             FOLLOW_UP / ESCALATE
                       │
                       ▼
              NotificationService
            /          |          \
           /           |           \
     NoOpProvider  EmailProvider  TwilioProvider
     (none/test)     (SMTP)        (SMS)
```

### Provider Configuration via Environment Variables
- `NOTIFICATION_PROVIDER`: Selected provider (`none`, `email`, `twilio`). Defaults to `none` for zero-credential local development and automated testing.
- **Email Settings** (`NOTIFICATION_PROVIDER=email`):
  - `SMTP_HOST`: Hostname of the SMTP server.
  - `SMTP_PORT`: Port (default `587`).
  - `SMTP_USERNAME`: SMTP user.
  - `SMTP_PASSWORD`: SMTP password.
  - `EMAIL_FROM`: Sender address (default `noreply@civic.local`).
- **Twilio Settings** (`NOTIFICATION_PROVIDER=twilio`):
  - `TWILIO_ACCOUNT_SID`: Twilio Account SID.
  - `TWILIO_AUTH_TOKEN`: Twilio Auth Token.
  - `TWILIO_FROM_NUMBER`: Twilio SMS sender number.

### Resilient Failure Handling
If a notification fails (due to network timeout, bad credentials, or service outage):
1. The error is caught and logged.
2. A `NOTIFICATION_FAILED` event is recorded in the `agent_events` table with error details.
3. The core workflow and complaint state transition (e.g. `Escalated`) are **preserved** and **not rolled back**.

---

## 🔌 Integration Boundary with Existing Project

Currently, Member 3's authority dashboard operates in `client/` using client-side state and mock APIs, and `server/` does not yet expose a full PostgreSQL complaints API.

To ensure clean future integration without creating duplicate complaint storage:
- `ComplaintDataProvider` defines the abstract integration contract:
  - `get_complaint(complaint_id: str)`
  - `update_complaint_status(complaint_id: str, new_status: str)`
- `LocalMonitoringComplaintDataProvider`: Concrete implementation utilizing `ComplaintMonitoring` as the standalone source of truth.
- `RemoteAuthorityComplaintDataProvider`: Adapter skeleton ready to connect to Member 3's Node/Express endpoints (e.g., `http://localhost:5000/api/complaints`) when finalized.

---

## 📡 API Endpoints

### 1. `GET /agent-events/{complaint_id}` (Commit 3)
Retrieves the complete chronologically ordered audit trail for a complaint.

**Sample Request**:
```bash
curl -X GET "http://localhost:8001/agent-events/C101"
```

**Sample Response**:
```json
{
  "complaint_id": "C101",
  "total_events": 4,
  "events": [
    {
      "id": 1,
      "complaint_id": "C101",
      "agent": "sla_monitor",
      "action": "MONITOR",
      "reason": "Complaint loaded for SLA monitoring",
      "previous_status": "In Progress",
      "new_status": "In Progress",
      "timestamp": "2026-09-20T18:00:00Z",
      "details": {"sla_hours": 48}
    },
    {
      "id": 2,
      "complaint_id": "C101",
      "agent": "sla_monitor",
      "action": "SLA_WARNING",
      "reason": "SLA warning threshold reached (7200s remaining)",
      "previous_status": "In Progress",
      "new_status": "In Progress",
      "timestamp": "2026-09-20T18:00:01Z",
      "details": null
    },
    {
      "id": 3,
      "complaint_id": "C101",
      "agent": "sla_monitor",
      "action": "FOLLOW_UP_TRIGGERED",
      "reason": "SLA warning threshold reached; follow-up dispatched to department",
      "previous_status": "In Progress",
      "new_status": "In Progress",
      "timestamp": "2026-09-20T18:00:02Z",
      "details": null
    },
    {
      "id": 4,
      "complaint_id": "C101",
      "agent": "sla_monitor",
      "action": "NOTIFICATION_SENT",
      "reason": "Follow-up notification sent via none (noop)",
      "previous_status": "In Progress",
      "new_status": "In Progress",
      "timestamp": "2026-09-20T18:00:03Z",
      "details": {"channel": "noop", "provider": "none", "success": true}
    }
  ]
}
```

---

### 2. `POST /agent/run/{complaint_id}` (Commit 2)
Executes the LangGraph agent workflow for a complaint.

**Sample Request**:
```bash
curl -X POST "http://localhost:8001/agent/run/C101"
```

---

### 3. `GET /monitor/{complaint_id}` (Commit 1)
Retrieves the persistent SLA monitoring record.

```bash
curl -X GET "http://localhost:8001/monitor/C101"
```

---

### 4. `POST /monitor/check` (Commit 1)
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

### 5. `GET /health` & `GET /ready` (Commit 3)
- `GET /health`: Liveness probe verifying the process is alive.
- `GET /ready`: Readiness probe verifying database connectivity and provider readiness (returns 200 or 503).

```bash
curl -X GET "http://localhost:8001/ready"
```

---

## 🐳 Docker & Container Deployment

The service includes a production Dockerfile and `.dockerignore` for standalone container deployment.

### 1. Build the Docker Image
```bash
docker build -t civic-agent-service .
```

### 2. Run the Container
```bash
docker run -d \
  -p 8001:8001 \
  -e DATABASE_URL="postgresql+psycopg://user:pass@host:5432/civic_agent" \
  -e NOTIFICATION_PROVIDER="none" \
  --name civic_agent \
  civic-agent-service
```

---

## 🧪 Testing

Run the complete automated test suite:
```bash
pytest tests/ -v
```

**Complete Suite (35 Passing Tests)**:
- `tests/test_agent_events.py` (5 tests): Event creation, chronological ordering, GET `/agent-events/{id}`, empty list handling, 404 for unknown complaints.
- `tests/test_notifications.py` (6 tests): Follow-up notification dispatch, escalation notification dispatch, provider selection (`none`, `email`, `twilio`), failure resilience without crash, `/health` and `/ready` probes, Dockerfile static validation.
- `tests/test_agent_workflow.py` (10 tests): LangGraph decision graph, resolution checking, warning follow-up, re-checking, breach escalation, and idempotency.
- `tests/test_api.py` (6 tests): Endpoint validation, 404 handling, creation, and retrieval.
- `tests/test_sla_calculations.py` (8 tests): Deterministic SLA calculations, thresholds, and boundary conditions.
