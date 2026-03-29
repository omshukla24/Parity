"""
═══════════════════════════════════════════════════════════════
P·A·R·I·T·Y — FastAPI Backend Server
Parallel Algorithms for Resolution of Ideological and Tactical Yields

Endpoints:
  POST /steelman      — Generate both-sides arguments
  POST /debate/stream — Streaming AI debate response (SSE)
  POST /judge         — Generate verdict & scores
  POST /fallacy       — Detect logical fallacies
  POST /coach         — Generate coach hint
  GET  /leaderboard   — Top debates
  GET  /health        — Health check
  POST /export/n8n    — Send debate results to n8n webhook (LovHack S2)
  POST /export/miro   — Create Miro argument map board (LovHack S2)

Run with:
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
═══════════════════════════════════════════════════════════════
"""

import os
import json
import asyncio
import logging
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ── Agent imports ──────────────────────────────────────────────
from agents.steelman_agent import run_steelman
from agents.debate_agent    import stream_debate_response
from agents.judge_agent     import run_judge
from agents.fallacy_agent   import detect_fallacies
from agents.coach_agent     import get_coach_hint
from agents.persona_agent   import get_persona_config
from agents.n8n_agent       import send_to_n8n
from agents.miro_agent      import create_argument_map
from agents.client          import set_request_key, get_provider_name

# ── Logging ────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("parity")

# ── App init ───────────────────────────────────────────────────
app = FastAPI(
    title="P.A.R.I.T.Y. API",
    description="Parallel Algorithms for Resolution of Ideological and Tactical Yields",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Featherless-Key"],
    expose_headers=["X-Featherless-Key"],
)


@app.middleware("http")
async def inject_user_api_key(request: Request, call_next):
    """
    Extract X-Featherless-Key header from each request.
    Sets it in a ContextVar so all agents in this request use the user's key.
    This enables the deployed app to work with user-provided API keys,
    with no keys required on the server.
    """
    user_key = request.headers.get("X-Featherless-Key", "")
    if user_key:
        set_request_key(user_key)
    return await call_next(request)

# ═══════════════════════════════════════════════════════════════
# Request / Response Models
# ═══════════════════════════════════════════════════════════════

class SteelmanRequest(BaseModel):
    topic: str
    mode: str = "casual"

class DebateRequest(BaseModel):
    topic: str
    userSide: str
    userArgument: str
    history: list[dict] = []
    persona: str = "socrates"
    mode: str = "casual"
    round: int = 1

class JudgeRequest(BaseModel):
    topic: str
    userSide: str
    history: list[dict]
    persona: str = "socrates"

class FallacyRequest(BaseModel):
    text: str
    context: str | None = None

class CoachRequest(BaseModel):
    topic: str
    userSide: str
    history: list[dict] = []
    persona: str = "socrates"
    round: int = 1

class N8nExportRequest(BaseModel):
    topic: str
    userSide: str
    persona: str = "socrates"
    winner: str
    scores: dict
    verdict: str
    bestArgument: str = ""
    messageCount: int = 0
    highlights: list[str] = []
    n8nWebhook: str | None = None

class MiroExportRequest(BaseModel):
    topic: str
    userSide: str
    persona: str = "socrates"
    winner: str
    verdict: str
    bestArgument: str = ""
    forArguments: list[str] = []
    againstArguments: list[str] = []
    scores: dict
    miroToken: str | None = None

# ═══════════════════════════════════════════════════════════════
# Routes
# ═══════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "P.A.R.I.T.Y.",
        "version": "1.0.0",
        "ai": {
            "provider":    "Google Gemini 2.5 Flash" if os.getenv("GOOGLE_API_KEY") else
                           ("Featherless AI" if os.getenv("FEATHERLESS_API_KEY") else "not configured"),
            "model":       "gemini-2.5-flash" if os.getenv("GOOGLE_API_KEY") else "Qwen/Qwen2.5-72B-Instruct",
            "google":      bool(os.getenv("GOOGLE_API_KEY")),
            "featherless": bool(os.getenv("FEATHERLESS_API_KEY")),
        },
        "integrations": {
            "n8n":  bool(os.getenv("N8N_WEBHOOK_URL")),
            "miro": bool(os.getenv("MIRO_ACCESS_TOKEN")),
        },
    }


@app.post("/steelman")
async def steelman(req: SteelmanRequest):
    """
    Generate the strongest possible arguments for both sides of the proposition.
    Returns 3 arguments for each side with strength scores.
    """
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    logger.info(f"[STEELMAN] Topic: {req.topic[:80]!r}")

    try:
        result = await run_steelman(topic=req.topic, mode=req.mode)
        return result
    except Exception as e:
        logger.error(f"[STEELMAN] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/debate/stream")
async def debate_stream(req: DebateRequest):
    """
    Stream the AI's debate response using Server-Sent Events.
    The AI adapts based on the full conversation history.
    """
    if not req.userArgument.strip():
        raise HTTPException(status_code=400, detail="User argument cannot be empty")

    logger.info(f"[DEBATE] Round {req.round} | Persona: {req.persona} | Side: {req.userSide}")

    persona_config = get_persona_config(req.persona)

    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in stream_debate_response(
                topic=req.topic,
                user_side=req.userSide,
                user_argument=req.userArgument,
                history=req.history,
                persona_config=persona_config,
                mode=req.mode,
                round_num=req.round,
            ):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
                await asyncio.sleep(0)  # yield control

            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"[DEBATE STREAM] Error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/judge")
