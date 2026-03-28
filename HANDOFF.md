# P·A·R·I·T·Y — Full Project Handoff Document
**Parallel Algorithms for Resolution of Ideological and Tactical Yields**
*LovHack Season 2 — Deadline: Mar 29, 2026*

> ⚠️ THIS FILE IS THE SINGLE SOURCE OF TRUTH. Keep it updated with every change.
> If continuing in Antigravity or any other environment, read this file first.

---

## 🚀 Quick Start (30 seconds)

```bash
# 1. Install deps
npm install
pip install -r requirements.txt

# 2. Set up env
cp .env.example .env
# Add FEATHERLESS_API_KEY (minimum viable — everything else is optional)

# 3. Run
uvicorn main:app --reload --port 8000   # Terminal 1
npm run dev                              # Terminal 2

# Open http://localhost:5173
```

---

## 🎯 What This Project Is

A full-stack AI debate platform. Users enter a topic, pick a side, debate 3 rounds against an AI persona, and receive a scored verdict. Key features:

- **Steelman** — AI generates strongest arguments for BOTH sides before debate starts
- **Turn-based debate** — User types argument, AI streams response in real-time (SSE)
- **Fallacy detector** — Detects logical fallacies in both user and AI messages
- **Coach mode** — AI coach whispers strategic hints (blurred until revealed)
- **5 AI personas** — Socrates, Lawyer, Scientist, Journalist, Kant
- **Scored verdict** — Logic / Evidence / Clarity / Overall rings + winner declaration
- **n8n export** — Sends debate results to an n8n webhook for workflow automation ← **NEW**
- **Miro export** — Creates a visual argument map on a Miro board ← **NEW**
- **Leaderboard** — Hall of fame for top debates

---

## 🏆 Sponsors Integrated

| Sponsor | How integrated | Requirement |
|---------|---------------|-------------|
| 🪶 **Featherless AI** | Primary AI provider — all 5 agent modules use it via `agents/client.py` | `FEATHERLESS_API_KEY` |
| 🔄 **n8n** | Post-debate automation — sends verdict + transcript to n8n webhook | `N8N_WEBHOOK_URL` (optional) |
| 🗺️ **Miro** | Argument map — creates visual debate board on Miro | `MIRO_ACCESS_TOKEN` (optional) |

---

## 📁 Complete File Tree

```
Parity/
│
├── main.py                    # FastAPI server — ALL endpoints here
├── requirements.txt           # Python deps
├── .env.example               # All env vars documented
├── .env                       # Your local keys (NOT committed)
├── START.md                   # Quick start guide
├── HANDOFF.md                 # THIS FILE
├── n8n-workflow.json          # Pre-built n8n workflow (import into n8n)
│
├── agents/
│   ├── __init__.py            # Package exports (includes get_client, get_model)
│   ├── client.py              # Shared AI client — Featherless AI priority over OpenAI
│   ├── steelman_agent.py      # Generates 3 best args for both sides
│   ├── debate_agent.py        # Streams live AI debate response (SSE)
│   ├── judge_agent.py         # Scores debate across 4 dimensions
│   ├── fallacy_agent.py       # Detects logical fallacies (fast model)
│   ├── coach_agent.py         # Strategic coaching hints (fast model)
│   ├── persona_agent.py       # 5 AI personas with full system prompts
│   ├── n8n_agent.py           # Posts debate data to n8n webhook ← NEW
│   └── miro_agent.py          # Creates Miro argument map board ← NEW
│
├── index.html                 # HTML entry point
├── package.json               # Frontend deps
├── vite.config.ts             # Vite + API proxy to :8000
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # Tailwind config (minimal usage)
│
└── src/
    ├── main.tsx               # React entry
    ├── App.tsx                # Screen router with Framer Motion transitions
    │
    ├── store/
    │   └── debateStore.ts     # Zustand global state — screen machine + all debate data
    │
    ├── hooks/
    │   └── useDebate.ts       # All backend calls + SSE consumer + demo fallbacks
    │                          # + exportToN8n() + exportToMiro() ← NEW
    │
    ├── types/
    │   └── index.ts           # All TypeScript interfaces
    │
    ├── index.css              # ~1,050 lines — full design system
    │                          # Nothing dot-matrix + Vercel black aesthetic
    │
    └── components/
        ├── screens/
        │   ├── TopicInput.tsx     # Screen 0 — enter topic + sponsor badges
        │   ├── ModeSelect.tsx     # Screen 1 — pick mode + persona
        │   ├── SteelmanScreen.tsx # Screen 2 — view both-sides arguments
        │   ├── SideSelect.tsx     # Screen 3 — pick FOR or AGAINST
        │   ├── DebateScreen.tsx   # Screen 4 — live debate arena
        │   ├── VerdictScreen.tsx  # Screen 5 — scores + n8n/Miro buttons ← UPDATED
        │   └── LeaderboardScreen.tsx # Screen 6 — hall of fame
        └── ui/
            ├── ScoreRing.tsx      # Animated SVG score ring component
            └── TypewriterText.tsx # Typewriter + loading dots components
```

