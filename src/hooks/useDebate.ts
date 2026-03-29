// ═══════════════════════════════════════════════════════════════
// P·A·R·I·T·Y  —  Debate API Hook
// All communication with the FastAPI backend lives here.
// Falls back to demo mode if backend is unreachable.
// ═══════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import { useDebateStore } from '../store/debateStore'
import type {
  SteelmanRequest, DebateRequest, JudgeRequest,
  FallacyRequest, CoachRequest, Argument, DebateMessage,
  FallacyDetection, Score, CoachResponse,
} from '../types'

const API_BASE = '/api'

// ─── Utility: build headers with optional user API key ─────────
function buildHeaders(userApiKey?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const key = userApiKey ?? useDebateStore.getState().apiKey
  if (key) headers['X-Featherless-Key'] = key
  return headers
}

// ─── Utility: SSE streaming consumer ──────────────────────────
async function consumeSSE(
  url: string,
  body: unknown,
  onChunk: (text: string) => void,
  onDone: (full: string) => void,
  onError: () => void,
) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    })

    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            onDone(full)
            return
          }
          try {
            const parsed = JSON.parse(data)
            const chunk = parsed.text ?? parsed.content ?? ''
            if (chunk) {
              full += chunk
              onChunk(full)
            }
          } catch {
            // raw text chunk
            if (data) {
              full += data
              onChunk(full)
            }
          }
        }
      }
    }

    onDone(full)
  } catch (err) {
    console.warn('[PARITY] API unavailable, using demo mode:', err)
    onError()
  }
}

// ─── Utility: JSON fetch ───────────────────────────────────────
async function apiFetch<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return null
  }
}

// ─── Demo fallbacks (when backend is offline) ──────────────────
const DEMO_FOR_ARGS: Argument[] = [
  {
    id: 'f1',
    text: 'The empirical evidence overwhelmingly supports this position — meta-analyses across 40+ peer-reviewed studies show consistent positive outcomes.',
    side: 'for',
    strength: 88,
    category: 'empirical',
  },
  {
    id: 'f2',
    text: 'From a first-principles standpoint, the logical framework underlying this claim is sound: if we grant the premises, the conclusion follows necessarily.',
    side: 'for',
    strength: 82,
    category: 'logical',
  },
  {
    id: 'f3',
    text: 'The practical, real-world implementations of this idea have demonstrated measurable improvements in outcomes that cannot be attributed to confounding variables.',
    side: 'for',
    strength: 75,
    category: 'practical',
  },
]

const DEMO_AGAINST_ARGS: Argument[] = [
  {
    id: 'a1',
    text: 'The strongest counterargument lies in systemic second-order effects: what appears beneficial in isolation creates cascading negative consequences at scale.',
    side: 'against',
    strength: 91,
    category: 'systemic',
  },
  {
    id: 'a2',
    text: 'Historical precedent consistently shows that every time this approach has been attempted, it has failed to account for the variability of human behavior under changed incentive structures.',
    side: 'against',
    strength: 85,
    category: 'historical',
  },
  {
    id: 'a3',
    text: 'The ethical dimension is often overlooked: this position requires accepting a tradeoff that disproportionately burdens those with the least power to resist it.',
    side: 'against',
    strength: 78,
    category: 'ethical',
  },
]

const DEMO_AI_RESPONSES = [
  "Your argument, while emotionally resonant, commits the classic error of conflating correlation with causation. The data you're implying exists does not establish the causal mechanism you require. Furthermore, the very examples you'd cite are outliers, not representative cases — cherry-picking at its finest.",
  "I'd counter with a more fundamental point: the premise of your argument assumes a static system. But we're operating in a dynamic environment where the very act of implementing your suggestion changes the conditions that make it viable. You're arguing for a solution to a problem that your solution would itself create.",
  "Interesting framing, but let me steelman it from a different angle and then dismantle it. Even granting your best case — the version most favorable to your position — the conclusion still doesn't follow. The logical gap between your evidence and your claim requires a bridge you haven't built.",
]

function getDemoResponse(round: number): string {
  return DEMO_AI_RESPONSES[round % DEMO_AI_RESPONSES.length]
}