async def judge(req: JudgeRequest):
    """
    AI judge evaluates the full debate and returns:
    - Scores across logic, evidence, clarity, overall
    - Winner declaration
    - Verdict text
    - Best argument highlight
    """
    if not req.history:
        raise HTTPException(status_code=400, detail="No debate history to judge")

    logger.info(f"[JUDGE] Topic: {req.topic[:60]!r} | {len(req.history)} messages")

    try:
        result = await run_judge(
            topic=req.topic,
            user_side=req.userSide,
            history=req.history,
            persona=req.persona,
        )
        return result
    except Exception as e:
        logger.error(f"[JUDGE] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/fallacy")
async def fallacy(req: FallacyRequest):
    """
    Detect logical fallacies in a given text.
    Returns a list of detected fallacies with severity and description.
    """
    if not req.text.strip():
        return {"fallacies": []}

    try:
        result = await detect_fallacies(text=req.text, context=req.context)
        return result
    except Exception as e:
        logger.error(f"[FALLACY] Error: {e}")
        return {"fallacies": []}  # Fail silently — don't block the debate


@app.post("/coach")
async def coach(req: CoachRequest):
    """
    Generate a coaching hint for the user's next argument.
    Revealed only in coach mode (blurred by default in UI).
    """
    try:
        result = await get_coach_hint(
            topic=req.topic,
            user_side=req.userSide,
            history=req.history,
            persona=req.persona,
            round_num=req.round,
        )
        return result
    except Exception as e:
        logger.error(f"[COACH] Error: {e}")
        return {
            "hint": "Try attacking the underlying assumption of your opponent's strongest argument.",
            "strategy": "Reframe the discussion around first principles.",
        }


@app.post("/export/n8n")
async def export_to_n8n(req: N8nExportRequest):
    """
    Send completed debate results to an n8n webhook.
    LovHack Season 2 — n8n sponsor integration.

    n8n processes the data via your configured workflow:
    email summaries, Discord posts, Google Sheets logging, etc.
    Import n8n-workflow.json into n8n to get started instantly.
    """
    logger.info(f"[N8N EXPORT] Topic: {req.topic[:60]!r} | Winner: {req.winner}")

    try:
        result = await send_to_n8n(
            topic=req.topic,
            user_side=req.userSide,
            persona=req.persona,
            winner=req.winner,
            scores=req.scores,
            verdict=req.verdict,
            best_argument=req.bestArgument,
            message_count=req.messageCount,
            highlights=req.highlights,
            n8n_webhook=req.n8nWebhook,
        )
        return result
    except Exception as e:
        logger.error(f"[N8N EXPORT] Error: {e}")
        return {"success": False, "message": str(e)}


@app.post("/export/miro")
async def export_to_miro(req: MiroExportRequest):
    """
    Create a visual argument map on a Miro board.
    LovHack Season 2 — Miro sponsor integration.

    Creates: topic frame → FOR/AGAINST columns → verdict card → best argument highlight.
    Returns the board URL for the user to open in their browser.
    """
    logger.info(f"[MIRO EXPORT] Topic: {req.topic[:60]!r}")

    try:
        result = await create_argument_map(
            topic=req.topic,
            user_side=req.userSide,
            persona=req.persona,
            winner=req.winner,
            verdict=req.verdict,
            best_argument=req.bestArgument,
            for_arguments=req.forArguments,
            against_arguments=req.againstArguments,
            scores=req.scores,
            miro_token=req.miroToken,
        )
        return result
    except Exception as e:
        logger.error(f"[MIRO EXPORT] Error: {e}")
        return {"success": False, "message": str(e)}


@app.get("/leaderboard")
async def leaderboard(limit: int = 20):
    """Return top debates (mock data for now — would be DB in production)."""
    mock_entries = [
        {
            "rank": 1,
            "topic": "Social media does more harm than good",
            "winner": "om_s",
            "side": "against",
            "score": 91,
            "votes": 847,
            "timestamp": 1742000000,
            "highlight": "The dopamine feedback loop is by design, not accident.",
        },
        {
            "rank": 2,
            "topic": "AI will eliminate more jobs than it creates",
            "winner": "AI",
            "side": "for",
            "score": 88,
            "votes": 612,
            "timestamp": 1741990000,
            "highlight": "Every industrial revolution promised replacement jobs. None delivered in time.",
        },
        {
            "rank": 3,
            "topic": "Remote work is better than office work",
            "winner": "debater_k",
            "side": "for",
            "score": 85,
            "votes": 534,
            "timestamp": 1741980000,
            "highlight": "Commute time is unpaid labor extracted from workers.",
        },
    ]
    return {"entries": mock_entries[:limit], "total": len(mock_entries)}


# ═══════════════════════════════════════════════════════════════
# Static file serving — React frontend in production
# When dist/ exists (Docker build), FastAPI serves the React SPA.
# In development, Vite dev server handles this via proxy.
# ═══════════════════════════════════════════════════════════════

_DIST = os.path.join(os.path.dirname(__file__), "dist")

if os.path.isdir(_DIST):
    # Serve React static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(_DIST, "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(os.path.join(_DIST, "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Catch-all: serve React SPA for any non-API route (client-side routing)."""
        # Don't intercept API routes
        if full_path.startswith(("api/", "health", "steelman", "debate", "judge",
                                  "fallacy", "coach", "leaderboard", "export")):
            raise HTTPException(status_code=404)
        file_path = os.path.join(_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_DIST, "index.html"))

    logger.info(f"✅ Serving React frontend from {_DIST}")
else:
    logger.info("ℹ️  No dist/ found — running in dev mode (use Vite for frontend)")


# ═══════════════════════════════════════════════════════════════
# Entry point
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