---

## 🔑 Environment Variables (full reference)

```env
# ══ FEATHERLESS AI (LovHack S2 Sponsor — Required for AI) ══════
FEATHERLESS_API_KEY=your_key_here         # Get at: https://featherless.ai
FEATHERLESS_MODEL=Qwen/Qwen2.5-72B-Instruct    # Main model (debate, steelman, judge)
FEATHERLESS_FAST_MODEL=Qwen/Qwen2.5-7B-Instruct # Fast model (fallacy, coach)

# ══ OPENAI (Fallback if Featherless not set) ═══════════════════
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# ══ n8n (LovHack S2 Sponsor — Optional) ══════════════════════
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/parity-debate
# To get: In n8n, create workflow → add Webhook node → copy URL
# OR run locally: npx n8n → http://localhost:5678

# ══ MIRO (LovHack S2 Sponsor — Optional) ═════════════════════
MIRO_ACCESS_TOKEN=your_miro_token
# To get: https://miro.com/app/settings/user-profile/apps → Create app → Get token
MIRO_TEAM_ID=                             # Optional: auto-detected from token

# ══ SERVER ════════════════════════════════════════════════════
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
PORT=8000
```

---

## 🌐 API Endpoints (complete)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check + provider info |
| POST | `/steelman` | Generate best args for both sides |
| POST | `/debate/stream` | Stream AI response (SSE) |
| POST | `/judge` | Scored verdict (4 dimensions) |
| POST | `/fallacy` | Detect logical fallacies |
| POST | `/coach` | Strategic coaching hint |
| GET  | `/leaderboard` | Top debates |
| POST | `/export/n8n` | ← NEW: Send debate to n8n webhook |
| POST | `/export/miro` | ← NEW: Create Miro argument map, returns boardUrl |

---

## 🔄 n8n Integration Details

**What it does:** After a debate verdict, user clicks "AUTOMATE" → backend POSTs structured debate data to the n8n webhook URL → n8n runs your configured workflow (email, Discord, Sheets, etc.)

**Payload sent to n8n:**
```json
{
  "topic": "string",
  "userSide": "for|against",
  "persona": "socrates|lawyer|scientist|journalist|kant",
  "winner": "user|ai|draw",
  "scores": { "logic": {...}, "evidence": {...}, "clarity": {...}, "overall": {...} },
  "verdict": "string",
  "bestArgument": "string",
  "messageCount": 6,
  "timestamp": "ISO string",
  "source": "parity-debate-engine"
}
```

**Pre-built workflow:** Import `n8n-workflow.json` into n8n → configures Webhook → Format → Email nodes automatically.

**Local n8n (no account needed):**
```bash
npx n8n
# Opens at http://localhost:5678
# Import n8n-workflow.json
# Copy webhook URL → paste into .env as N8N_WEBHOOK_URL
```

---

## 🗺️ Miro Integration Details

