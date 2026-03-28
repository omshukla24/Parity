# P·A·R·I·T·Y ⚖️
**Parallel Algorithms for Resolution of Ideological and Tactical Yields**

Welcome to **Parity**, a next-generation Debate Intelligence Engine built for **LovHack Season 2**. It is an interactive platform where users engage in live, AI-powered debates against distinct AI personas, receiving real-time logic analysis, fallacy detection, coaching hints, and a final scored verdict.

**Live Demo**: [https://parity-590758428196.us-central1.run.app](https://parity-590758428196.us-central1.run.app)

---

## 🌟 Key Features
- **Live AI Debate (SSE)**: Engage in real-time, low-latency arguments via Server-Sent Events.
- **Steelman Engine**: Automatically generates the strongest possible arguments for both sides of any topic before the debate begins.
- **Dynamic AI Personas**: Face off against Socrates (philosophical), Machiavelli (ruthless), The Scientist (empirical), The Troll (provocative), or The Diplomat (balanced).
- **Real-Time Fallacy Detection**: Analyzes opponent and user arguments live to detect logical fallacies.
- **Master Debate Coach**: Offers hidden, strategic hints on how to dismantle your opponent's latest point.
- **Impartial AI Judge**: Delivers a final verdict scoring logic, evidence, and clarity, crowning a winner.
- **Sponsor Integrations**: 
  - **Featherless AI 🪶**: Core intelligence engine driving the robust Qwen 2.5 72B Instruct models.
  - **Miro 🗺️**: Instantly exports the entire debate map (arguments, verdict) to a structured Miro board.
  - **n8n 🔄**: Sends structured debate analytics to an n8n webhook workflow for extended automation (emails, logging).

---

## 🏗️ Architecture & Tech Stack

P.A.R.I.T.Y. utilizes a highly optimized, decoupled monolithic architecture hosted on a single container in Google Cloud Run. 

### **Frontend (The Arena)**
- **Framework**: React 18 + TypeScript built with Vite.
- **State Management**: Zustand for global debate and UI state.
- **Styling**: Tailwind CSS + Framer Motion for fluid, glassmorphic UI animations.
- **Client Routing**: React ecosystem architecture with dedicated screen components (`DebateArena`, `SteelmanView`, `VerdictScreen`, etc.).

### **Backend (The Brain)**
- **Framework**: FastAPI (Python 3.11) with Uvicorn.
- **Streaming**: Native Python Async Generators utilizing Server-Sent Events (`text/event-stream`) for zero-latency AI text streaming.
- **Agents Structure**: Highly modular AI Agent pattern (`steelman_agent`, `debate_agent`, `judge_agent`, `fallacy_agent`, `coach_agent`).
- **Provider Agnostic Client**: A shared AI client gracefully falling back between user-provided Featherless AI keys and server-configured Google Gemini / Featherless API keys using the `openai` Python SDK.

### **Deployment Pipeline**
- **Infrastructure**: Google Cloud Run (Fully managed serverless platform).
- **Containerization**: Multi-stage `Dockerfile`.
  - *Stage 1*: Node.js 20 environment securely installs, builds, and bundles the Vite React app into static files (`dist/`).
  - *Stage 2*: Python 3.11 slim environment installs backend dependencies via `requirements.txt`, copies the built frontend from Stage 1, and serves both API routes and static assets over port `8080`.

---

## 🚀 Running Locally

### 1. Environment Setup
Create a `.env` file in the root directory and add the following keys. If no keys are provided, the app will run in a graceful *demo mode*.
```env
FEATHERLESS_API_KEY=your_featherless_api_key
GOOGLE_API_KEY=your_gemini_api_key (optional fallback)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/parity-debate (optional)
MIRO_ACCESS_TOKEN=your_miro_token (optional)
```

### 2. Start the Frontend
In one terminal window:
```bash
npm install
npm run dev
# The frontend will start at http://localhost:5173
```

### 3. Start the Backend API
In a separate terminal window:
```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# The backend will start at http://localhost:8000
```
*Note: The frontend leverages Vite proxies to route `/api/*` requests to port 8000.*

---

## ☁️ Deployment (Cloud Run)

Deployment is automated via a multi-stage Docker build, ensuring zero manual file transfers.

```bash
# Set your Google Cloud Project
gcloud config set project your-project-id

# Build and Deploy in one command
gcloud run deploy parity \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --clear-base-image \
  --set-env-vars="FEATHERLESS_API_KEY=your_key,GOOGLE_API_KEY=your_key"
```

---

## 🔌 API Endpoints
The Fast API server exposes the following endpoints (available at `/docs` locally for Swagger UI):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | `GET` | System health check and AI provider resolution status. |
| `/steelman` | `POST` | Generates strongest possible arguments for FOR and AGAINST. |
| `/debate/stream` | `POST` | Streams the LIVE AI opponent response using SSE. |
| `/judge` | `POST` | Evaluates debate history and returns a scored verdict. |
| `/fallacy` | `POST` | Scans text for classic logical fallacies entirely async. |
| `/coach` | `POST` | Provides a tactical hint based on the opponent's last move. |
| `/export/n8n` | `POST` | Pushes full debate JSON analytics to your n8n webhook. |
| `/export/miro` | `POST` | Uses Miro REST API to generate a visual debate argument map. |

---
*Developed for LovHack Season 2*
