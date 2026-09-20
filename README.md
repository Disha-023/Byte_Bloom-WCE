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

## Current Status (Phase 1)

- **Commit 1**: Client-Server baseline architecture established.
- Reusable UI component system with React Router, Lucide icons, and Tailwind CSS.
- Express server foundation with CORS, environment configuration, and health check endpoint.
- Subsequent phases will introduce MongoDB/PostgreSQL database models, citizen authentication, AI/LLM categorization triage, and administrative resolution workflows.
