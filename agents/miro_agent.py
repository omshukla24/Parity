"""
═══════════════════════════════════════════════════════════════
P·A·R·I·T·Y — Miro Argument Map Agent
LovHack Season 2 Sponsor Integration

Creates a visual argument map on a Miro board after each debate:
  - Topic frame at top
  - FOR arguments (green sticky notes, left column)
  - AGAINST arguments (yellow sticky notes, right column)
  - Verdict card at bottom (color-coded by winner)
  - Best argument highlighted with a star shape

Miro setup:
  1. Go to: https://miro.com/app/settings/user-profile/apps
  2. Create a Developer App
  3. Generate an OAuth token
  4. Add to .env: MIRO_ACCESS_TOKEN=your_token
═══════════════════════════════════════════════════════════════
"""

import os
import httpx
import logging
from typing import Optional

logger = logging.getLogger("parity.miro")

MIRO_BASE_URL = "https://api.miro.com/v2"
MIRO_TIMEOUT = 15  # seconds

# ── Layout constants (in Miro units) ────────────────────────────
BOARD_WIDTH   = 3200
BOARD_HEIGHT  = 2200
CENTER_X      = 0
CENTER_Y      = 0

# Card dimensions
STICKY_W      = 350
STICKY_H      = 200
FRAME_W       = 800
FRAME_H       = 120

# Column positions
FOR_X         = -700
AGAINST_X     = 700
ARG_START_Y   = 200
ARG_GAP_Y     = 240


def get_miro_token() -> Optional[str]:
    return os.getenv("MIRO_ACCESS_TOKEN", "").strip() or None


def get_miro_team_id() -> Optional[str]:
    return os.getenv("MIRO_TEAM_ID", "").strip() or None


