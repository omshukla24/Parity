"""
P·A·R·I·T·Y — Debate Agent
Streams the AI's response to the user's argument.
Adapts based on history, persona, and debate mode.
Never recycled arguments — always novel counters.
"""

import os
from typing import AsyncGenerator
from agents.client import get_client, get_model
from agents.persona_agent import PersonaConfig

MODE_INSTRUCTIONS = {
    "casual": (
        "This is a casual debate. Be engaging, direct, and conversational. "
        "No need for formal structure — just argue well."
    ),
    "oxford": (
        "This is an Oxford-style formal debate. Use structured arguments. "
        "Acknowledge the previous point before rebutting. Cite sources or experts where appropriate. "
        "Maintain formal register throughout."
    ),
    "socratic": (
        "This is a Socratic debate. You may ONLY ask questions — never make direct assertions. "
        "Force the user to confront the contradictions in their own position through questions alone. "
        "Every response must be a series of probing questions."
    ),
    "speed": (
        "This is Speed Round mode. Keep your entire response under 3 sentences. "
        "Hit hard, hit fast, hit precisely. No filler."
    ),
}

DEBATE_SYSTEM_TEMPLATE = """\
You are engaged in a structured debate. Here are your constraints:

TOPIC: {topic}
YOUR POSITION: You are arguing {ai_side} the proposition.
USER'S POSITION: The user is arguing {user_side} the proposition.

PERSONA:
{persona_system_prompt}

MODE INSTRUCTIONS:
{mode_instructions}

CRITICAL RULES:
1. Never repeat an argument you (or the user) have already made in this debate
2. Always directly engage with the specific argument the user JUST made — don't ignore it
3. Find new angles, new evidence, new logical structures in each round
4. Your goal is to WIN the debate through logic and evidence, not to be agreeable
5. Be concise but devastating — quality over quantity
6. Match the intensity and register of the debate mode
7. Do NOT add filler phrases like "Great point!" or "I see what you mean" — be direct

This is round {round_num} of the debate.
"""


async def stream_debate_response(
    topic: str,
    user_side: str,
    user_argument: str,
    history: list[dict],
    persona_config: PersonaConfig,
    mode: str,
    round_num: int,
) -> AsyncGenerator[str, None]:
    """
    Stream the AI's debate response token by token.

    The AI argues the OPPOSITE side from the user.
    """
    # AI argues opposite side
    ai_side = _opposite_side(user_side)

    system_prompt = DEBATE_SYSTEM_TEMPLATE.format(
        topic=topic,
        ai_side=ai_side,
        user_side=user_side,
        persona_system_prompt=persona_config["system_prompt"],
        mode_instructions=MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS["casual"]),
        round_num=round_num,
    )

    # Build conversation history for context
    messages = [{"role": "system", "content": system_prompt}]

    # Add history (alternate user/assistant turns)
    for msg in history:
        if msg.get("role") == "user":
            messages.append({"role": "user", "content": msg["text"]})
        elif msg.get("role") == "ai":
            messages.append({"role": "assistant", "content": msg["text"]})

    # Add current user argument
    messages.append({"role": "user", "content": user_argument})

    try:
        stream = await get_client().chat.completions.create(
            model=get_model(),
            messages=messages,
            temperature=0.85,
            max_tokens=400,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    except Exception as e:
        yield f"\n\n[Error generating response: {e}]"


def _opposite_side(user_side: str) -> str:
    """Get the AI's side based on the user's side."""
    mapping = {
        "for":    "AGAINST",
        "against":"FOR",
        "devil":  "FOR",  # if user is devil's advocate (arguing against own side), AI argues for it
    }
    return mapping.get(user_side, "AGAINST")
