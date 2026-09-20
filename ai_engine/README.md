# AI Intelligence Module (Member 2)

Welcome to the **AI Intelligence Module** for the **Smart Civic Issue Resolution Agent**!

This microservice provides automated civic complaint analysis, multimodal evidence inspection (text and images), controlled category classification, evidence-based severity and priority assessment, municipal department routing, suggested remedial actions, and SLA estimation.

---

## 📁 Directory Structure

```text
ai_engine/
├── .venv/               # Isolated Python virtual environment (ignored by Git)
├── .gitignore           # Git ignore rules for Python artifacts, venv, and credentials
├── .env.example         # Template for environment configuration & API keys
├── requirements.txt     # Python library dependencies (FastAPI, Google GenAI, Pillow, etc.)
├── __init__.py          # Python package marker
├── schemas.py           # Pydantic data schemas with controlled types & structured blocks
├── classifier.py        # Dedicated classification service (Gemini 3.6 Flash + fallback)
├── triage.py            # Evidence-based triage, severity/priority, routing, action & SLA engine
├── service.py           # Orchestration layer for the complete AI pipeline
├── main.py              # FastAPI application (GET /health, POST /api/v1/analyze, POST /api/v1/classify)
├── test_main.py         # Comprehensive automated test suite
└── README.md            # Documentation & setup instructions
```

---

## 🏷️ Controlled Vocabularies

### 1. Categories (`issue_type`)
- `pothole`
- `road_damage`
- `garbage`
- `water_leakage`
- `drainage`
- `streetlight`
- `other`

### 2. Severity (`severity`)
- `low`
- `medium`
- `high`
- `critical`

### 3. Priority (`priority`)
- `low`
- `medium`
- `high`
- `urgent`

### 4. Municipal Departments (`department`)
- `road_public_works`
- `sanitation`
- `water_department`
- `drainage_department`
- `electrical_department`
- `other`

### 5. Suggested Actions (`suggested`)
- `inspect_and_repair` (for `pothole`, `road_damage`)
- `inspect_and_remove` (for `garbage`)
- `inspect_and_repair_leak` (for `water_leakage`)
- `inspect_and_clear_drainage` (for `drainage`)
- `inspect_and_repair_light` (for `streetlight`)
- `review_and_assign` (for `other`)

---

## ⏱️ SLA Rules (Hours)

- `critical` severity OR `urgent` priority: **24 hours**
- `high` severity OR `high` priority: **48 hours**
- `medium` severity OR `medium` priority: **72 hours**
- `low` severity AND `low` priority: **120 hours**

---

## 🔑 Environment Configuration & API Keys

### 1. Create your `.env` file
Duplicate `.env.example`:
```powershell
Copy-Item .env.example .env
```

### 2. Configure `GEMINI_API_KEY`
```env
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

GEMINI_API_KEY=AIzaSy...your_key_here...
GEMINI_MODEL=gemini-3.6-flash
```

> [!CAUTION]
> **SECURITY RULE**:
> - **NEVER commit the `.env` file to Git.**
> - The `.gitignore` file guarantees `.env` is ignored.

---

## 🛡️ Fallback & Test Mode

If `GEMINI_API_KEY` is missing or unavailable:
- The service **automatically falls back** to a deterministic keyword-based classifier and evidence evaluator.
- The API **never crashes** due to API key or network issues.
- All automated tests run in isolated mock/fallback mode and never call the live external API.

---

## 🧪 Running the Tests

Run all automated tests using `pytest`:
```bash
pytest test_main.py -v
```

---

## 🌐 Running the AI Service

Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

- **Base URL**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`

---

## 📡 Structured Response Example (`POST /api/v1/analyze`)

**Request**:
```json
{
  "complaint_id": "C101",
  "description": "There is a large pothole near the college gate.",
  "image_url": null
}
```

**Response**:
```json
{
  "complaint_id": "C101",
  "classification": {
    "issue_type": "pothole",
    "confidence": 0.94
  },
  "evidence": {
    "image_analyzed": false,
    "summary": "A large pothole is reported near the college gate."
  },
  "assessment": {
    "severity": "high",
    "priority": "high",
    "confidence": 0.92
  },
  "routing": {
    "department": "road_public_works",
    "confidence": 0.98
  },
  "action": {
    "suggested": "inspect_and_repair",
    "sla_hours": 48
  },
  "reason": "The reported large pothole may create a road safety risk and requires attention from the road/public works department.",
  "issue_type": "pothole",
  "severity": "high",
  "priority": "high",
  "department": "road_public_works",
  "sla_hours": 48,
  "confidence": 0.94,
  "evidence_summary": "A large pothole is reported near the college gate.",
  "suggested_action": "inspect_and_repair",
  "image_analyzed": false
}
```
