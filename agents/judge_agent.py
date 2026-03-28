"""
P·A·R·I·T·Y — Judge Agent
Evaluates the full debate and delivers a verdict.
Scores both sides across logic, evidence, clarity, and overall.
"""

import os
import json
from agents.client import get_client, get_model

JUDGE_SYSTEM_PROMPT = """\
You are an impartial AI debate judge with expertise in logic, rhetoric, and argumentation theory.
Your task is to evaluate a completed debate and deliver a fair, rigorous verdict.

You must score both the human user and the AI opponent across 4 dimensions (0-100 scale):

1. LOGIC & REASONING — Soundness of logical structure, avoidance of fallacies, validity of inferences
2. USE OF EVIDENCE — Quality, relevance, and specificity of evidence cited
3. CLARITY & PERSUASION — How clearly and persuasively arguments were communicated
4. OVERALL — Holistic assessment of debate performance

Scoring guidelines:
- 85-100: Exceptional — professional-level argumentation
- 70-84:  Strong — solid reasoning with minor weaknesses
- 55-69:  Adequate — makes reasonable points but has gaps
- 40-54:  Weak — struggles to support claims effectively
- Below 40: Poor — fails to engage with the topic substantively

Be FAIR — don't automatically favor either the human or the AI.
The winner is whoever genuinely argued better.

Respond with ONLY valid JSON:
{
  "logic":    {"label": "Logic & Reasoning", "userScore": 72, "aiScore": 84, "commentary": "..."},
  "evidence": {"label": "Use of Evidence",   "userScore": 65, "aiScore": 78, "commentary": "..."},
  "clarity":  {"label": "Clarity & Persuasion","userScore": 80, "aiScore": 75, "commentary": "..."},
  "overall":  {"label": "Overall Score",     "userScore": 72, "aiScore": 79, "commentary": "..."},
  "winner": "user" | "ai" | "draw",
  "verdict": "2-3 sentence judge's statement explaining the outcome",
  "bestArgument": "The single most memorable/effective argument from the winning side (verbatim or paraphrased)",
  "highlight": "A memorable quote or observation about the debate"
}
"""


async def run_judge(
    topic: str,
    user_side: str,
    history: list[dict],
    persona: str,
) -> dict:
    """
    Evaluate the debate and return a full score breakdown.
    """
    # Format debate transcript
    transcript = _format_transcript(history)

    user_prompt = f"""\
DEBATE TOPIC: "{topic}"
HUMAN ARGUED: {user_side.upper()} the proposition
AI PERSONA: {persona}

DEBATE TRANSCRIPT:
{transcript}

Please evaluate this debate and provide your verdict.
"""

    try:
        response = await get_client().chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": JUDGE_SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=800,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        data = json.loads(content)
        return _normalize_score(data)

    except json.JSONDecodeError:
        return _generate_fallback_score()
    except Exception as e:
        raise RuntimeError(f"Judge evaluation failed: {e}") from e


def _format_transcript(history: list[dict]) -> str:
    """Format debate history as a readable transcript."""
    lines = []
    for msg in history:
        role = "HUMAN" if msg.get("role") == "user" else "AI"
        text = msg.get("text", "").strip()
        lines.append(f"[{role} · Round {msg.get('round', '?')}]\n{text}\n")
    return "\n".join(lines)


def _normalize_score(data: dict) -> dict:
    """Ensure score has all required fields with valid values."""
    def normalize_category(cat: dict, default_label: str) -> dict:
        return {
            "label": cat.get("label", default_label),
            "userScore": min(100, max(0, int(cat.get("userScore", 65)))),
            "aiScore":   min(100, max(0, int(cat.get("aiScore",   70)))),
            "commentary": cat.get("commentary", ""),
        }

    winner = data.get("winner", "draw")
    if winner not in ("user", "ai", "draw"):
        winner = "draw"

    return {
        "logic":    normalize_category(data.get("logic",    {}), "Logic & Reasoning"),
        "evidence": normalize_category(data.get("evidence", {}), "Use of Evidence"),
        "clarity":  normalize_category(data.get("clarity",  {}), "Clarity & Persuasion"),
        "overall":  normalize_category(data.get("overall",  {}), "Overall Score"),
        "winner": winner,
        "verdict": data.get("verdict", "After careful deliberation, the debate was closely contested."),
        "bestArgument": data.get("bestArgument", ""),
        "highlight": data.get("highlight", ""),
    }


def _generate_fallback_score() -> dict:
    """Fallback score when API is unavailable."""
    return {
        "logic":    {"label": "Logic & Reasoning",   "userScore": 70, "aiScore": 78, "commentary": "Both sides demonstrated reasonable logical structure."},
        "evidence": {"label": "Use of Evidence",      "userScore": 65, "aiScore": 75, "commentary": "The AI cited more verifiable claims throughout the debate."},
        "clarity":  {"label": "Clarity & Persuasion", "userScore": 78, "aiScore": 72, "commentary": "The human's arguments were notably clear and engaging."},
        "overall":  {"label": "Overall Score",        "userScore": 71, "aiScore": 75, "commentary": "A competitive debate with moments of brilliance from both sides."},
        "winner": "ai",
        "verdict": "After evaluating logic, evidence, and clarity, the AI edges out the victory on argumentative rigor — but the human showed genuine debating ability.",
        "bestArgument": "Every historical precedent was marshalled with precision to build an irrefutable case.",
        "highlight": "A debate that showed the genuine complexity of this question.",
    }
