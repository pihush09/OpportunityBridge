# OpportunityBridge – Your AI-Powered Student Opportunity Assistant

**Discover opportunities. Check your eligibility. Never miss a deadline.**

OpportunityBridge is a student-focused platform that helps college students discover relevant internships, scholarships, hackathons, fellowships, and competitions based on their academic background, skills, and interests.

It combines personalised opportunity matching with Switch-powered AI agent workflows to help students find and organise opportunities more effectively.

## Key Features

- **Personalised Dashboard:** Get an overview of opportunities, matches, saved items, and upcoming deadlines.
- **Opportunity Discovery:** Explore internships, scholarships, fellowships, hackathons, and competitions.
- **Eligibility Matching:** Match opportunities against your degree, branch, academic year, skills, and interests.
- **Match Explanations:** Understand why an opportunity matches your profile.
- **Deadline Tracker:** Monitor upcoming closing dates and rolling opportunities.
- **Save & Track:** Bookmark opportunities and organise your application preparation.
- **Student Profile:** Maintain your academic background, technical skills, and interests.

## How Switch Fits In

Switch is the agent coordination layer behind OpportunityBridge.

The planned agent workflow brings together specialised tasks such as:

1. **Opportunity Scout:** Finds relevant student opportunities.
2. **Verification:** Checks opportunity details, eligibility, and source information.
3. **Bridge Coordinator:** Coordinates the workflow and helps organise verified opportunity data.

Mattermost provides a shared collaboration space where agents and the team can communicate and review workflow activity.

The application also uses a transparent rule-based matching engine to evaluate opportunities against student profiles.

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** JSON-based local persistence
- **Agent Coordination:** Switch
- **Agent Collaboration:** Mattermost
- **Version Control:** Git and GitHub
# OpportunityBridge 🎓

