# AI Intelligence Module (Member 2)

Welcome to the **AI Intelligence Module** for the **Smart Civic Issue Resolution Agent**!

This Python microservice provides automated civic complaint analysis, issue classification, severity assessment, department routing, and SLA timeframe estimation.

---

## 📁 Directory Structure

```text
ai_engine/
├── .venv/               # Isolated Python virtual environment (ignored by Git)
├── .gitignore           # Git ignore rules for Python artifacts & credentials
├── .env.example         # Template for environment configuration
├── requirements.txt     # Python library dependencies
├── schemas.py           # Pydantic data schemas for request & response validation
├── service.py           # Core triage & analysis logic (mock engine for Milestone 1)
├── main.py              # FastAPI application & REST endpoints
├── test_main.py         # Automated test suite (pytest & FastAPI TestClient)
└── README.md            # Documentation & setup instructions
```

---

## 🚀 Quickstart Guide (Step-by-Step)

### 1. Prerequisites
Ensure you have **Python 3.10+** installed on your system.

### 2. Navigate to the `ai_engine` Directory
Open your terminal and run:
```bash
cd ai_engine
```

### 3. Activate the Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt)**:
  ```cmd
  .\.venv\Scripts\activate.bat
  ```
- **macOS / Linux**:
  ```bash
  source .venv/bin/activate
  ```

*(If creating a new virtual environment from scratch: `python -m venv .venv`)*

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🧪 Running the Tests

To run the automated test suite with pytest:
```bash
pytest test_main.py -v
```

This verifies:
1. `GET /health` returns status `ok`.
2. `POST /api/v1/analyze` accepts valid complaint payloads and returns all 10 required fields.
3. Invalid requests (missing fields, wrong data types, empty bodies) return HTTP 422 Unprocessable Entity.

---

## 🌐 Running the AI Service

Start the FastAPI server with auto-reload:
```bash
uvicorn main:app --reload --port 8000
```

The service will start at:
- **Base URL**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **Alternative ReDoc UI**: `http://localhost:8000/redoc`

---

## 📡 API Endpoints

### 1. Health Check
- **Endpoint**: `GET /health`
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "ai-intelligence-module"
  }
  ```

### 2. Analyze Complaint
- **Endpoint**: `POST /api/v1/analyze`
- **Headers**: `Content-Type: application/json`
- **Sample Request Body**:
  ```json
  {
    "complaint_id": "C101",
    "description": "There is a large pothole near the college gate.",
    "image_url": null
  }
  ```
- **Sample Response Body**:
  ```json
  {
    "complaint_id": "C101",
    "issue_type": "Road & Potholes",
    "severity": "High",
    "priority": "P2",
    "department": "Roads & Infrastructure Department",
    "sla_hours": 48,
    "confidence": 0.94,
    "evidence_summary": "Citizen reported road damage: 'There is a large pothole near the college gate.'. Image evidence: None provided.",
    "suggested_action": "Dispatch road inspection team with asphalt patching equipment.",
    "reason": "Road hazard near pedestrian or transit area poses risk of vehicle accidents and damage."
  }
  ```

---

## 🔒 Security & Environment Variables
- Sensitive configuration and API keys are kept in `.env` (which is git-ignored).
- Refer to `.env.example` when configuring your local environment.