// ─── MAIN HOOK ─────────────────────────────────────────────────
export function useDebate() {
  const store = useDebateStore()

  // ── Steelman Both Sides ────────────────────────────────────────
  const runSteelman = useCallback(async () => {
    const { topic, mode, setLoading, setScreen, setSteelman } = useDebateStore.getState()
    if (!topic.trim()) return

    setLoading(true)

    const req: SteelmanRequest = { topic, mode }
    const result = await apiFetch<{ for: Argument[]; against: Argument[] }>('/steelman', req)

    if (result) {
      setSteelman(result.for, result.against)
    } else {
      // Demo mode
      const demoFor = DEMO_FOR_ARGS.map(a => ({
        ...a,
        text: a.text.replace('this position', `"${topic}"`),
      }))
      const demoAgainst = DEMO_AGAINST_ARGS.map(a => ({
        ...a,
        text: a.text.replace('this position', `"${topic}"`),
      }))
      setSteelman(demoFor, demoAgainst)
    }

    setLoading(false)
    setScreen('steelman')
  }, [])

  // ── Debate Turn ────────────────────────────────────────────────
  const sendDebateMessage = useCallback(async (userText: string) => {
    const state = useDebateStore.getState()
    const {
      topic, userSide, messages, persona, mode, round, maxRounds,
      fallacyDetectorOn, coachMode,
      addMessage, updateLastAiMessage, finalizeAiMessage,
      incrementRound, setLoading, setStreaming, setCoachHint, setScreen,
    } = state

    if (!userText.trim() || round >= maxRounds) return

    const userMsg: DebateMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: userText,
      round: round + 1,
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    incrementRound()

    // Detect fallacies in user message (non-blocking)
    let userFallacies: FallacyDetection[] = []
    if (fallacyDetectorOn) {
      const fallacyReq: FallacyRequest = { text: userText }
      const fallacyRes = await apiFetch<{ fallacies: FallacyDetection[] }>('/fallacy', fallacyReq)
      userFallacies = fallacyRes?.fallacies ?? []
      if (userFallacies.length > 0) {
        // Update user message with detected fallacies
        const msgs = useDebateStore.getState().messages
        const lastIdx = msgs.findIndex(m => m.id === userMsg.id)
        if (lastIdx >= 0) {
          const updated = [...msgs]
          updated[lastIdx] = { ...updated[lastIdx], fallacies: userFallacies }
          useDebateStore.setState({ messages: updated })
        }
      }
    }

    // Add AI placeholder message
    const aiMsg: DebateMessage = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      text: '',
      round: round + 1,
      timestamp: Date.now(),
      isStreaming: true,
    }
    addMessage(aiMsg)
    setStreaming(true)
    setLoading(false)

    const req: DebateRequest = {
      topic,
      userSide,
      userArgument: userText,
      history: messages,
      persona,
      mode,
      round: round + 1,
    }

    await consumeSSE(
      '/debate/stream',
      req,
      (partial) => {
        updateLastAiMessage(partial)
      },
      async (full) => {
        // Detect fallacies in AI response
        let aiFallacies: FallacyDetection[] = []
        if (fallacyDetectorOn) {
          const fallacyRes = await apiFetch<{ fallacies: FallacyDetection[] }>('/fallacy', {
            text: full,
          })
          aiFallacies = fallacyRes?.fallacies ?? []
        }

        finalizeAiMessage(full, aiFallacies)

        // Get coach hint if enabled
        if (coachMode) {
          const coachReq: CoachRequest = {
            topic,
            userSide,
            history: useDebateStore.getState().messages,
            persona,
            round: round + 1,
          }
          const coachRes = await apiFetch<{ hints: CoachResponse[] }>('/coach', coachReq)
          setCoachHint(coachRes?.hints ?? null)
        }

        // If debate is over, don't auto-judge — let the user read the
        // AI's final response and press "REQUEST VERDICT" when ready.

      },
      () => {
        // Demo mode
        const demoText = getDemoResponse(round)
        setTimeout(() => {
          finalizeAiMessage(demoText)
        }, 1200)
      },
    )
  }, [])

  // ── Judge / Verdict ────────────────────────────────────────────
  const runJudge = useCallback(async () => {
    const { topic, userSide, messages, persona, setScore, setScreen, setLoading } =
      useDebateStore.getState()

    setLoading(true)

    const req: JudgeRequest = { topic, userSide, history: messages, persona }
    const result = await apiFetch<Score>('/judge', req)

    if (result) {
      setScore(result)
    } else {
      // Demo score
      const demoScore: Score = {
        logic: { label: 'Logic & Reasoning', userScore: 72, aiScore: 84, commentary: 'Both sides presented coherent arguments, but the AI\'s logical structure was more rigorous.' },
        evidence: { label: 'Use of Evidence', userScore: 65, aiScore: 78, commentary: 'The AI cited more verifiable claims. Your arguments relied more on intuition.' },
        clarity: { label: 'Clarity & Persuasion', userScore: 80, aiScore: 75, commentary: 'Your communication was clear and engaging — a genuine strength.' },
        overall: { label: 'Overall Score', userScore: 72, aiScore: 79, commentary: 'A competitive debate with clear moments of brilliance from both sides.' },
        winner: 'ai',
        verdict: 'After careful deliberation across all dimensions of argumentation, the AI edges out the victory on logical structure and evidence quality — but the human showed exceptional clarity and made several memorable points.',
        bestArgument: 'Every industrial revolution promised replacement jobs. None delivered in time.',
        highlight: 'The debate revealed that both positions have merit, but one side marshalled its arguments more effectively.',
      }
      setScore(demoScore)
    }

    setLoading(false)
    setScreen('verdict')
  }, [])

  // ── Coach Hint ─────────────────────────────────────────────────
  const fetchCoachHint = useCallback(async () => {
    const { topic, userSide, messages, persona, round, setCoachHint, setLoading } =
      useDebateStore.getState()

    setLoading(true)
    const req: CoachRequest = { topic, userSide, history: messages, persona, round }
    const result = await apiFetch<{ hints: CoachResponse[] }>('/coach', req)

    setCoachHint(
      result?.hints ?? [
        {
          hint: "Try attacking the underlying assumption, not the conclusion. Ask: what does your opponent need to be true for their argument to work? Then prove that's false.",
          strategy: "Reframe the discussion around first principles."
        }
      ]
    )
    setLoading(false)
  }, [])

  // ── n8n Export (LovHack S2 Sponsor) ───────────────────────────
  const exportToN8n = useCallback(async () => {
    const { topic, userSide, persona, score, messages, n8nUrl } = useDebateStore.getState()
    if (!score) return null

    const payload = {
      topic,
      userSide,
      persona,
      winner: score.winner,
      scores: {
        logic: { userScore: score.logic.userScore, aiScore: score.logic.aiScore, commentary: score.logic.commentary },
        evidence: { userScore: score.evidence.userScore, aiScore: score.evidence.aiScore, commentary: score.evidence.commentary },
        clarity: { userScore: score.clarity.userScore, aiScore: score.clarity.aiScore, commentary: score.clarity.commentary },
        overall: { userScore: score.overall.userScore, aiScore: score.overall.aiScore, commentary: score.overall.commentary },
      },
      verdict: score.verdict,
      bestArgument: score.bestArgument ?? '',
      messageCount: messages.length,
      highlights: [],
      n8nWebhook: n8nUrl || undefined,
    }

    const result = await apiFetch<{
      success: boolean
      message: string
      demo?: boolean
      instructions?: string
    }>('/export/n8n', payload)

    // Demo mode fallback when backend offline
    if (!result) {
      return {
        success: false,
        message: 'Backend offline. Start uvicorn to enable n8n.',
        demo: true,
      }
    }
    return result
  }, [])

  // ── Miro Export (LovHack S2 Sponsor) ──────────────────────────
  const exportToMiro = useCallback(async () => {
    const { topic, userSide, persona, score, steelmanFor, steelmanAgainst, miroToken } =
      useDebateStore.getState()
    if (!score) return null

    const payload = {
      topic,
      userSide,
      persona,
      winner: score.winner,
      verdict: score.verdict,
      bestArgument: score.bestArgument ?? '',
      forArguments: steelmanFor?.map(a => a.text) ?? [],
      againstArguments: steelmanAgainst?.map(a => a.text) ?? [],
      scores: {
        logic: { userScore: score.logic.userScore, aiScore: score.logic.aiScore },
        evidence: { userScore: score.evidence.userScore, aiScore: score.evidence.aiScore },
        clarity: { userScore: score.clarity.userScore, aiScore: score.clarity.aiScore },
        overall: { userScore: score.overall.userScore, aiScore: score.overall.aiScore },
      },
      miroToken: miroToken || undefined,
    }

    const result = await apiFetch<{
      success: boolean
      boardUrl?: string
      boardId?: string
      message?: string
      demo?: boolean
      instructions?: string
      previewUrl?: string
    }>('/export/miro', payload)

    // Demo mode fallback when backend offline
    if (!result) {
      return {
        success: false,
        message: 'Backend offline. Start uvicorn to enable Miro export.',
        demo: true,
      }
    }
    return result
  }, [])

  return {
    runSteelman,
    sendDebateMessage,
    runJudge,
    fetchCoachHint,
    exportToN8n,
    exportToMiro,
  }
}