> **AI-Powered Student Opportunity Assistant**  
> Helping college students discover, verify, and match curated internships, scholarships, hackathons, and competitions with deadline tracking and application guidance.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running Locally](#running-locally)
  - [Option A: Start Both Frontend and Backend Concurrently (Recommended)](#option-a-start-both-frontend-and-backend-concurrently-recommended)
  - [Option B: Start Backend and Frontend in Separate Terminals](#option-b-start-backend-and-frontend-in-separate-terminals)
- [Local URLs & Endpoints](#local-urls--endpoints)
- [Running Tests](#running-tests)
- [Environment Configuration](#environment-configuration)

---

## Overview

OpportunityBridge consists of two primary services:

1. **Frontend (`client/`)**: A modern React 18 single-page application built with Vite and Tailwind CSS.
2. **Backend (`server/`)**: An Express.js REST API featuring rule-based opportunity matching, persistence via a file-backed relational database, and Switch multi-agent coordination.

---

## Prerequisites

Before setting up the project locally, ensure you have installed:

- **Node.js**: `v18.11.0` or higher (Node 20+ recommended for built-in `--watch` and `--test` support)
- **npm**: `v9.0.0` or higher
- **Git** (optional, for cloning)

To verify your installed versions, run:

```bash
node -v
npm -v
```

---

## Project Structure

```text
OpportunityBridge/
├── client/          # React frontend
├── server/          # Backend and API
├── package.json
├── package-lock.json
└── .gitignore
```

## Project Goal

Our goal is to make opportunity discovery simpler, more accessible, and more organised for students by bringing relevant opportunities and application preparation into one platform.

## Current Status

The core web application, student profile, opportunity discovery, matching, saved opportunities, and deadline tracking are implemented. Switch agent coordination and collaborative workflow integration are being developed and tested.

---

**Built for the Flip the Switch Hackathon 2026**

*OpportunityBridge – Bridging students with opportunities.*
├── package.json              # Root package with multi-package scripts & concurrently
├── README.md                 # Project documentation & setup instructions
├── client/                   # Frontend React + Vite application
│   ├── package.json          # Client dependencies (React 18, Vite, Tailwind CSS, Lucide)
│   ├── vite.config.js        # Vite config with dev server on port 5173 & API proxy
│   └── src/                  # React components, pages, and API services
└── server/                   # Backend Express.js API
    ├── package.json          # Server dependencies (Express, CORS, Dotenv)
    ├── .env                  # Environment variables (PORT=5000, Switch config)
    ├── .env.example          # Sample environment variables template
    ├── data/                 # Opportunities seed file and local database storage
    │   ├── opportunities.json          # Approved baseline 15 curated opportunities
    │   └── opportunitybridge_db.json   # Local file-backed database
    ├── src/                  # Express app, matching logic, and Switch service
    └── tests/                # Automated unit tests for matching and deduplication
```

---

## Installation

You can install all dependencies across the root, backend, and frontend with a single command or individually.

### Quick Install (All Packages)

From the project root directory, run:

```bash
npm run install:all
```

*This root script automatically installs dependencies for the root workspace, the `server/`, and the `client/`.*

### Manual / Step-by-Step Install

Alternatively, install dependencies in each directory individually:

1. **Install root dependencies (for concurrently):**
   ```bash
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

---

## Running Locally

### Option A: Start Both Frontend and Backend Concurrently (Recommended)

From the root directory, start both the Express backend and the Vite dev server with one command:

```bash
npm run dev
```

*Both servers will launch concurrently in the same terminal with color-coded log prefixes.*

---

### Option B: Start Backend and Frontend in Separate Terminals

If you prefer dedicated terminal windows for backend and frontend logs:

#### 1. Start the Backend Server

- **From the root directory:**
  ```bash
  npm run server
  ```
- **Or from the `server/` directory:**
  ```bash
  cd server
  npm run dev
  ```

> **Note:** `npm run dev` executes `node --watch src/index.js`, automatically restarting the backend whenever files are edited.  
> To start without file watching in production mode, run `npm start` inside `server/`.

#### 2. Start the Frontend Client

Open a new terminal window:

- **From the root directory:**
  ```bash
  npm run client
  ```
- **Or from the `client/` directory:**
  ```bash
  cd client
  npm run dev
  ```

> **Note:** The Vite dev server will start on port `5173` with instant Hot Module Replacement (HMR).

---

## Local URLs & Endpoints

Once running, access the application and APIs at the following local URLs:

| Service / Endpoint | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173/](http://localhost:5173/) | OpportunityBridge UI (Dashboard, Opportunities, Saved, Deadlines, Profile) |
| **Backend API Root** | [http://localhost:5000/](http://localhost:5000/) | Express API root |
| **API Health Check** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | Server health check (`{"status": "ok"}`) |
| **System Status** | [http://localhost:5000/api/status](http://localhost:5000/api/status) | Database statistics, profile state, and integration status |
| **Opportunities API** | [http://localhost:5000/api/opportunities](http://localhost:5000/api/opportunities) | Fetch, filter, and search curated opportunities |
| **Skill Matches API** | [http://localhost:5000/api/matches](http://localhost:5000/api/matches) | Ranked opportunities with match scores and explanations |
| **Deadlines Timeline API** | [http://localhost:5000/api/deadlines](http://localhost:5000/api/deadlines) | Opportunities grouped by urgent, upcoming, rolling, and expired |
| **Real Stats API** | [http://localhost:5000/api/stats](http://localhost:5000/api/stats) | Summary counts for dashboard telemetry |

---

## Running Tests

Automated unit tests use Node's native test runner (`node --test`) to test the rule-based skill matcher and the Switch request deduplication logic without external testing frameworks.

From the `server/` directory:

```bash
cd server
npm test
```

Or run individual test suites directly:

```bash
node server/tests/matcher.test.js
node server/tests/deduplication.test.js
```

---

## Environment Configuration

Backend configuration is loaded from [`server/.env`](file:///server/.env). A template is provided at [`server/.env.example`](file:///server/.env.example).

If setting up for the first time:

```bash
cp server/.env.example server/.env
```

Key environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Express server port |
| `NODE_ENV` | `development` | Runtime environment |
| `DATA_DIR` | `./data` | Path to persistent database directory |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for the Vite frontend |
| `SWITCH_SERVER_URL` | `http://127.0.0.1:64854` | Switch Multi-Agent daemon host URL |
| `SWITCH_ROOM_ID` | *UUID* | Mattermost / Switch agent chat room ID |
| `SWITCH_API_TOKEN` | *Token* | Switch authentication bearer token |
