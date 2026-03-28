"""
P·A·R·I·T·Y — Shared AI Client
─────────────────────────────────────────────────────────────────
Provider priority per request:

  1. X-Featherless-Key header (user's own key)
       → Featherless AI + Qwen 2.5 72B
       (user manages their own limits — developer never sees the key)

  2. GOOGLE_API_KEY env var  ← PRIMARY SERVER MODEL
       → Google Gemini 2.5 Flash
       (OpenAI-compatible endpoint, 1M token context, fast + smart)

  3. FEATHERLESS_API_KEY env var
       → Featherless AI + Qwen 2.5 72B
       (rate-limit fallback / alternative)

  4. None set → raises a clear error

Model: gemini-2.5-flash by default.
       Best speed/quality ratio in its class.
       Other strong options: gemini-2.0-flash (stable), gemini-1.5-pro (long context)
─────────────────────────────────────────────────────────────────
"""

import os
import logging
from contextvars import ContextVar
from openai import AsyncOpenAI

logger = logging.getLogger("parity.client")

# ── Google Gemini (Primary — OpenAI-compatible endpoint) ───────
GOOGLE_BASE_URL   = "https://generativelanguage.googleapis.com/v1beta/openai/"
GEMINI_MODEL      = "gemini-2.5-flash"     # primary: huge ctx, best quality
GEMINI_FAST_MODEL = "gemini-2.0-flash"     # fast: fallacy detection, coach hints

# ── Featherless AI (LovHack S2 Sponsor / User Key / Fallback) ──
FEATHERLESS_BASE_URL      = "https://api.featherless.ai/v1"
FEATHERLESS_DEFAULT_MODEL = "Qwen/Qwen2.5-72B-Instruct"
FEATHERLESS_FAST_MODEL    = "Qwen/Qwen2.5-7B-Instruct"

# ── Per-request user API key (set via X-Featherless-Key header) ─
# Each async request has its own context — fully isolated, thread-safe.
_request_user_key: ContextVar[str] = ContextVar("request_user_key", default="")


def set_request_key(key: str) -> None:
    """Called by FastAPI middleware once per incoming request."""
    _request_user_key.set(key.strip())


def _active_provider() -> str:
    """
    Returns which provider is active for the current request.
    Values: 'user_featherless' | 'gemini' | 'featherless' | 'none'
    """
    if _request_user_key.get():
        return "user_featherless"
    if os.getenv("GOOGLE_API_KEY", "").strip():
        return "gemini"
    if os.getenv("FEATHERLESS_API_KEY", "").strip():
        return "featherless"
    return "none"


def get_client() -> AsyncOpenAI:
    """
    Returns the appropriate AsyncOpenAI-compatible client for this request.

    All three providers use the OpenAI SDK — only base_url + api_key differ.
    Gemini's OpenAI-compatible endpoint means zero prompt changes needed.
    """
    provider = _active_provider()

    if provider == "user_featherless":
        logger.info("🪶 Using Featherless AI (user key)")
        return AsyncOpenAI(
            api_key=_request_user_key.get(),
            base_url=FEATHERLESS_BASE_URL,
        )

    elif provider == "gemini":
        logger.info("✨ Using Google Gemini 2.5 Flash")
        return AsyncOpenAI(
            api_key=os.getenv("GOOGLE_API_KEY"),
            base_url=GOOGLE_BASE_URL,
        )

    elif provider == "featherless":
        logger.info("🪶 Using Featherless AI (server fallback)")
        return AsyncOpenAI(
            api_key=os.getenv("FEATHERLESS_API_KEY"),
            base_url=FEATHERLESS_BASE_URL,
        )

    else:
        raise EnvironmentError(
            "No AI provider configured.\n"
            "  → Set GOOGLE_API_KEY in .env (recommended — Gemini 2.5 Flash)\n"
            "  → Or FEATHERLESS_API_KEY for Featherless AI\n"
            "  → Or pass X-Featherless-Key header per-request"
        )


def get_model(fast: bool = False) -> str:
    """
    Returns the correct model string for the currently active provider.

    Args:
        fast: If True, returns the faster/cheaper variant used for
              latency-sensitive tasks (fallacy detection, coach hints).
              Main debates always use the full model.
    """
    provider = _active_provider()

    if provider in ("user_featherless", "featherless"):
        if fast:
            return os.getenv("FEATHERLESS_FAST_MODEL", FEATHERLESS_FAST_MODEL)
        return os.getenv("FEATHERLESS_MODEL", FEATHERLESS_DEFAULT_MODEL)

    # gemini is default (includes 'none' — will fail at get_client anyway)
    if fast:
        return os.getenv("GEMINI_FAST_MODEL", GEMINI_FAST_MODEL)
    return os.getenv("GEMINI_MODEL", GEMINI_MODEL)


def get_provider_name() -> str:
    """Human-readable label for the active provider — used in /health."""
    return {
        "user_featherless": "Featherless AI (user key)",
        "gemini":           "Google Gemini 2.5 Flash",
        "featherless":      "Featherless AI",
        "none":             "Not configured",
    }[_active_provider()]