async def _miro_post(client: httpx.AsyncClient, token: str, path: str, data: dict) -> dict:
    """POST to Miro API."""
    resp = await client.post(
        f"{MIRO_BASE_URL}{path}",
        json=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    resp.raise_for_status()
    return resp.json()


async def create_argument_map(
    topic: str,
    user_side: str,
    persona: str,
    winner: str,
    verdict: str,
    best_argument: str,
    for_arguments: list[str],
    against_arguments: list[str],
    scores: dict,
    miro_token: Optional[str] = None,
) -> dict:
    """
    Create a Miro board with the full argument map.

    Returns:
        {"success": True, "boardUrl": "...", "boardId": "..."}
        {"success": False, "message": "...", "demo": True} if not configured
        {"success": False, "message": "..."} on error
    """
    token = miro_token or get_miro_token()

    if not token:
        logger.info("[MIRO] No token configured — returning demo response")
        return {
            "success": False,
            "message": "MIRO_ACCESS_TOKEN not configured.",
            "demo": True,
            "instructions": "Get token at: https://miro.com/app/settings/user-profile/apps",
            "previewUrl": "https://miro.com",
        }

    # Color by winner
    winner_color = "#34D399" if winner == "user" else "#F472B6" if winner == "ai" else "#818CF8"
    winner_label = "YOU WIN 🏆" if winner == "user" else "AI WINS 🤖" if winner == "ai" else "DRAW 🤝"
    overall_user = scores.get("overall", {}).get("userScore", 0)
    overall_ai   = scores.get("overall", {}).get("aiScore", 0)

    try:
        async with httpx.AsyncClient(timeout=MIRO_TIMEOUT) as client:

            # ── 1. Create board ──────────────────────────────────
            board_payload: dict = {
                "name": f"P·A·R·I·T·Y — {topic[:60]}",
                "description": f"Debate argument map | {user_side.upper()} vs {persona.title()} | Winner: {winner_label}",
            }
            team_id = get_miro_team_id()
            if team_id:
                board_payload["teamId"] = team_id

            board = await _miro_post(client, token, "/boards", board_payload)
            board_id = board["id"]
            board_url = board.get("viewLink", f"https://miro.com/app/board/{board_id}/")
            logger.info(f"[MIRO] ✅ Board created: {board_id}")

            # ── 2. Topic title frame ─────────────────────────────
            await _miro_post(client, token, f"/boards/{board_id}/shapes", {
                "data": {
                    "content": f"<p><strong>💬 {topic}</strong></p>",
                    "shape": "rectangle",
                },
                "style": {
                    "fillColor": "#0F0F0F",
                    "borderColor": "#818CF8",
                    "borderWidth": "3",
                    "color": "#FFFFFF",
                    "fontSize": "24",
                    "textAlign": "center",
                    "textAlignVertical": "middle",
                },
                "position": {"x": CENTER_X, "y": CENTER_Y - 500},
                "geometry": {"width": FRAME_W, "height": FRAME_H},
            })

            # ── 3. Column headers ────────────────────────────────
            for side_x, label, color in [
                (FOR_X,     "✅ FOR",     "#34D399"),
                (AGAINST_X, "❌ AGAINST", "#F472B6"),
            ]:
                await _miro_post(client, token, f"/boards/{board_id}/shapes", {
                    "data": {
                        "content": f"<p><strong>{label}</strong></p>",
                        "shape": "rectangle",
                    },
                    "style": {
                        "fillColor": color + "22",
                        "borderColor": color,
                        "borderWidth": "2",
                        "color": color,
                        "fontSize": "20",
                        "textAlign": "center",
                        "textAlignVertical": "middle",
                    },
                    "position": {"x": side_x, "y": CENTER_Y - 300},
                    "geometry": {"width": STICKY_W + 50, "height": 70},
                })

            # ── 4. FOR argument sticky notes ─────────────────────
            for i, arg_text in enumerate(for_arguments[:4]):
                y_pos = ARG_START_Y + (i * ARG_GAP_Y) - 200
                await _miro_post(client, token, f"/boards/{board_id}/sticky_notes", {
                    "data": {
                        "content": arg_text[:280],
                        "shape": "rectangle",
                    },
                    "style": {
                        "fillColor": "light_green",
                        "textAlign": "left",
                        "textAlignVertical": "top",
                    },
                    "position": {"x": FOR_X, "y": y_pos},
                    "geometry": {"width": STICKY_W},
                })

            # ── 5. AGAINST argument sticky notes ─────────────────
            for i, arg_text in enumerate(against_arguments[:4]):
                y_pos = ARG_START_Y + (i * ARG_GAP_Y) - 200
                await _miro_post(client, token, f"/boards/{board_id}/sticky_notes", {
                    "data": {
                        "content": arg_text[:280],
                        "shape": "rectangle",
                    },
                    "style": {
                        "fillColor": "yellow",
                        "textAlign": "left",
                        "textAlignVertical": "top",
                    },
                    "position": {"x": AGAINST_X, "y": y_pos},
                    "geometry": {"width": STICKY_W},
                })

            # ── 6. Best argument highlight ────────────────────────
            if best_argument:
                await _miro_post(client, token, f"/boards/{board_id}/sticky_notes", {
                    "data": {
                        "content": f"⭐ BEST ARGUMENT\n\n\"{best_argument[:240]}\"",
                        "shape": "rectangle",
                    },
                    "style": {
                        "fillColor": "orange",
                        "textAlign": "center",
                        "textAlignVertical": "middle",
                    },
                    "position": {"x": CENTER_X, "y": 900},
                    "geometry": {"width": 600},
                })

            # ── 7. Verdict card at bottom ─────────────────────────
            score_line = f"You {overall_user} | AI {overall_ai}"
            await _miro_post(client, token, f"/boards/{board_id}/shapes", {
                "data": {
                    "content": (
                        f"<p><strong>{winner_label}</strong></p>"
                        f"<p>{score_line}</p>"
                        f"<p><em>{verdict[:300]}</em></p>"
                    ),
                    "shape": "rectangle",
                },
                "style": {
                    "fillColor": winner_color + "22",
                    "borderColor": winner_color,
                    "borderWidth": "3",
                    "color": "#FFFFFF",
                    "fontSize": "16",
                    "textAlign": "center",
                    "textAlignVertical": "middle",
                },
                "position": {"x": CENTER_X, "y": 1150},
                "geometry": {"width": 800, "height": 160},
            })

            logger.info(f"[MIRO] ✅ Argument map complete → {board_url}")
            return {
                "success": True,
                "boardUrl": board_url,
                "boardId": board_id,
                "message": "Argument map created on Miro!",
            }

    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        logger.error(f"[MIRO] HTTP {status}: {e.response.text[:200]}")
        if status == 401:
            return {"success": False, "message": "Invalid Miro token. Check MIRO_ACCESS_TOKEN in .env."}
        if status == 403:
            return {"success": False, "message": "Miro permission denied. Ensure your app has board:write scope."}
        return {"success": False, "message": f"Miro API error: HTTP {status}"}

    except httpx.TimeoutException:
        return {"success": False, "message": "Miro API timed out. Try again."}

    except Exception as e:
        logger.error(f"[MIRO] Unexpected error: {e}")
        return {"success": False, "message": f"Miro error: {str(e)}"}
