# Smart Civic Issue Resolution Agent

An intelligent, transparent civic issue reporting and municipal resolution platform.

## Project Purpose

**Smart Civic Issue Resolution Agent** bridges the gap between citizens and municipal authorities. It empowers residents to report civic hazards (road repairs, sanitation, street lighting, water leakage) and provides structured visibility from initial report through AI-assisted triage, departmental action, and verified resolution.

```text
Citizen Reports
      ↓
AI-Assisted Processing
      ↓
Authority Action
      ↓
Issue Resolved
```

---

## Architecture Overview

The project is structured with strict **client-server separation**:

```text
Smart Civic Issue Resolution Agent/
│
├── client/                     # Frontend Application (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Footer, Button, Card)
│   │   ├── pages/              # Views (Home, Dashboard, Report Issue, Track Issue)
│   │   ├── layouts/            # Page layouts (MainLayout)
│   │   ├── routes/             # Client-side routing (AppRoutes)
│   │   ├── assets/             # Static assets & icons
│   │   └── utils/              # Helper utilities
│   ├── public/                 # Static public files
│   ├── package.json            # Frontend dependencies and scripts
│   ├── vite.config.js          # Vite configuration
│   └── tailwind.config.js      # Tailwind CSS configuration
│
├── server/                     # Backend API (Node.js + Express)
│   ├── controllers/            # Route controllers (healthController, etc.)
│   ├── routes/                 # API route definitions (healthRoutes, etc.)
│   ├── services/               # Business logic services
│   ├── middleware/             # Express middlewares
│   ├── models/                 # Data models
│   ├── utils/                  # Backend utilities
│   ├── config/                 # Environment & server config
│   ├── .env.example            # Environment template
│   ├── package.json            # Server dependencies and scripts
│   └── server.js               # Main Express application entry point
│
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18.x or later recommended)
- **npm** (v9.x or later)

---

### 1. Server Setup (Backend)

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the environment file from template:
   ```bash
   cp .env.example .env
   ```

4. Start the backend server:
   - **Production / Standard start**:
     ```bash
     npm start
     ```
   - **Development mode (with file watch)**:
     ```bash
     npm run dev
     ```

5. The API server runs at `http://localhost:5000`. You can verify the health check at:
   - `GET http://localhost:5000/api/health`

---

### 2. Client Setup (Frontend)

1. Open a terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - `http://localhost:3000`

5. To build for production:
   ```bash
   npm run build
   ```

---

## End-to-End Civic Complaint & AI Triage Architecture

The platform provides an integrated, end-to-end pipeline connecting citizen reporting to municipal AI triage and PostgreSQL persistence:

```text
Citizen clicks "Use My Location" (Browser navigator.geolocation)
      ↓ (Real latitude & longitude coordinates captured)
Citizen Report Form (React / ReportIssue.jsx)
      ↓ (POST /api/complaints with multipart FormData: title, description, category, severity, address, latitude, longitude, image)
Express Complaint API Gateway (server/server.js)
      ↓ (Validates coordinate ranges -90..90, -180..180 & required fields)
PostgreSQL Persistence (complaints table, Status: 'Pending', CIV-XXXXXX)
      ↓ (POST /api/v1/analyze with complaint_id, description, latitude, longitude, address, image_url)
FastAPI AI Engine (ai_engine/main.py)
      ↓ (Evaluates triage with structured location context, returns issue_type, severity, priority, department, sla_hours)
Persist AI Analysis in PostgreSQL (ai_analysis_status: 'completed')
      ↓
Return Complete Structured Complaint Record to React
      ↓
React Displays Real Submitted Complaint (Address, Coordinates, GPS Source) & AI Triage Results
```

---

## Supported Input Methods

The platform provides flexible and accessible reporting channels for citizens:

