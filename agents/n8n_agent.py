"""
═══════════════════════════════════════════════════════════════
P·A·R·I·T·Y — n8n Automation Agent
LovHack Season 2 Sponsor Integration

Sends completed debate data to an n8n webhook for workflow automation.
Works with any n8n workflow — email, Discord, Sheets, Notion, etc.

n8n setup:
  Cloud:  https://n8n.io
  Local:  npx n8n  →  http://localhost:5678

Import n8n-workflow.json into n8n for a pre-built workflow.
Set N8N_WEBHOOK_URL in .env to your webhook URL.
═══════════════════════════════════════════════════════════════
"""

import os
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("parity.n8n")

N8N_TIMEOUT = 10  # seconds


def get_n8n_webhook_url() -> Optional[str]:
    """Get configured n8n webhook URL from environment."""
    url = os.getenv("N8N_WEBHOOK_URL", "").strip()
    return url if url else None


async def send_to_n8n(
    topic: str,
    user_side: str,
    persona: str,
    winner: str,
    scores: dict,
    verdict: str,
    best_argument: str,
    message_count: int,
    highlights: Optional[list] = None,
) -> dict:
    """
    POST debate results to configured n8n webhook.

    Returns:
        {"success": True, "message": "..."} on success
        {"success": False, "message": "...", "demo": True} if not configured
        {"success": False, "message": "..."} on error
    """
    webhook_url = get_n8n_webhook_url()

    if not webhook_url:
        logger.info("[N8N] No webhook URL configured — returning demo response")
        return {
            "success": False,
            "message": "N8N_WEBHOOK_URL not configured. Add it to .env to enable automation.",
            "demo": True,
            "instructions": "Run 'npx n8n' locally → import n8n-workflow.json → copy webhook URL",
        }

    # ── Build payload ────────────────────────────────────────────
    payload = {
        "source": "parity-debate-engine",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "topic": topic,
        "userSide": user_side,
        "persona": persona,
        "winner": winner,
        "winnerLabel": "You" if winner == "user" else "AI" if winner == "ai" else "Draw",
        "scores": {
            "logic": {
                "userScore": scores.get("logic", {}).get("userScore", 0),
                "aiScore": scores.get("logic", {}).get("aiScore", 0),
                "commentary": scores.get("logic", {}).get("commentary", ""),
            },
            "evidence": {
                "userScore": scores.get("evidence", {}).get("userScore", 0),
                "aiScore": scores.get("evidence", {}).get("aiScore", 0),
                "commentary": scores.get("evidence", {}).get("commentary", ""),
            },
            "clarity": {
                "userScore": scores.get("clarity", {}).get("userScore", 0),
                "aiScore": scores.get("clarity", {}).get("aiScore", 0),
                "commentary": scores.get("clarity", {}).get("commentary", ""),
            },
            "overall": {
                "userScore": scores.get("overall", {}).get("userScore", 0),
                "aiScore": scores.get("overall", {}).get("aiScore", 0),
                "commentary": scores.get("overall", {}).get("commentary", ""),
            },
        },
        "verdict": verdict,
        "bestArgument": best_argument,
        "messageCount": message_count,
        "highlights": highlights or [],
        "shareText": (
            f'I debated "{topic}" on P·A·R·I·T·Y. '
            f'Taking the {user_side.upper()} side against {persona.title()}. '
            f'Result: {"I won! 🏆" if winner == "user" else "The AI won. 🤖" if winner == "ai" else "A draw! 🤝"} '
            f'Overall score: {scores.get("overall", {}).get("userScore", 0)}/100. '
            f'Try it at parity.debate'
        ),
    }

    # ── POST to n8n ──────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=N8N_TIMEOUT) as client:
            response = await client.post(
                webhook_url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-Source": "parity-debate-engine",
                },
            )
            response.raise_for_status()
            logger.info(f"[N8N] ✅ Webhook fired → {response.status_code}")

            # n8n returns 200 with workflow execution details
            try:
                n8n_response = response.json()
            except Exception:
                n8n_response = {}

            return {
                "success": True,
                "message": "Debate sent to n8n automation workflow!",
                "webhookStatus": response.status_code,
                "n8nResponse": n8n_response,
            }

    except httpx.TimeoutException:
        logger.warning("[N8N] Webhook timeout")
        return {
            "success": False,
            "message": "n8n webhook timed out. Is your n8n instance running?",
        }
    except httpx.HTTPStatusError as e:
        logger.error(f"[N8N] HTTP error: {e.response.status_code}")
        return {
            "success": False,
            "message": f"n8n returned HTTP {e.response.status_code}. Check your webhook URL.",
        }
    except Exception as e:
        logger.error(f"[N8N] Unexpected error: {e}")
        return {
            "success": False,
            "message": f"Failed to reach n8n: {str(e)}",
        }
