"""
P·A·R·I·T·Y — Coach Agent
Generates strategic coaching hints for the user's next argument.
Whispered hints that are blurred by default in the UI (hover to reveal).
"""

import os
import json
from agents.client import get_client, get_model

COACH_SYSTEM_PROMPT = """\
You are a master debate coach watching a live debate. Your job is to give the human debater
a strategic whispered coaching tip for their NEXT argument.

Your tip should:
1. Be specific to what just happened in the debate (don't give generic advice)
2. Identify the AI opponent's key vulnerability or logical gap
3. Suggest a concrete angle of attack the human hasn't tried yet
4. Be practical and immediately actionable

Do NOT:
- Give generic tips like "be more specific" or "cite evidence"
- Repeat strategies the human has already tried
- Be encouraging/cheerleader-ish — be strategic

Respond with ONLY valid JSON:
{
  "hint": "1-2 sentence coaching tip about what angle to take next",
  "strategy": "1 sentence on the underlying strategic reason"
}
"""

FALLBACK_HINTS = [
    {
        "hint": "Attack the underlying assumption, not the surface claim. Ask: what does your opponent need to be TRUE for their argument to hold? Prove that's false.",
        "strategy": "Undermining premises is more devastating than contesting conclusions.",
    },
    {
        "hint": "Your opponent hasn't addressed the long-term consequences. Pivot to time horizon — their position may hold short-term but fails over decades.",
        "strategy": "Extending the time frame often reverses the calculus of an argument.",
    },
    {
        "hint": "Name the specific group most harmed by your opponent's position and make the judge feel their absence in this debate.",
        "strategy": "Concrete human impact is harder to dismiss than abstract principles.",
    },
    {
        "hint": "Your opponent has been making systemic claims but only citing individual examples. Challenge the generalizability of their evidence.",
        "strategy": "Anecdotal evidence cannot support universal claims — expose that gap.",
    },
    {
        "hint": "Flip the burden of proof. Your opponent is defending the status quo implicitly — make them justify WHY the default position should be maintained.",
        "strategy": "Forcing your opponent to affirmatively defend their position is often more powerful than attacking it.",
    },
]

_hint_index = 0


async def get_coach_hint(
    topic: str,
    user_side: str,
    history: list[dict],
    persona: str,
    round_num: int,
) -> dict:
    """
    Generate a strategic coaching hint based on the current debate state.
    """
    if not history:
        return FALLBACK_HINTS[0]

    # Build context from recent debate
    recent = history[-4:]  # last 2 rounds
    transcript = "\n".join([
        f"{'HUMAN' if m.get('role') == 'user' else 'AI'}: {m.get('text', '')}"
        for m in recent
    ])

    user_prompt = f"""\
DEBATE TOPIC: "{topic}"
HUMAN IS ARGUING: {user_side.upper()}
AI PERSONA: {persona}
CURRENT ROUND: {round_num}

RECENT EXCHANGE:
{transcript}

Give the human a coaching tip for their NEXT argument.
"""

    try:
        response = await get_client().chat.completions.create(
            model=get_model(fast=True),  # use fast model for coaching hints
            messages=[
                {"role": "system", "content": COACH_SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=200,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        data = json.loads(content)

        return {
            "hint":     data.get("hint",     FALLBACK_HINTS[0]["hint"]),
            "strategy": data.get("strategy", FALLBACK_HINTS[0]["strategy"]),
        }

    except (json.JSONDecodeError, KeyError):
        global _hint_index
        hint = FALLBACK_HINTS[_hint_index % len(FALLBACK_HINTS)]
        _hint_index += 1
        return hint
    except Exception:
        return FALLBACK_HINTS[round_num % len(FALLBACK_HINTS)]
