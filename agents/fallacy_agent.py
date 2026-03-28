"""
P·A·R·I·T·Y — Fallacy Agent
Detects logical fallacies in debate arguments in real time.
Designed to run quickly without blocking the debate flow.
"""

import os
import json
from agents.client import get_client, get_model

# Common logical fallacies to detect
KNOWN_FALLACIES = [
    "Ad Hominem",
    "Straw Man",
    "False Dichotomy",
    "Slippery Slope",
    "Appeal to Authority",
    "Appeal to Emotion",
    "Circular Reasoning",
    "Hasty Generalization",
    "Red Herring",
    "Bandwagon Fallacy",
    "Post Hoc Ergo Propter Hoc",
    "False Equivalence",
    "Whataboutism",
    "Anecdotal Evidence",
    "Burden of Proof Shift",
]

FALLACY_SYSTEM_PROMPT = f"""\
You are a logic expert who detects informal logical fallacies in debate arguments.

Known fallacy types to check for:
{', '.join(KNOWN_FALLACIES)}

IMPORTANT RULES:
1. Only flag CLEAR fallacies — don't flag things that merely seem imprecise
2. Be conservative: false positives are worse than false negatives
3. If an argument is fallacious AND makes a good point, still flag the fallacy
4. Maximum 2 fallacies per argument text

Respond with ONLY valid JSON:
{{
  "fallacies": [
    {{
      "type": "Fallacy Name",
      "description": "1-2 sentence explanation of how this fallacy manifests in the text",
      "severity": "minor" | "major",
      "quote": "the exact phrase or clause that contains the fallacy (max 10 words)"
    }}
  ]
}}

If no fallacies are detected, return: {{"fallacies": []}}
"""


async def detect_fallacies(text: str, context: str | None = None) -> dict:
    """
    Detect logical fallacies in a debate argument.

    Args:
        text: The argument text to analyze
        context: Optional context about the debate topic

    Returns:
        dict with 'fallacies' list
    """
    if len(text.strip()) < 20:
        return {"fallacies": []}

    user_prompt = f"Analyze this debate argument for logical fallacies:\n\n\"{text}\""
    if context:
        user_prompt += f"\n\nDebate context: {context}"

    try:
        response = await get_client().chat.completions.create(
            model=get_model(fast=True),  # use fast model for real-time fallacy detection
            messages=[
                {"role": "system", "content": FALLACY_SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=300,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        data = json.loads(content)

        # Normalize fallacies
        fallacies = []
        for f in data.get("fallacies", [])[:2]:  # max 2 per message
            severity = f.get("severity", "minor")
            if severity not in ("minor", "major"):
                severity = "minor"

            fallacies.append({
                "type":        f.get("type", "Logical Error"),
                "description": f.get("description", ""),
                "severity":    severity,
                "quote":       f.get("quote", ""),
            })

        return {"fallacies": fallacies}

    except (json.JSONDecodeError, KeyError):
        return {"fallacies": []}
    except Exception:
        # Silent failure — don't disrupt the debate
        return {"fallacies": []}
