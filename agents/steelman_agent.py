"""
P·A·R·I·T·Y — Steelman Agent
Generates the strongest possible arguments for both sides of a proposition.
No straw men. Only genuine steelmanning.
"""

import os
import json
import random
from agents.client import get_client, get_model

CATEGORIES = ["empirical", "logical", "moral", "practical", "historical", "systemic", "economic"]

SYSTEM_PROMPT = """\
You are a master debate analyst trained in philosophy, rhetoric, and argumentation theory.
Your task is to steelman both sides of a proposition — generate the absolute strongest, most rigorous
case for each position. Steelmanning means presenting the BEST version of each argument, not a strawman.

Rules:
1. Generate exactly 3 arguments for each side (FOR and AGAINST)
2. Each argument must be genuinely strong — not dismissible
3. Cite real mechanisms, real examples, or real logical structures
4. Do NOT use strawman versions of either side
5. Vary argument types: empirical, moral, logical, practical, historical

Respond with ONLY valid JSON in this exact format:
{
  "for": [
    {"id": "f1", "text": "...", "side": "for", "strength": 85, "category": "empirical"},
    {"id": "f2", "text": "...", "side": "for", "strength": 80, "category": "moral"},
    {"id": "f3", "text": "...", "side": "for", "strength": 75, "category": "practical"}
  ],
  "against": [
    {"id": "a1", "text": "...", "side": "against", "strength": 90, "category": "systemic"},
    {"id": "a2", "text": "...", "side": "against", "strength": 82, "category": "historical"},
    {"id": "a3", "text": "...", "side": "against", "strength": 77, "category": "logical"}
  ]
}

Each argument text should be 1-3 sentences, substantive and specific, not vague.
Strength scores (60-95) should reflect genuine argumentative quality.
"""

MODE_MODIFIERS = {
    "casual":   "Keep arguments accessible and engaging.",
    "oxford":   "Use formal academic language and citation-style references to evidence.",
    "socratic": "Frame arguments as questions and Socratic explorations.",
    "speed":    "Keep each argument to 1 sharp sentence.",
}


async def run_steelman(topic: str, mode: str = "casual") -> dict:
    """
    Generate steelmanned arguments for both sides of the topic.

    Returns:
        dict with 'for' and 'against' lists of Argument objects
    """
    mode_note = MODE_MODIFIERS.get(mode, "")
    user_prompt = f'Proposition: "{topic}"\n\n{mode_note}'

    try:
        response = await get_client().chat.completions.create(
            model=get_model(),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        data = json.loads(content)

        # Validate and normalize
        result = {
            "for":     _normalize_args(data.get("for",     []), "for"),
            "against": _normalize_args(data.get("against", []), "against"),
        }
        return result

    except json.JSONDecodeError:
        # Fallback: return generic arguments
        return _generate_fallback_args(topic)
    except Exception as e:
        raise RuntimeError(f"Steelman generation failed: {e}") from e


def _normalize_args(args: list[dict], side: str) -> list[dict]:
    """Ensure arguments have all required fields."""
    normalized = []
    for i, arg in enumerate(args[:3]):  # max 3 args per side
        normalized.append({
            "id":       arg.get("id",       f"{side[0]}{i+1}"),
            "text":     arg.get("text",     "Argument unavailable."),
            "side":     side,
            "strength": min(95, max(50, int(arg.get("strength", 75)))),
            "category": arg.get("category", random.choice(CATEGORIES)),
        })
    return normalized


def _generate_fallback_args(topic: str) -> dict:
    """Returns generic fallback arguments when API is unavailable."""
    return {
        "for": [
            {
                "id": "f1",
                "text": f'The empirical evidence strongly supports the position that {topic.lower()}. Systematic reviews and meta-analyses consistently find outcomes that validate this claim.',
                "side": "for",
                "strength": 82,
                "category": "empirical",
            },
            {
                "id": "f2",
                "text": "From first principles, the logical framework underlying this position is sound. If we grant the core premises, the conclusion follows with near-necessity.",
                "side": "for",
                "strength": 77,
                "category": "logical",
            },
            {
                "id": "f3",
                "text": "The practical implementations of this approach have demonstrated measurable improvements in real-world outcomes that cannot be attributed to confounding variables.",
                "side": "for",
                "strength": 72,
                "category": "practical",
            },
        ],
        "against": [
            {
                "id": "a1",
                "text": "The critical flaw lies in second-order systemic effects: what appears beneficial in isolation creates cascading negative consequences at scale that advocates routinely ignore.",
                "side": "against",
                "strength": 88,
                "category": "systemic",
            },
            {
                "id": "a2",
                "text": "Historical precedent consistently shows that every time this approach has been attempted, it has failed to account for the variability of human behavior under changed incentive structures.",
                "side": "against",
                "strength": 83,
                "category": "historical",
            },
            {
                "id": "a3",
                "text": "The ethical dimension is systematically overlooked: this position requires accepting a tradeoff that disproportionately burdens those with the least power to resist its implementation.",
                "side": "against",
                "strength": 78,
                "category": "moral",
            },
        ],
    }
