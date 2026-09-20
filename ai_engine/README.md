# AI Intelligence Module (Member 2)

Welcome to the **AI Intelligence Module** for the **Smart Civic Issue Resolution Agent**!

This microservice provides automated civic complaint analysis, multimodal evidence inspection (text and images), controlled category classification, severity assessment, department routing, and SLA timeframe estimation.

---

## 📁 Directory Structure

```text
ai_engine/
├── .venv/               # Isolated Python virtual environment (ignored by Git)
├── .gitignore           # Git ignore rules for Python artifacts, venv, and credentials
├── .env.example         # Template for environment configuration & API keys
├── requirements.txt     # Python library dependencies (FastAPI, Google GenAI, Pillow, etc.)
├── __init__.py          # Python package marker
├── schemas.py           # Pydantic data schemas for request & response validation
├── classifier.py        # Dedicated classification service (Gemini + deterministic fallback)
├── service.py           # Civic triage orchestration & metadata mapping
├── main.py              # FastAPI application (GET /health, POST /api/v1/analyze, POST /api/v1/classify)
├── test_main.py         # Comprehensive automated test suite (16 tests)
└── README.md            # Documentation & setup instructions
```

---

## 🏷️ Supported Controlled Categories

The classifier categorizes every citizen report into strictly one of 7 standardized categories:
1. `pothole` – Road surface depressions, potholes, craters
2. `road_damage` – Broken asphalt, cracked pavement, road structural erosion
3. `garbage` – Overflowing dumpsters, roadside trash, uncollected solid waste
4. `water_leakage` – Broken pipelines, leaking municipal water mains
5. `drainage` – Blocked storm drains, clogged gutters, overflowing sewage
6. `streetlight` – Dark street lamps, blown fixtures, broken electrical poles
7. `other` – General or unmapped civic grievances

---

## 🔑 Environment Configuration & API Keys

### 1. How to create your `.env` file
Duplicate the provided `.env.example` template to create your local `.env` file:
- **Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```
- **Windows (Command Prompt)**:
  ```cmd
  copy .env.example .env
  ```
- **macOS / Linux**:
  ```bash
  cp .env.example .env
  ```

### 2. Where `GEMINI_API_KEY` goes
Open your newly created `.env` file in your editor:
```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

# Google Gemini API Key
# 1. Get your free key from: https://aistudio.google.com/
# 2. Paste it directly after the '=' below:
GEMINI_API_KEY=AIzaSy...your_real_key_here...
GEMINI_MODEL=gemini-3.6-flash
```

> [!CAUTION]
> **SECURITY RULE**:
> - **NEVER commit the `.env` file to Git.**
> - The `.gitignore` file is pre-configured to ignore `.env`.
> - Never hardcode API keys in Python code or paste keys into public chat/GitHub issues.

---

## 🛡️ Fallback & Test Mode (Zero Key Requirement)

**You do NOT need an active API key to test or run this module.**

If `GEMINI_API_KEY` is missing, empty, or fails:
- The service **automatically falls back** to a deterministic, rule-based keyword classifier.
- The API will **never crash** due to a missing or rate-limited API key.
- All automated tests run in fallback/mock mode and do not consume API credits or send external network calls.

---

## 🚀 Quickstart Guide (Step-by-Step)

### 1. Prerequisites
Ensure you have **Python 3.10+** installed on your system.

### 2. Activate Virtual Environment
Navigate to the `ai_engine` directory:
```bash
cd ai_engine
```

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

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🧪 Running the Tests

Run all 16 automated tests using `pytest`:
```bash
pytest test_main.py -v
```

This verifies:
- Classification for all 7 issue types (`pothole`, `garbage`, `water_leakage`, `drainage`, `streetlight`, `road_damage`, `other`).
- Graceful fallback when `GEMINI_API_KEY` is absent.
- Backward compatibility with COMMIT 1 endpoints (`GET /health` and `POST /api/v1/analyze`).
- Input validation and HTTP 422 error handling.
- Graceful handling of invalid or unreachable image URLs without crashing.

---

## 🌐 Starting the API Service

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

- **Base URL**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **ReDoc UI**: `http://localhost:8000/redoc`

---

## 📡 API Endpoints & Contracts

### 1. Health Check
- **`GET /health`**
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "ai-intelligence-module"
  }
  ```

### 2. Issue Classification (Standalone)
- **`POST /api/v1/classify`**
- **Sample Request**:
  ```json
  {
    "complaint_id": "C101",
    "description": "Deep pothole crater on the road.",
    "image_url": null
  }
  ```
- **Sample Response**:
  ```json
  {
    "issue_type": "pothole",
    "confidence": 0.94,
    "evidence_summary": "The complaint describes a road surface depression consistent with a pothole.",
    "image_analyzed": false
  }
  ```

### 3. Comprehensive Complaint Triage Analysis
- **`POST /api/v1/analyze`**
- **Sample Request**:
  ```json
  {
    "complaint_id": "C101",
    "description": "There is a large pothole near the college gate.",
    "image_url": null
  }
  ```
- **Sample Response**:
  ```json
  {
    "complaint_id": "C101",
    "issue_type": "pothole",
    "severity": "High",
    "priority": "P2",
    "department": "Roads & Infrastructure Department",
    "sla_hours": 48,
    "confidence": 0.94,
    "evidence_summary": "The complaint describes a road surface depression consistent with a pothole.",
    "suggested_action": "Dispatch road inspection team.",
    "reason": "The reported road damage may create a safety risk.",
    "image_analyzed": false
  }
  ```
