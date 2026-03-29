// ═══════════════════════════════════════════════════════════════
// P·A·R·I·T·Y  —  Type Definitions
// ═══════════════════════════════════════════════════════════════

export type Screen =
  | 'topic'
  | 'steelman'
  | 'sideselect'
  | 'debate'
  | 'voice_debate'
  | 'verdict'
  | 'leaderboard'

export type Side = 'for' | 'against' | 'devil'

export type DebateMode = 'casual' | 'oxford' | 'socratic' | 'speed' | 'voice'

export type PersonaType = 'socrates' | 'lawyer' | 'scientist' | 'journalist' | 'kant'

export type FallacySeverity = 'minor' | 'major'

// ─── Argument ──────────────────────────────────────────────────
export interface Argument {
  id: string
  text: string
  side: 'for' | 'against'
  strength: number  // 0–100
  category?: string // e.g. "empirical", "moral", "practical"
}

// ─── Fallacy ───────────────────────────────────────────────────
export interface FallacyDetection {
  type: string       // e.g. "Straw Man", "Ad Hominem"
  description: string
  severity: FallacySeverity
  quote?: string     // the exact text that triggered the detection
}

// ─── Debate Message ────────────────────────────────────────────
export interface DebateMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  fallacies?: FallacyDetection[]
  round: number
  timestamp: number
  isStreaming?: boolean
}

// ─── Score ─────────────────────────────────────────────────────
export interface ScoreCategory {
  label: string
  userScore: number    // 0–100
  aiScore: number      // 0–100
  commentary?: string
}

export interface Score {
  logic: ScoreCategory
  evidence: ScoreCategory
  clarity: ScoreCategory
  overall: ScoreCategory
  winner: 'user' | 'ai' | 'draw'
  verdict: string      // AI judge's final statement
  bestArgument: string // Best argument from the winner
  highlight?: string   // A memorable quote from the debate
}

// ─── Persona ───────────────────────────────────────────────────
export interface PersonaConfig {
  id: PersonaType
  name: string
  icon: string
  style: string
  color: string
  systemPrompt: string
}

// ─── Mode ──────────────────────────────────────────────────────
export interface ModeConfig {
  id: DebateMode
  label: string
  desc: string
  icon: string
  maxRounds: number
  turnTimeout?: number // seconds
}

// ─── Leaderboard Entry ─────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number
  topic: string
  winner: string       // user handle or "AI"
  side: Side
  score: number
  votes: number
  timestamp: number
  highlight: string    // best argument snippet
}

// ─── App State ─────────────────────────────────────────────────
export interface CoachResponse {
  hint: string
  strategy: string
}

export interface DebateState {
  screen: Screen
  topic: string
  mode: DebateMode
  persona: PersonaType
  userSide: Side
  steelmanFor: Argument[]
  steelmanAgainst: Argument[]
  messages: DebateMessage[]
  round: number
  maxRounds: number
  score: Score | null
  coachMode: boolean
  coachHint: CoachResponse[] | string[] | string | null
  isLoading: boolean
  isStreaming: boolean
  streamingText: string
  fallacyDetectorOn: boolean
  leaderboard: LeaderboardEntry[]
  apiKey: string  // User-provided Featherless AI key (stored in localStorage)
  n8nUrl: string
  miroToken: string
}

// ─── API Request/Response shapes ───────────────────────────────
export interface SteelmanRequest {
  topic: string
  mode: DebateMode
}

export interface SteelmanResponse {
  for: Argument[]
  against: Argument[]
}

export interface DebateRequest {
  topic: string
  userSide: Side
  userArgument: string
  history: DebateMessage[]
  persona: PersonaType
  mode: DebateMode
  round: number
}

export interface JudgeRequest {
  topic: string
  userSide: Side
  history: DebateMessage[]
  persona: PersonaType
}

export interface FallacyRequest {
  text: string
  context?: string
}

export interface CoachRequest {
  topic: string
  userSide: Side
  history: DebateMessage[]
  persona: PersonaType
  round: number
}

export interface CoachResponse {
  hint: string
  strategy: string
}
