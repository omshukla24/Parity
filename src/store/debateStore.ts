// ═══════════════════════════════════════════════════════════════
// P·A·R·I·T·Y  —  Zustand State Store
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand'
import type {
  Screen, Side, DebateMode, PersonaType,
  DebateState, Argument, DebateMessage, Score,
  FallacyDetection, LeaderboardEntry,
} from '../types'

// ─── localStorage helpers ───────────────────────────────────────
const LS_KEY = 'parity_featherless_key'
function loadStoredKey(): string {
  try { return localStorage.getItem(LS_KEY) ?? '' } catch { return '' }
}
function saveKeyToStorage(key: string) {
  try {
    if (key) localStorage.setItem(LS_KEY, key)
    else localStorage.removeItem(LS_KEY)
  } catch { /* ignore */ }
}

// ─── Mock Leaderboard Data ─────────────────────────────────────
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    topic: 'Social media does more harm than good',
    winner: 'om_s',
    side: 'against',
    score: 91,
    votes: 847,
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    highlight: 'The dopamine feedback loop is by design, not accident.',
  },
  {
    rank: 2,
    topic: 'AI will eliminate more jobs than it creates',
    winner: 'AI',
    side: 'for',
    score: 88,
    votes: 612,
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    highlight: 'Every industrial revolution promised replacement jobs. None delivered in time.',
  },
  {
    rank: 3,
    topic: 'Remote work is better than office work',
    winner: 'debater_k',
    side: 'for',
    score: 85,
    votes: 534,
    timestamp: Date.now() - 1000 * 60 * 60 * 8,
    highlight: 'Commute time is unpaid labor extracted from workers.',
  },
  {
    rank: 4,
    topic: 'Universal Basic Income is inevitable',
    winner: 'AI',
    side: 'against',
    score: 82,
    votes: 489,
    timestamp: Date.now() - 1000 * 60 * 60 * 12,
    highlight: 'Money without purpose breeds dependency, not freedom.',
  },
  {
    rank: 5,
    topic: 'Cryptocurrency is a net positive for society',
    winner: 'crypto_maximi',
    side: 'for',
    score: 79,
    votes: 401,
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    highlight: 'Distrust of institutions is not paranoia — it is history.',
  },
  {
    rank: 6,
    topic: 'Space exploration is a waste of resources',
    winner: 'AI',
    side: 'against',
    score: 77,
    votes: 367,
    timestamp: Date.now() - 1000 * 60 * 60 * 36,
    highlight: 'Every GPS signal, weather forecast, and satellite call disagrees.',
  },
  {
    rank: 7,
    topic: 'Privacy is more important than security',
    winner: 'privacyfirst',
    side: 'for',
    score: 75,
    votes: 312,
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    highlight: 'Those who trade liberty for safety deserve neither.',
  },
]

// ─── Default State ─────────────────────────────────────────────
const defaultState: DebateState = {
  screen: 'topic',
  topic: '',
  mode: 'casual',
  persona: 'socrates',
  userSide: 'for',
  steelmanFor: [],
  steelmanAgainst: [],
  apiKey: loadStoredKey(),
  messages: [],
  round: 0,
  maxRounds: 5,
  score: null,
  coachMode: false,
  coachHint: null,
  isLoading: false,
  isStreaming: false,
  streamingText: '',
  fallacyDetectorOn: true,
  leaderboard: MOCK_LEADERBOARD,
}

// ─── Store Interface ────────────────────────────────────────────
interface DebateStore extends DebateState {
  // Navigation
  setScreen: (screen: Screen) => void
  goBack: () => void

  // Setup
  setTopic: (topic: string) => void
  setMode: (mode: DebateMode) => void
  setPersona: (persona: PersonaType) => void
  setUserSide: (side: Side) => void

  // Steelman
  setSteelman: (forArgs: Argument[], againstArgs: Argument[]) => void

  // Debate
  addMessage: (message: DebateMessage) => void
  updateLastAiMessage: (text: string, fallacies?: FallacyDetection[]) => void
  finalizeAiMessage: (text: string, fallacies?: FallacyDetection[]) => void
  incrementRound: () => void

  // Verdict
  setScore: (score: Score) => void