**What it does:** User clicks "MAP IN MIRO" on verdict screen → backend creates a Miro board with:
- Center frame: Topic title
- Left column: FOR arguments (green sticky notes)
- Right column: AGAINST arguments (yellow sticky notes)
- Verdict card at bottom (color-coded by winner)
- Returns board URL → frontend opens in new tab

**Miro token:** https://miro.com/app/settings/user-profile/apps → Create Developer App → Get OAuth token

---

## 🖥️ Screen Flow

```
TopicInput (0)
    ↓ Enter topic
ModeSelect (1)
    ↓ Pick mode + persona
SteelmanScreen (2)
    ↓ View both sides
SideSelect (3)
    ↓ Pick FOR/AGAINST
DebateScreen (4)
    ↓ 3 rounds of debate
VerdictScreen (5)      ← n8n + Miro buttons here
    ↓ Hall of Fame
LeaderboardScreen (6)
```

---

## 🎨 Design System

**Fonts:**
- `Space Grotesk` — headings, UI chrome
- `Space Mono` — labels, monospace data, step indicators
- `Inter` — body text, arguments

**Color tokens (in `src/index.css`):**
- `--bg: #000000` — pure Vercel black
- `--brand: #818CF8` — indigo glow (primary accent)
- `--for: #34D399` — green (FOR side)
- `--against: #F472B6` — pink (AGAINST side)
- `--surface: rgba(255,255,255,0.03)` — card background
- `--border: rgba(255,255,255,0.08)` — subtle borders

**Key CSS patterns:**
- `background: radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)` — Nothing dot-grid
- `.full-screen` — `position: fixed; inset: 0`
- `.screen-scroll` — `position: fixed; inset: 0; overflow-y: auto`
- `@keyframes blink` — cursor blink
- `@keyframes spin` — loading spinner
- `@keyframes pulse` — pulsing glow

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| State | Zustand |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend | FastAPI + Uvicorn |
| AI | Featherless AI (OpenAI SDK) |
| Streaming | Server-Sent Events |
| Automation | n8n (webhook) |
| Visual mapping | Miro REST API v2 |

---

## ⚙️ Key Architecture Decisions

1. **Shared AI client (`agents/client.py`)** — All agents import `get_client()` and `get_model()`. Featherless key takes priority; OpenAI is fallback. Changing provider = change one env var.

2. **Demo mode** — Every API call in `useDebate.ts` has a `try/catch` that falls back to hardcoded responses. The app shows full UI flow with zero backend.

3. **SSE streaming** — `/debate/stream` yields `data: {"text": chunk}` lines. Frontend uses `ReadableStream` reader, accumulates chunks, updates Zustand in real-time.

4. **Screen state machine** — Zustand `screen` field drives rendering in `App.tsx`. `AnimatePresence` + `motion.div` slides between screens based on `SCREEN_INDEX` direction diff.

5. **n8n + Miro = optional** — Both integrations fail gracefully if keys aren't set. UI buttons still appear but show "not configured" toast.

---

## ✅ Session 1 Changes (Mar 29, 2026 — Initial Build)

- Created entire project from scratch
- React + TypeScript + Vite frontend
- FastAPI backend
- All 5 agent files (steelman, debate, judge, fallacy, coach, persona)
- Full design system (Nothing dot-matrix × Vercel black)
- All 7 screens with Framer Motion transitions
- Zustand state machine
- SSE streaming debate
- Demo mode fallbacks

## ✅ Session 2 Changes (Mar 29, 2026 — Sponsor Integration)

- Created `agents/client.py` — Featherless AI as primary provider
- Updated all 5 agents to use shared client
- Updated `.env.example` with Featherless as recommended
- Added Featherless badge to TopicInput.tsx
- Updated START.md with Featherless setup guide
- Fixed `@keyframes spin` missing from index.css
- Updated `agents/__init__.py` to export `get_client`, `get_model`

## ✅ Session 3 Changes (Mar 29, 2026 — n8n + Miro Integration)

