# P·A·R·I·T·Y — Quick Start Guide
**Parallel Algorithms for Resolution of Ideological and Tactical Yields**
LovHack Season 2 · Debate Intelligence Engine · Powered by Featherless AI 🪶

---

## 1. Setup Environment

```bash
cp .env.example .env
# Add FEATHERLESS_API_KEY — minimum required for AI to work
```

> **No key?** App runs in full **demo mode** — explore every screen with pre-written responses.

---

## 2. Install & Run Locally

```bash
# Frontend (Node.js 18+)
npm install
npm run dev          # → http://localhost:5173

# Backend (Python 3.11+) — separate terminal
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 3. AI Providers

### 🪶 Featherless AI (Primary — LovHack S2 Sponsor)
Get key: https://featherless.ai/onboarding?returnTo=/account

```env
FEATHERLESS_API_KEY=your_key_here
FEATHERLESS_MODEL=Qwen/Qwen2.5-72B-Instruct
FEATHERLESS_FAST_MODEL=Qwen/Qwen2.5-7B-Instruct
```

| Model | Best for |
|-------|----------|
| `Qwen/Qwen2.5-72B-Instruct` | Default |
| `meta-llama/Llama-3.3-70B-Instruct` | Strong reasoning |
| `mistralai/Mixtral-8x22B-Instruct-v0.1` | Fast |
| `deepseek-ai/DeepSeek-V3` | Analytical |

### 🔄 n8n (LovHack S2 Sponsor — Self-hosted, free)
```bash
# No account needed. Run locally:
npx n8n
# Opens at http://localhost:5678
# Import n8n-workflow.json → copy webhook URL
```
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/parity-debate
```
For permanent URL: deploy n8n to Google Cloud Run (see below) or use ngrok.

### 🗺️ Miro (LovHack S2 Sponsor — Optional)
Get token: https://miro.com/app/settings/user-profile/apps → Create App → OAuth token
```env
MIRO_ACCESS_TOKEN=your_token
```

---

## 4. Deploy to Google Cloud Run

**One container, one command.** Frontend + backend served together.

### Prerequisites (one-time setup)
```bash
# Install Google Cloud CLI
# Mac:
brew install --cask google-cloud-sdk
# Windows: https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud projects create parity-debate --name="P.A.R.I.T.Y."
gcloud config set project parity-debate
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### Deploy
```bash
# Build frontend first
npm run build

# Deploy to Cloud Run (builds + deploys in one command)
gcloud run deploy parity \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --set-env-vars "FEATHERLESS_API_KEY=your_key,N8N_WEBHOOK_URL=your_url"
```

Your app will be live at: `https://parity-XXXX-uc.a.run.app`

### Re-deploy after changes
```bash
npm run build && gcloud run deploy parity --source . --region us-central1
```

---

## 5. GitHub Setup

```bash
# From inside the Parity folder:
git init
git add -A
git commit -m "feat: P.A.R.I.T.Y. — LovHack S2 submission"

# Create repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/parity.git
git branch -M main
git push -u origin main
```

### Auto-deploy on push (GitHub Actions)
Create `.github/workflows/deploy.yml` — every push to main auto-deploys to Cloud Run.
See: https://cloud.google.com/run/docs/continuous-deployment-with-cloud-build

---

## 6. n8n on Google Cloud (permanent webhook)

```bash
# Deploy n8n as a separate Cloud Run service
gcloud run deploy n8n \
  --image n8nio/n8n \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 5678 \
  --memory 512Mi \
  --set-env-vars "N8N_HOST=n8n-XXXX-uc.a.run.app,N8N_PROTOCOL=https"
```

Then update `N8N_WEBHOOK_URL` in your P.A.R.I.T.Y. Cloud Run env vars.

---

## Project Structure

```
Parity/
├── main.py               # FastAPI — API + serves React in production
├── Dockerfile            # Multi-stage: Node build → Python serve
├── requirements.txt      # Python deps
├── agents/
│   ├── client.py         # Featherless AI / OpenAI — per-request user key
│   ├── steelman_agent.py
│   ├── debate_agent.py   # SSE streaming
│   ├── judge_agent.py
│   ├── fallacy_agent.py
│   ├── coach_agent.py
│   ├── persona_agent.py  # 5 AI personas
│   ├── n8n_agent.py      # n8n webhook sender
│   └── miro_agent.py     # Miro board creator
├── n8n-workflow.json     # Import into n8n instantly
└── src/
    ├── App.tsx            # Screen router
    ├── store/             # Zustand state
    ├── hooks/useDebate.ts # All API calls + export hooks
    └── components/
        ├── screens/       # 7 screens
        └── ui/
            └── ApiKeyModal.tsx  # User-provided Featherless key
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Status + all provider states |
| POST | `/steelman` | Both-sides arguments |
| POST | `/debate/stream` | Live AI debate (SSE) |
| POST | `/judge` | Scored verdict |
| POST | `/fallacy` | Fallacy detection |
| POST | `/coach` | Strategy hint |
| GET | `/leaderboard` | Hall of fame |
| POST | `/export/n8n` | Send to n8n workflow |
| POST | `/export/miro` | Create Miro board |

---

## Tech Stack

**Frontend:** React 18 · TypeScript · Vite · Zustand · Framer Motion
**Backend:** FastAPI · Uvicorn · httpx
**AI:** Featherless AI (Qwen2.5-72B/7B) via OpenAI SDK
**Automation:** n8n (self-hosted) · Miro REST API
**Deploy:** Google Cloud Run · Docker

---

*Built for LovHack Season 2 | Deadline: Mar 29, 2026 | Sponsors: Featherless AI 🪶 · n8n ⚡ · Miro 🗺️*
