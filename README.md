# OpportunityBridge – Your AI-Powered Student Opportunity Assistant 🎓

> **Discover opportunities. Check your eligibility. Never miss a deadline.**  
> Built for the **Flip the Switch Hackathon 2026** (Submission Deadline: November 7, 2026, 11:59 PM IST)

---

## Table of Contents

- [Overview & Problem Statement](#overview--problem-statement)
- [System Architecture & Shortlist Flow](#system-architecture--shortlist-flow)
- [Operating Modes](#operating-modes)
  - [Mode 1: Basic Mode (Standalone — Zero Dependencies)](#mode-1-basic-mode-standalone--zero-dependencies)
  - [Mode 2: Full Switch Mode (Multi-Agent Swarm)](#mode-2-full-switch-mode-multi-agent-swarm)
- [Full Switch Mode Setup Guide](#full-switch-mode-setup-guide)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Startup Order & Process Flow](#2-startup-order--process-flow)
  - [3. Environment Configuration](#3-environment-configuration)
  - [4. Agent Configuration & Workspace Paths](#4-agent-configuration--workspace-paths)
  - [5. Mattermost Channel Setup & Teammate Interaction](#5-mattermost-channel-setup--teammate-interaction)
- [Database Persistence & Data Integrity](#database-persistence--data-integrity)
- [Project Structure](#project-structure)
- [Quick Start: Local Installation & Run](#quick-start-local-installation--run)
- [Local URLs & API Reference](#local-urls--api-reference)
- [Automated Testing & Coverage](#automated-testing--coverage)
- [Security & Credential Guidelines](#security--credential-guidelines)
- [Hackathon Requirement Alignment](#hackathon-requirement-alignment)

---

## Overview & Problem Statement

College students frequently struggle to discover relevant, verified academic opportunities—such as internships, scholarships, hackathons, fellowships, and competitions—due to fragmented portals, expired deadlines, and complex eligibility criteria.

**OpportunityBridge** solves this problem by providing a student-first web application that combines:

1. **Curated Opportunity Discovery:** Explore vetted opportunities across internships, scholarships, hackathons, and competitions.
2. **Transparent Eligibility & Skill Matching:** A rule-based engine that evaluates academic discipline, year of study, skills, and interests without opaque black-box AI decisions.
3. **Deadline Tracking:** Visual timeline grouping opportunities into *Urgent* (≤ 7 days), *Upcoming* (8–30 days), and *Rolling* deadlines.
4. **Application Guidance & Checklist Persistence:** Interactive, step-by-step preparation checklists (Resume, SOP, Portfolio, Transcripts) persisted per opportunity.
5. **Switch Multi-Agent Coordination (Optional):** An agentic scouting pipeline connecting `bridge-coordinator` and `opportunity-scout` over Mattermost to discover, verify, and synchronize fresh opportunities from the web.

---

## System Architecture & Shortlist Flow

The following diagram illustrates the complete data lifecycle—from student discovery request to agent web scouting, shortlist generation on disk, and database synchronization:

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 18 + Vite :5173)"]
        UI["UI Pages (Dashboard, Discovery, Matches, Deadlines, Saved, Profile)"]
        Modal["Switch Multi-Agent Hub & Sync Modal"]
    end

    subgraph Server ["Backend (Node.js + Express :5000)"]
        Router["Express REST API"]
        Matcher["Rule-Based Matcher & Eligibility Engine"]
        Dedupe["Request Normalizer & Deduplicator"]
        SyncEngine["Shortlist Validator & Sync Service"]
    end

    subgraph LocalStorage ["Local Persistence"]
        DB[("opportunitybridge_db.json\n(Relational Store)")]
        Seed[("opportunities.json\n(15 Baseline Seed)")]
    end

    subgraph SwitchLayer ["Switch Multi-Agent Network (Optional)"]
        SwitchDaemon["Switch Daemon (:64854)"]
        Room["Mattermost Channel:\nOpportunityBridge"]
        AdminAgent["switch-buddy-admin\n(Integration Gateway)"]
        CoordinatorAgent["bridge-coordinator\n(Task Orchestrator)"]
        ScoutAgent["opportunity-scout\n(Live Web Researcher)"]
        ScoutWorkspace[/"Scout Workspace on Disk\n(e.g., piyush-cybersecurity-shortlist.json)"/]
    end

    %% Web Application Flow
    UI <-->|HTTP Requests| Router
    Modal -->|Dispatch Query| Router
    Router --> Matcher
    Router --> DB
    DB -.->|Seed Fallback| Seed

    %% Switch Multi-Agent Flow
    Router --> Dedupe
    Dedupe -->|1. Room Message Webhook| SwitchDaemon
    SwitchDaemon --> Room
    Room <--> AdminAgent
    Room <--> CoordinatorAgent
    CoordinatorAgent -->|2. Delegate Deliverable Task| Room
    Room --> ScoutAgent
    ScoutAgent -->|3. Live Exa Web Search & Link Verification| ScoutAgent
    ScoutAgent -->|4. Write Isolated Shortlist JSON| ScoutWorkspace
    ScoutAgent -->|5. Post Confirmation & Exclusions| Room
    Room --> CoordinatorAgent

    %% Shortlist Sync Flow
    Modal -->|6. Trigger Shortlist Sync| Router
    Router --> SyncEngine
    SyncEngine -->|7. Read & Validate Shortlist JSON| ScoutWorkspace
    SyncEngine -->|8. Insert New Records (Deduplicated)| DB
    DB --> UI
```

---

## Operating Modes

OpportunityBridge is engineered to be **modular and resilient**, supporting two distinct operating modes:

### Mode 1: Basic Mode (Standalone — Zero Dependencies)

> **Important:** Basic Mode requires **no Docker, no Switch Console, and no Mattermost**. Everything runs locally on standard Node.js.

In Basic Mode:
- The entire web application operates out-of-the-box using the local file-backed database (`opportunitybridge_db.json`) and the 15 baseline curated opportunities (`opportunities.json`).
- Students can browse, filter, search, view match scores with explainability, update their academic profile, track deadlines, save opportunities, and persist application checklist progress.
- All core APIs function without external services or network calls.

### Mode 2: Full Switch Mode (Multi-Agent Swarm)

In Full Switch Mode:
- The backend connects to the local Switch server (`SWITCH_SERVER_URL=http://127.0.0.1:64854`) and the `OpportunityBridge` Mattermost room.
- Users can dispatch fresh discovery queries from the UI (e.g., *"Cybersecurity internships for second-year CSE students"*).
- The query passes through backend normalization and deduplication to avoid redundant agent runs.
- Autonomous OpenCode agents collaborate in Mattermost to research, verify official links/deadlines, exclude ineligible programs, and write isolated shortlist JSON files.
- Newly scouted shortlist files are inspected and imported into the local database with duplicate prevention.

---

## Full Switch Mode Setup Guide

Follow this guide to run OpportunityBridge with the complete multi-agent Switch and Mattermost stack.

### 1. Prerequisites

- **Docker Desktop:** Running (required by Switch Console to host the Mattermost container).
- **Switch Console Desktop App:** Installed (provides local agent management and daemon).
- **OpenCode CLI:** Installed (`npm install -g opencode-ai`).

### 2. Startup Order & Process Flow

To bring up the entire multi-agent environment in the correct order:

```text
Step 1: Start Docker Desktop
   ↓
Step 2: Launch Switch Console Application
   ↓ (Switch automatically boots Mattermost container & local daemon on port 64854)
Step 3: Verify the 3 Agents are bound & online in Switch Console:
        - bridge-coordinator
        - opportunity-scout
        - switch-buddy-admin
   ↓
Step 4: Configure server/.env with your local Switch token & workspace path
   ↓
Step 5: Start OpportunityBridge (npm run dev)
```

### 3. Environment Configuration

Copy the template file to create your local `.env`:

```bash
cp server/.env.example server/.env
```

Configure the environment variables in `server/.env`:

```env
PORT=5000
NODE_ENV=development
DATA_DIR=./data
CLIENT_ORIGIN=http://localhost:5173

# Switch Multi-Agent Configuration
SWITCH_SERVER_URL=http://127.0.0.1:64854
SWITCH_ROOM_ID=b721b78a-33b7-4629-9c08-1ddc1def71c6
SWITCH_SENDER_AGENT_ID=3cdb41ce-bdc4-4332-94c7-31ba4da44ba9
SWITCH_COORDINATOR_ID=85bba940-1799-4c1c-8a41-ac7b8e4138ca
SWITCH_SCOUT_ID=814eb770-74f0-4c57-80f7-92ef3ce4bc9e
SWITCH_API_TOKEN=your_switch_agent_token_here
SWITCH_SCOUT_DIR=/path/to/.switch/agents/<host-id>/opportunity-scout
```

> **Security Note:** `server/.env` contains your private local Switch authentication token and is strictly excluded by `.gitignore`. Never commit `server/.env` to Git.

### 4. Agent Configuration & Workspace Paths

The three agents running in Switch:

| Agent Name | Agent ID | Role | Workspace |
| :--- | :--- | :--- | :--- |
| **`bridge-coordinator`** | `85bba940-1799-4c1c-8a41-ac7b8e4138ca` | **Task Orchestrator**: Maintains `PLAN.md`, validates query boundaries, delegates tasks, and verifies deliverables. | `~/.switch/agents/<host-id>/bridge-coordinator` |
| **`opportunity-scout`** | `814eb770-74f0-4c57-80f7-92ef3ce4bc9e` | **Research Specialist**: Uses live web search (Exa) to find opportunities, validates eligibility/deadlines, and writes shortlist files. | `~/.switch/agents/<host-id>/opportunity-scout` |
| **`switch-buddy-admin`** | `3cdb41ce-bdc4-4332-94c7-31ba4da44ba9` | **Gateway**: Used by OpportunityBridge's Express backend to post messages and fetch room history. | `~/.switch/agents/<host-id>/switch-buddy-admin` |

#### How to Configure `SWITCH_SCOUT_DIR`:
- **Linux / macOS:** `~/.switch/agents/<host-id>/opportunity-scout`
- **Windows:** `%USERPROFILE%\.switch\agents\<host-id>\opportunity-scout`
- Replace `<host-id>` with the directory name generated by your Switch instance (e.g., `localhost-60993`).
- *Fallback:* If `SWITCH_SCOUT_DIR` is not configured, the backend automatically checks `server/data/` for shortlist files.

### 5. Mattermost Channel Setup & Teammate Interaction

- **Channel Name:** `OpportunityBridge` (Room ID: `b721b78a-33b7-4629-9c08-1ddc1def71c6`).
- **Accessing the Channel:**
  - Launch Switch Console and select the `OpportunityBridge` room from the channels panel.
  - Alternatively, open the local Mattermost web interface spun up by Switch Console in your browser.
- **How Teammates Can Interact with Agents:**
  - **Direct Coordination:** Type `@bridge-coordinator <message>` to ask about the current plan status or request a new discovery topic.
  - **Verification Inquiries:** Type `@opportunity-scout <message>` to ask why a specific opportunity was included or excluded.
  - **Observing Live Decisions:** Teammates can watch agents evaluate schemes in real time, including reasons for exclusion (e.g., graduation year requirements, expired deadlines, or stale portal dates).
- **Access Requirements:** Access to the local machine running Switch Console with Docker Desktop active.

---

## Database Persistence & Data Integrity

OpportunityBridge uses a schema-indexed, file-backed relational database located at `server/data/opportunitybridge_db.json`, implemented via `LocalDatabase` in [`server/src/config/database.js`](file:///server/src/config/database.js).

### Data Tables

- **`profiles`:** Stores the student's profile (name, degree, branch, year of study, skills, interests, location). Persists across server restarts.
- **`opportunities`:** Stores all active opportunity records. Seeded initially with 15 verified entries from [`server/data/opportunities.json`](file:///server/data/opportunities.json) and expanded when scout shortlists are synchronized.
- **`saved_applications`:** Stores bookmarked opportunities, notes, application status, and per-item checklist progress (`resume`, `sop`, `portfolio`, `transcripts`).
- **`switch_sync_logs`:** Audit trail of all agent dispatches and shortlist synchronizations.
- **`dispatched_requests`:** Historical index of dispatched queries used for intelligent deduplication.

### Data Integrity Rules

- **Baseline Seed Invariance:** The 15 baseline curated opportunities in `opportunities.json` are **immutable** and never modified or deleted.
- **Duplicate Prevention on Import:** When syncing a scout shortlist, opportunities are deduplicated by `id` and `title + organization`. Existing records and bookmarks are preserved.
- **URL & Deadline Validation:** Imports strictly require valid `http://` or `https://` URLs (rejecting placeholder or malformed links) and confirmed dates or explicit `rolling` status.

---

## Project Structure

```text
OpportunityBridge/
├── package.json              # Root package with multi-package scripts & concurrently
├── package-lock.json         # Root dependency lockfile
├── README.md                 # Project documentation & setup instructions
├── .gitignore                # Git exclusions (.env, .data, local DB, build outputs)
├── client/                   # Frontend React 18 application
│   ├── index.html            # Vite HTML entry point
│   ├── package.json          # Client dependencies (React 18, Vite, Tailwind CSS, Lucide)
│   ├── package-lock.json     # Client lockfile
│   ├── postcss.config.js     # PostCSS configuration
│   ├── tailwind.config.js    # Tailwind CSS design system configuration
│   ├── vite.config.js        # Vite configuration (port 5173, /api proxy to :5000)
│   └── src/                  # Client source code
│       ├── main.jsx          # React DOM root render
│       ├── App.jsx           # Main layout, tab router & application shell
│       ├── index.css         # Global Tailwind styles
│       ├── components/       # UI Components
│       │   ├── Navbar.jsx              # Navigation header with system status indicators
│       │   ├── FilterBar.jsx           # Search and category filtering controls
│       │   ├── OpportunityCard.jsx     # Opportunity card with match score and tags
│       │   ├── OpportunityModal.jsx    # Detail view with interactive checklist & guidance
│       │   ├── StatCard.jsx            # Metric summary cards for Dashboard
│       │   └── SwitchStatusModal.jsx   # Switch multi-agent telemetry & sync modal
│       ├── pages/            # Core Views
│       │   ├── DashboardPage.jsx       # Overview metrics, top matches & urgent deadlines
│       │   ├── DiscoveryPage.jsx       # Search & browse all opportunities
│       │   ├── MatchesPage.jsx         # Ranked opportunities with match explanations
│       │   ├── DeadlinesPage.jsx       # Timeline view (urgent, upcoming, rolling)
│       │   ├── SavedApplicationsPage.jsx # Bookmarked items with application progress
│       │   └── ProfilePage.jsx         # Academic year, degree, branch, skills & interests
│       └── services/
│           └── api.js        # Frontend HTTP client for backend endpoints
└── server/                   # Backend Express.js REST API
    ├── package.json          # Backend dependencies (Express, CORS, Dotenv)
    ├── package-lock.json     # Backend lockfile
    ├── .env.example          # Sample environment template (tracked in Git)
    │                         # Note: server/.env is local only and ignored by Git
    ├── data/                 # Seed data and persistent storage
    │   ├── opportunities.json          # Approved immutable 15-entry baseline dataset
    │   ├── profile.json                # Default student profile template
    │   └── README.md                   # Data directory documentation
    │   └── opportunitybridge_db.json   # Local file-backed database (created on run, ignored by Git)
    ├── src/                  # Server source code
    │   ├── index.js          # Express app entry point & route definitions
    │   ├── config/
    │   │   └── database.js   # LocalDatabase relational persistence engine
    │   ├── services/
    │   │   ├── dataLoader.js    # Seed dataset loader and profile initializer
    │   │   ├── matcher.js       # Rule-based eligibility & weighted skill-matching engine
    │   │   └── switchService.js # Switch agent webhook, query deduplication & shortlist sync
    │   └── utils/
    │       └── deadlines.js  # Deadline calculator & categorization utility
    └── tests/                # Automated test suites
        ├── deduplication.test.js # Query normalization & deduplication tests
        └── matcher.test.js       # Matcher scoring, tag mapping & eligibility tests
```

---

## Quick Start: Local Installation & Run

### 1. Prerequisites

- **Node.js:** `v18.11.0` or higher (`Node 20+` or `Node 22+` recommended)
- **npm:** `v9.0.0` or higher
- **Git**

```bash
node -v
npm -v
git --version
```

### 2. Clone & Install Dependencies

```bash
git clone https://github.com/pihush09/OpportunityBridge.git
cd OpportunityBridge
npm run install:all
```

*This installs dependencies across the root, `server/`, and `client/`.*

### 3. Run the Application (Basic Mode)

```bash
npm run dev
```

*This concurrently launches:*
- **Backend API Server:** Listening on `http://localhost:5000`
- **Frontend Vite Client:** Listening on `http://localhost:5173`

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## Local URLs & API Reference

| Service / Endpoint | Method | URL | Description | Verified Status |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web App** | `GET` | [http://localhost:5173/](http://localhost:5173/) | OpportunityBridge UI | Tested & Active |
| **API Health Check** | `GET` | [http://localhost:5000/api/health](http://localhost:5000/api/health) | Returns `{"status": "ok"}` | Tested (200 OK) |
| **System Status** | `GET` | [http://localhost:5000/api/status](http://localhost:5000/api/status) | Database counts & profile state | Tested (200 OK) |
| **Opportunities API** | `GET` | [http://localhost:5000/api/opportunities](http://localhost:5000/api/opportunities) | Filter by category, location, query | Tested (200 OK) |
| **Skill Matches API** | `GET` | [http://localhost:5000/api/matches](http://localhost:5000/api/matches) | Ranked opportunities with scores | Tested (200 OK) |
| **Deadlines API** | `GET` | [http://localhost:5000/api/deadlines](http://localhost:5000/api/deadlines) | Urgent, upcoming, rolling buckets | Tested (200 OK) |
| **Saved Applications** | `GET/POST/PUT` | [http://localhost:5000/api/saved](http://localhost:5000/api/saved) | Bookmarks & checklist progress | Tested (200 OK) |
| **Student Profile API** | `GET/PUT` | [http://localhost:5000/api/profile](http://localhost:5000/api/profile) | Get & update profile info | Tested (200 OK) |
| **Dashboard Stats API** | `GET` | [http://localhost:5000/api/stats](http://localhost:5000/api/stats) | Summary metrics for dashboard | Tested (200 OK) |
| **Switch Dispatch API** | `POST` | [http://localhost:5000/api/switch/request](http://localhost:5000/api/switch/request) | Send request with deduplication | Tested (200 OK) |
| **Switch Sync API** | `POST` | [http://localhost:5000/api/switch/sync](http://localhost:5000/api/switch/sync) | Sync scout shortlist to database | Tested (200 OK) |
| **Switch History API** | `GET` | [http://localhost:5000/api/switch/history](http://localhost:5000/api/switch/history) | Fetch Mattermost room messages | Tested (200 OK) |
| **Available Shortlists** | `GET` | [http://localhost:5000/api/switch/available-shortlists](http://localhost:5000/api/switch/available-shortlists) | List scout shortlist files | Tested (200 OK) |

---

## Automated Testing & Coverage

The backend test suite runs natively with Node's built-in test runner (`node --test`) without third-party test dependencies.

To execute all tests:

```bash
npm test --prefix server
```

### Verified Test Output

```text
> opportunitybridge-server@1.0.0 test
> node --test tests/*.test.js

--- Running Deduplication & Workflow Unit Tests ---
Test 1: Query normalization handles casing, hyphens, and punctuation
✓ Test 1 passed
Test 2: Known covered query for Piyush is detected as duplicate
✓ Test 2 passed
Test 3: Genuinely new search query triggers fresh run
✓ Test 3 passed
Test 4: Cloud computing & DevOps is recognized as genuinely new
✓ Test 4 passed
--- All Deduplication Unit Tests Passed! ---
✔ tests/deduplication.test.js (526ms)
▶ Skill Normalization & Prevention of False Collisions (3 tests)
▶ 16 Required Student Skills Tag Coverage (16 tests)
▶ Score Responsiveness to Relevant Skills vs Unrelated Skills (5 tests)
▶ Scoring Weights and Eligibility Rules Invariance (2 tests)
ℹ tests 27
ℹ suites 4
ℹ pass 27
ℹ fail 0
```

- **Exact Test Counts:** 27 tests executed, 27 passed, 0 failed across 2 test files (`tests/matcher.test.js` and `tests/deduplication.test.js`).
- **Core Tested Capabilities:**
  - 16 technical skill mappings (JavaScript, React, Git, HTML, CSS, Python, C++, Java, web development, frontend, backend, AI, machine learning, CAD, robotics, embedded systems).
  - Substring collision prevention (e.g., distinguishing `AI` or `CAD` without matching unrelated words).
  - Score responsiveness: relevant skills increase match score, while unrelated skills yield 0 delta.
  - Academic eligibility guardrails (ineligible years/branches receive zero match).
  - Intelligent deduplication: whitespace and hyphen variations (`"second-year"` vs `"second year"`) are detected and deduplicated safely.

---

## Security & Credential Guidelines

To ensure repository security and compliance with hackathon submission guidelines:

1. **No Committed Secrets:** Real API keys, Switch tokens, and private credentials must remain strictly in local `.env` files and must **never** be committed to Git.
2. **Ignored Directories:** The root [`.gitignore`](file:///c:/Users/Dell/Downloads/OpportunityBridge/.gitignore) explicitly excludes:
   - `server/.env` and any `.env.*` files (only [`.env.example`](file:///c:/Users/Dell/Downloads/OpportunityBridge/server/.env.example) with placeholder text is tracked).
   - `.data/` (OpenCode agent databases and runtime logs).
   - `server/data/opportunitybridge_db.json` (local user database).
   - `.switch/` (local Switch daemon state and agent workspaces).
   - Build outputs (`client/dist/`, `build/`) and temporary log files.
3. **Template Configuration:** Always share configuration templates using `server/.env.example` with non-sensitive placeholder values.

---

## Hackathon Requirement Alignment

| Hackathon Requirement | OpportunityBridge Implementation | Documentation Reference |
| :--- | :--- | :--- |
| **1. Agents Connected** | Connected to 3 autonomous Switch agents: `bridge-coordinator` (task manager), `opportunity-scout` (researcher), and `switch-buddy-admin` (gateway). | [Switch Multi-Agent Workflow](#switch-multi-agent-workflow) |
| **2. Channel Setup** | Mattermost room `OpportunityBridge` (`b721b78a-33b7-4629-9c08-1ddc1def71c6`) with multi-agent discussion and human interaction. | [Mattermost Channel Setup](#5-mattermost-channel-setup--teammate-interaction) |
| **3. How to Run** | Unambiguous instructions provided for both **Basic Mode** (zero external dependencies) and **Full Switch Mode** (Docker + Switch + Mattermost). | [Quick Start](#quick-start-local-installation--run) & [Full Switch Mode Setup Guide](#full-switch-mode-setup-guide) |
| **4. Reproducible Codebase** | Tested clean builds with Vite; 27/27 automated unit tests passing; zero native build errors. | [Automated Testing & Coverage](#automated-testing--coverage) |

---

*OpportunityBridge – Bridging students with verified opportunities.*  
*Flip the Switch Hackathon 2026*
