# Agent Service — Persistent SLA Monitoring Foundation

**Member 4: Agentic Complaint Monitoring, SLA Enforcement, Escalation, Traceability, and Agent-Service Integration**

This microservice provides the persistent foundation for tracking and evaluating Service Level Agreements (SLAs) for civic complaints in the **Smart Civic Issue Resolution** platform.

> [!NOTE]
> **Commit 1 Scope**: This service implements the persistent SLA monitoring foundation, data models, calculation engine, and query endpoints. Subsequent commits will introduce LangGraph agent workflows, automated escalations, citizen follow-up notifications, and agent event history.

---

## 🏗️ Architecture Overview

The Agent Service connects incoming complaint triage data (from citizens and the AI Intelligence Service) with persistent PostgreSQL tracking to determine real-time SLA compliance.

```text
Complaint / AI SLA Data
          ↓
Agent Monitoring Service (FastAPI)
          ↓
      PostgreSQL
          ↓
      SLA Status
NORMAL / WARNING / BREACHED
```

### Key Distinction: Complaint Status vs. SLA Status

It is critical to distinguish between the **complaint lifecycle status** and the **SLA monitoring status**:

| Concept | Example Values | Description |
| :--- | :--- | :--- |
| **Complaint Status** | `Pending`, `Assigned`, `In Progress`, `Resolved`, `Escalated` | The operational status of the civic issue within municipal workflows. |
| **SLA Status** | `NORMAL`, `WARNING`, `BREACHED` | The temporal compliance status evaluated by the Agent Service. |

A complaint can be `status: "In Progress"` while its `sla_status: "WARNING"` or `sla_status: "BREACHED"`.

---

## ⏱️ SLA Status Rules & Thresholds

1. **Deadline Calculation**:
   $$\text{deadline} = \text{created\_at} + \text{sla\_hours}$$

2. **Remaining Time Calculation**:
   $$\text{remaining\_seconds} = \text{deadline} - \text{current\_utc\_time}$$

3. **Status Classification**:
   - **`BREACHED`**: $\text{remaining\_seconds} \le 0$
   - **`WARNING`**: $\text{remaining\_seconds} \le (\text{sla\_hours} \times 3600 \times \frac{\text{SLA\_WARNING\_THRESHOLD\_PERCENT}}{100})$
   - **`NORMAL`**: $\text{remaining\_seconds} > (\text{sla\_hours} \times 3600 \times \frac{\text{SLA\_WARNING\_THRESHOLD\_PERCENT}}{100})$

*Default Warning Threshold*: **20%** of total SLA duration remaining.

---

## 📋 Prerequisites

- **Python**: 3.11+ (Python 3.13 supported)
- **PostgreSQL**: 14+ (or compatible PostgreSQL instance)

---

## ⚙️ Installation & Setup

### 1. Navigate to the Service Directory
```bash
cd agent_service
```

### 2. Create and Activate a Virtual Environment
**Windows (PowerShell)**:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS**:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Duplicate `.env.example` to create your local `.env`:
```powershell
Copy-Item .env.example .env
```
Or on Linux/macOS:
```bash
cp .env.example .env
```

Configure `DATABASE_URL` with your PostgreSQL credentials:
```env
DATABASE_URL=postgresql+psycopg://<username>:<password>@<host>:<port>/<database>
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=development
SLA_WARNING_THRESHOLD_PERCENT=20.0
```

---

## 🗄️ PostgreSQL Database Setup

### 1. Create the Database in PostgreSQL
Using `psql` or pgAdmin:
```sql
CREATE DATABASE civic_agent;
```

### 2. Initialize Database Tables
Run the database initialization script to create the `complaint_monitoring` table:
```bash
python -m app.database
```

The table schema created:
- `id`: Primary key (Integer, autoincrement)
- `complaint_id`: String(64), unique, indexed
- `status`: String(64), complaint lifecycle status
- `priority`: String(64)
- `department`: String(128)
- `sla_hours`: Integer
- `deadline`: Timestamp with time zone (UTC)
- `sla_status`: String(32) (`NORMAL`, `WARNING`, `BREACHED`)
- `last_checked_at`: Timestamp with time zone (UTC)
- `created_at`: Timestamp with time zone (UTC)
- `updated_at`: Timestamp with time zone (UTC)

---

## 🚀 Running the Service

Start the FastAPI application with Uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

The service will be available at:
- **API Base URL**: `http://localhost:8001`
- **Interactive Swagger Docs**: `http://localhost:8001/docs`
- **ReDoc Documentation**: `http://localhost:8001/redoc`

---

## 📡 API Endpoints

### 1. `GET /health`
Verifies service health and database connectivity.

**Response**:
```json
{
  "status": "ok",
  "service": "agent-service",
  "database": "connected"
}
```

---

### 2. `GET /monitor/{complaint_id}`
Retrieves the persistent SLA monitoring state for a complaint.

**Example Request**:
```bash
curl -X GET "http://localhost:8001/monitor/C101"
```

**Example Response**:
```json
{
  "complaint_id": "C101",
  "status": "In Progress",
  "priority": "High",
  "department": "Road Public Works",
  "sla_hours": 48,
  "deadline": "2026-09-22T10:00:00Z",
  "sla_status": "NORMAL",
  "remaining_seconds": 123456.0,
  "last_checked_at": "2026-09-20T18:00:00Z",
  "created_at": "2026-09-20T10:00:00Z",
  "updated_at": "2026-09-20T18:00:00Z"
}
```

**Error Response (404 Not Found)**:
```json
{
  "detail": "Monitoring record for complaint 'C999' not found"
}
```

---

### 3. `POST /monitor/check`
Initiates or updates an SLA monitoring check for a complaint.

**Example Request**:
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

**Example Response**:
```json
{
  "complaint_id": "C101",
  "status": "In Progress",
  "priority": "High",
  "department": "Road Public Works",
  "sla_hours": 48,
  "deadline": "2026-09-22T10:00:00Z",
  "sla_status": "NORMAL",
  "remaining_seconds": 123456.0,
  "last_checked_at": "2026-09-20T18:00:00Z",
  "created_at": "2026-09-20T10:00:00Z",
  "updated_at": "2026-09-20T18:00:00Z"
}
```

---

## 🧪 Testing

Run the automated test suite:
```bash
pytest tests/ -v
```

The test suite covers:
1. **Deadline Calculation**: Deterministic created_at + sla_hours.
2. **Remaining Time Calculation**: Positive and negative values.
3. **NORMAL SLA Status**: Greater than warning threshold.
4. **WARNING SLA Status**: At and below warning threshold.
5. **BREACHED SLA Status**: Zero and negative remaining time.
6. **Configurable Thresholds**: Custom warning percentages.
7. **Pydantic Validation**: Rejecting invalid sla_hours (<=0) and blank fields.
8. **Endpoint Integration**: `/health`, `/monitor/{complaint_id}`, and `/monitor/check`.
