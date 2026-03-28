"""
P·A·R·I·T·Y — AI Agents Package
Parallel Algorithms for Resolution of Ideological and Tactical Yields

Agent modules:
  client          — Shared AI client (Featherless AI / OpenAI — LovHack S2 Sponsor)
  persona_agent   — AI opponent persona configs & styles
  steelman_agent  — Generate strongest arguments for both sides
  debate_agent    — Stream live AI debate responses
  judge_agent     — Evaluate debate & deliver scored verdict
  fallacy_agent   — Detect logical fallacies in real time
  coach_agent     — Strategic coaching hints for the user
"""

from agents.client         import get_client, get_model
from agents.persona_agent  import get_persona_config, PERSONA_CONFIGS
from agents.steelman_agent import run_steelman
from agents.debate_agent   import stream_debate_response
from agents.judge_agent    import run_judge
from agents.fallacy_agent  import detect_fallacies
from agents.coach_agent    import get_coach_hint

__all__ = [
    # Shared AI client (Featherless AI — LovHack S2 Sponsor)
    "get_client",
    "get_model",
    # Agent functions
    "get_persona_config",
    "PERSONA_CONFIGS",
    "run_steelman",
    "stream_debate_response",
    "run_judge",
    "detect_fallacies",
    "get_coach_hint",
]