  // Coach
  toggleCoachMode: () => void
  setCoachHint: (hint: string | null) => void

  // Streaming
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
  setStreamingText: (text: string) => void
  appendStreamingText: (chunk: string) => void
  clearStreamingText: () => void

  // Settings
  toggleFallacyDetector: () => void

  // API Key (user-provided Featherless key)
  setApiKey: (key: string) => void

  // Reset
  reset: () => void
  resetDebate: () => void
}

// ─── Screen History ────────────────────────────────────────────
const SCREEN_ORDER: Screen[] = ['topic', 'steelman', 'sideselect', 'debate', 'verdict']

// ─── Store Creation ─────────────────────────────────────────────
export const useDebateStore = create<DebateStore>((set, get) => ({
  ...defaultState,

  // ── Navigation ────────────────────────────────────────────────
  setScreen: (screen) => set({ screen }),

  goBack: () => {
    const { screen } = get()
    const idx = SCREEN_ORDER.indexOf(screen)
    if (idx > 0) {
      set({ screen: SCREEN_ORDER[idx - 1] })
    }
  },

  // ── Setup ─────────────────────────────────────────────────────
  setTopic: (topic) => set({ topic }),
  setMode: (mode) => {
    const modeMaxRounds: Record<DebateMode, number> = {
      casual: 5,
      oxford: 3,
      socratic: 4,
      speed: 5,
    }
    set({ mode, maxRounds: modeMaxRounds[mode] })
  },
  setPersona: (persona) => set({ persona }),
  setUserSide: (userSide) => set({ userSide }),

  // ── Steelman ──────────────────────────────────────────────────
  setSteelman: (forArgs, againstArgs) =>
    set({ steelmanFor: forArgs, steelmanAgainst: againstArgs }),

  // ── Debate ────────────────────────────────────────────────────
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastAiMessage: (text, fallacies) =>
    set((state) => {
      const msgs = [...state.messages]
      const lastIdx = msgs.length - 1
      if (lastIdx >= 0 && msgs[lastIdx].role === 'ai') {
        msgs[lastIdx] = {
          ...msgs[lastIdx],
          text,
          fallacies: fallacies ?? msgs[lastIdx].fallacies,
          isStreaming: true,
        }
      }
      return { messages: msgs }
    }),

  finalizeAiMessage: (text, fallacies) =>
    set((state) => {
      const msgs = [...state.messages]
      const lastIdx = msgs.length - 1
      if (lastIdx >= 0 && msgs[lastIdx].role === 'ai') {
        msgs[lastIdx] = {
          ...msgs[lastIdx],
          text,
          fallacies: fallacies ?? msgs[lastIdx].fallacies,
          isStreaming: false,
        }
      }
      return { messages: msgs, isStreaming: false, streamingText: '' }
    }),

  incrementRound: () =>
    set((state) => ({ round: state.round + 1 })),

  // ── Verdict ───────────────────────────────────────────────────
  setScore: (score) => set({ score }),

  // ── Coach ─────────────────────────────────────────────────────
  toggleCoachMode: () => set((state) => ({ coachMode: !state.coachMode })),
  setCoachHint: (hint) => set({ coachHint: hint }),

  // ── Streaming ─────────────────────────────────────────────────
  setLoading: (isLoading) => set({ isLoading }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingText: (chunk) =>
    set((state) => ({ streamingText: state.streamingText + chunk })),
  clearStreamingText: () => set({ streamingText: '', isStreaming: false }),

  // ── Settings ──────────────────────────────────────────────────
  toggleFallacyDetector: () =>
    set((state) => ({ fallacyDetectorOn: !state.fallacyDetectorOn })),

  // ── API Key ───────────────────────────────────────────────────
  setApiKey: (key: string) => {
    saveKeyToStorage(key)
    set({ apiKey: key })
  },

  // ── Reset ─────────────────────────────────────────────────────
  reset: () => set({ ...defaultState, apiKey: loadStoredKey() }),

  resetDebate: () =>
    set((state) => ({
      messages: [],
      round: 0,
      score: null,
      coachHint: null,
      isLoading: false,
      isStreaming: false,
      streamingText: '',
      screen: 'topic',
    })),
}))