1. **Text**: Direct manual typing of title, category, description, and landmarks.
2. **Evidence Image**: Direct upload of JPEG, PNG, or WebP photo evidence (up to 10MB) analyzed by visual inspection.
3. **Voice Input (Browser Speech Recognition)**:
   - Built on native Web Speech API (`window.SpeechRecognition` / `window.webkitSpeechRecognition`).
   - Uses `en-IN` recognition to transcribe spoken complaints directly into editable text in the browser.
   - Populates and appends to the standard complaint `description` field with live interim preview.
   - Requires no backend audio streaming or external cloud speech services.
   - If speech recognition is unsupported or microphone access is denied, users can freely type their description manually.
4. **GPS Location**: One-click acquisition of accurate latitude & longitude coordinates via the browser `navigator.geolocation` API.

---

## API Endpoints

### 1. Submit Citizen Complaint
- **`POST /api/complaints`**
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `title` (string, required, min 3 chars): Short headline of the problem.
  - `description` (string, required, min 10 chars): Detailed description.
  - `category` (string, required): Civic issue category (e.g. `Road & Potholes`).
  - `severity` (string, required): Citizen-assessed urgency (`low`, `medium`, `high`, `critical`).
  - `address` (string, required): Street name, area, or landmark description.
  - `additionalLocation` (string, optional): Extra directional landmark.
  - `latitude` (number, optional): GPS latitude (-90 to 90). Must be paired with `longitude`.
  - `longitude` (number, optional): GPS longitude (-180 to 180). Must be paired with `latitude`.
  - `image` (file, optional): JPEG, PNG, or WebP evidence image (up to 10MB).
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "complaint": {
      "complaint_id": "CIV-102431",
      "title": "Large pothole near college gate",
      "description": "Large pothole causing dangerous conditions near the college entrance.",
      "category": "Road & Potholes",
      "citizen_severity": "high",
      "address": "Near College Gate",
      "additional_location": "Opposite the main entrance",
      "latitude": 16.852400,
      "longitude": 74.581500,
      "status": "Pending",
      "ai_analysis_status": "completed",
      "issue_type": "pothole",
      "ai_severity": "high",
      "priority": "high",
      "department": "road_public_works",
      "sla_hours": 48,
      "ai_confidence": 0.94,
      "evidence_summary": "The complaint describes a road surface depression consistent with a pothole.",
      "suggested_action": "inspect_and_repair",
      "ai_reason": "Deep road depression creates vehicle and pedestrian risk.",
      "image_analyzed": false,
      "created_at": "2026-09-20T14:30:00.000Z",
      "updated_at": "2026-09-20T14:30:01.000Z"
    }
  }
  ```

### 2. AI Engine Analysis
- **`POST /api/v1/analyze`**
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "complaint_id": "CIV-102431",
    "description": "Large pothole near college gate",
    "latitude": 16.8524,
    "longitude": 74.5815,
    "address": "Near College Gate",
    "image_url": "/path/to/evidence.jpg"
  }
  ```
- *Note*: The AI analysis pipeline receives structured `location_context` (coordinates and human-readable address). The current deterministic triage engine classifies issues based on issue text and image evidence; it does not perform advanced GIS geospatial boundary calculations.

### 3. Get All Complaints
- **`GET /api/complaints`**
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "count": 1,
    "complaint": [ ... ]
  }
  ```

### 4. Get Single Complaint by ID
- **`GET /api/complaints/:complaintId`**
- **Response**: `200 OK` or `404 Not Found`

---

## Environment Variables

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civic_agent
AI_ENGINE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
```

### AI Engine (`ai_engine/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### Client (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## How to Run the Full Stack

### 1. PostgreSQL Database
Ensure PostgreSQL is running locally or provide a connection URI in `server/.env`:
```bash
# Verify PostgreSQL is running on localhost:5432
```

### 2. AI Engine Service (FastAPI)
```bash
cd ai_engine
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Health check: `http://localhost:8000/health`

### 3. Express Backend Server
```bash
cd server
npm install
npm run dev
```
Health check: `http://localhost:5000/api/health`
Complaints API: `http://localhost:5000/api/complaints`

### 4. React Client Application
```bash
cd client
npm install
npm run dev
```
Open in browser: `http://localhost:5173` (or `http://localhost:3000`)
Navigate to `Report Issue` to submit a real civic complaint.