- Created `agents/n8n_agent.py` — async httpx POST to n8n webhook, full payload with scores/verdict/shareText
- Created `agents/miro_agent.py` — Miro REST API v2, creates board + sticky notes + verdict card
- Added `N8nExportRequest` + `MiroExportRequest` Pydantic models to `main.py`
- Added `POST /export/n8n` endpoint — calls n8n_agent, graceful fail if URL not configured
- Added `POST /export/miro` endpoint — calls miro_agent, returns boardUrl
- Updated `/health` endpoint to show all 4 provider states (featherless, openai, n8n, miro)
- Created `n8n-workflow.json` — ready-to-import n8n workflow (Webhook → Format JS → Respond)
- Updated `VerdictScreen.tsx`:
  - Added `AUTOMATE & VISUALIZE` section with n8n + Miro buttons
  - Real loading/success/error/unconfigured states per button
  - Miro board URL opens in new tab on success
  - Animated link to open Miro board
- Updated `useDebate.ts`:
  - Added `exportToN8n()` — builds full payload from store state, calls /export/n8n
  - Added `exportToMiro()` — uses steelmanFor/steelmanAgainst from store, calls /export/miro
  - Both have demo mode fallbacks when backend offline
- Updated `.env.example` with N8N_WEBHOOK_URL + MIRO_ACCESS_TOKEN + setup instructions
- Updated `TopicInput.tsx` — all 3 sponsor badges in a row (Featherless × n8n × Miro)
- Updated `HANDOFF.md` (this file)

---

## ✅ Session 4 Changes (Mar 29, 2026 — User API Key System)

- Created `src/components/ui/ApiKeyModal.tsx` — beautiful key entry modal
  - Shows/hides key toggle, active badge, GET FREE KEY link
  - Validates key length, success animation on save
  - Clear key button when key is already set
- Updated `src/types/index.ts` — added `apiKey: string` to `DebateState`
- Updated `src/store/debateStore.ts`:
  - `loadStoredKey()` / `saveKeyToStorage()` localStorage helpers
  - `apiKey` loaded from localStorage on store init
  - `setApiKey(key)` action saves to both store + localStorage
  - `reset()` preserves the stored key (doesn't wipe it)
- Updated `src/hooks/useDebate.ts`:
  - `buildHeaders()` util — adds `X-Featherless-Key` header if key is set
  - Both `consumeSSE()` and `apiFetch()` use `buildHeaders()` automatically
- Updated `agents/client.py`:
  - Added `ContextVar[str]` for per-request user key isolation
  - `set_request_key(key)` — called by FastAPI middleware
  - `get_client()` now checks user key first, then env var, then OpenAI
- Updated `main.py`:
  - Import `set_request_key` from agents.client
  - `@app.middleware("http")` — extracts `X-Featherless-Key` header, calls `set_request_key()`
  - Added `X-Featherless-Key` to CORSMiddleware allowed headers
- Updated `src/components/screens/TopicInput.tsx`:
  - Key icon button in top-right nav (green when key active, grey when not)
  - Green dot indicator on the button when key is set
  - Opens `ApiKeyModal` on click
  - `ApiKeyModal` overlay rendered in component

**Result:** Deployed app works with ZERO server-side keys. Users visit the site, click 🔑, paste their Featherless AI key, and all AI calls use their account. Key lives in localStorage, never hits your server storage.

---

## 🚨 Known Issues / Notes

- Leaderboard is mock data (no DB) — fine for hackathon
- Miro requires a Developer App token (not the regular login token)
- n8n webhook URL must be from a running n8n instance
- `agents/client.py` `client` export is actually a function `get_client` — all agents call it as `get_client()` not `client()`

---

## 🔗 Sponsor Links

- Featherless AI: https://featherless.ai/onboarding?returnTo=/account
- n8n: https://n8n.io / local: `npx n8n`
- Miro Dev: https://miro.com/app/settings/user-profile/apps

---

*Last updated: Mar 29, 2026 — Session 3*
