// ═══════════════════════════════════════════════════════════════
// VerdictScreen — AI judge delivers the final score
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, RotateCcw, Share2, Download, Trophy,
  ChevronDown, ChevronUp, Zap, Map, CheckCircle, AlertCircle, Loader,
} from 'lucide-react'
import { useDebateStore } from '../../store/debateStore'
import { useDebate } from '../../hooks/useDebate'
import ScoreRing from '../ui/ScoreRing'
import { TypewriterText, LoadingDots } from '../ui/TypewriterText'
import type { ScoreCategory } from '../../types'

const SCORE_COLORS: Record<string, string> = {
  logic:    '#818CF8',
  evidence: '#34D399',
  clarity:  '#F472B6',
  overall:  '#F59E0B',
}

type ExportStatus = 'idle' | 'loading' | 'success' | 'error' | 'unconfigured'

export default function VerdictScreen() {
  const { score, topic, userSide, persona, messages, steelmanFor, steelmanAgainst, isLoading, reset, goBack, setScreen } =
    useDebateStore()
  const { exportToN8n, exportToMiro } = useDebate()
  const [showTranscript, setShowTranscript] = useState(false)
  const [copied, setCopied] = useState(false)
  const [n8nStatus, setN8nStatus] = useState<ExportStatus>('idle')
  const [miroStatus, setMiroStatus] = useState<ExportStatus>('idle')
  const [miroUrl, setMiroUrl] = useState<string | null>(null)
  const [n8nMsg, setN8nMsg] = useState<string>('')

  const handleN8nExport = async () => {
    if (!score) return
    setN8nStatus('loading')
    const result = await exportToN8n()
    if (result?.demo) {
      setN8nStatus('unconfigured')
      setN8nMsg('Add N8N_WEBHOOK_URL to .env to enable')
    } else if (result?.success) {
      setN8nStatus('success')
      setN8nMsg('Debate sent to n8n workflow!')
    } else {
      setN8nStatus('error')
      setN8nMsg(result?.message ?? 'Failed to reach n8n')
    }
    setTimeout(() => setN8nStatus('idle'), 4000)
  }

  const handleMiroExport = async () => {
    if (!score) return
    setMiroStatus('loading')
    const result = await exportToMiro()
    if (result?.demo) {
      setMiroStatus('unconfigured')
    } else if (result?.success && result.boardUrl) {
      setMiroStatus('success')
      setMiroUrl(result.boardUrl)
      window.open(result.boardUrl, '_blank')
    } else {
      setMiroStatus('error')
    }
    setTimeout(() => { if (miroStatus !== 'success') setMiroStatus('idle') }, 4000)
  }

  const handleShare = () => {
    const text = `I just debated "${topic}" on P.A.R.I.T.Y. — score: ${score?.overall.userScore ?? 0}/100. ${score?.winner === 'user' ? '🏆 I won!' : 'The AI won this round.'}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleExport = () => {
    const lines = [
      `P·A·R·I·T·Y — DEBATE TRANSCRIPT`,
      `Proposition: "${topic}"`,
      `Your side: ${userSide.toUpperCase()}`,
      `AI persona: ${persona}`,
      `Rounds: ${messages.length / 2}`,
      `\n${'═'.repeat(60)}\n`,
      ...messages.map(m =>
        `[${m.role.toUpperCase()} · Round ${m.round}]\n${m.text}\n`
      ),
      `\n${'═'.repeat(60)}\n`,
      `VERDICT: ${score?.verdict ?? ''}`,
      `\nSCORES:`,
      `  Logic:    User ${score?.logic.userScore ?? 0} vs AI ${score?.logic.aiScore ?? 0}`,
      `  Evidence: User ${score?.evidence.userScore ?? 0} vs AI ${score?.evidence.aiScore ?? 0}`,
      `  Clarity:  User ${score?.clarity.userScore ?? 0} vs AI ${score?.clarity.aiScore ?? 0}`,
      `  Overall:  User ${score?.overall.userScore ?? 0} vs AI ${score?.overall.aiScore ?? 0}`,
      `\nWINNER: ${score?.winner === 'user' ? 'YOU' : score?.winner === 'ai' ? 'AI' : 'DRAW'}`,
    ].join('\n')

    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `parity-debate-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading || !score) {
    return (
      <div className="full-screen flex-center flex-col" style={{ gap: 20, zIndex: 10 }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTop: '2px solid var(--brand)',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.15em',
            color: 'var(--text-3)',
            textTransform: 'uppercase',
          }}>
            <LoadingDots color="var(--brand)" />
            {' '}JUDGE DELIBERATING...
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: 'var(--text-4)',
            marginTop: 8,
          }}>
            Evaluating logic, evidence, and clarity
          </p>
        </div>
      </div>
    )
  }

  const winner = score.winner
  const winnerLabel = winner === 'user' ? 'YOU WIN' : winner === 'ai' ? 'AI WINS' : 'DRAW'
  const winnerColor = winner === 'user' ? 'var(--for)' : winner === 'ai' ? 'var(--against)' : 'var(--brand)'
  const winnerEmoji = winner === 'user' ? '🏆' : winner === 'ai' ? '🤖' : '🤝'

  return (
    <div className="screen-scroll" style={{ position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── Nav ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 28,
          paddingBottom: 24,
        }}>
          <button className="nav-back" onClick={goBack} style={{ position: 'static' }}>
            <ArrowLeft size={14} /> BACK
          </button>
          <StepDots current={4} />
        </div>

        {/* ── Winner banner ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ fontSize: 64, marginBottom: 12 }}
          >
            {winnerEmoji}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.25em',
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              VERDICT · PARITY DEBATE ENGINE
            </div>

            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(36px, 7vw, 56px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: winnerColor,
              marginBottom: 16,
              textShadow: `0 0 60px ${winnerColor}44`,
            }}>
              {winnerLabel}
            </div>

            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: 'var(--text-3)',
              lineHeight: 1.6,
              maxWidth: 600,
              margin: '0 auto',
            }}>
              <TypewriterText text={score.verdict} speed={14} delay={600} cursor={false} />
            </p>
          </motion.div>
        </motion.div>

        {/* ── Score rings ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ marginBottom: 32 }}
        >
          <SectionLabel>SCORE BREAKDOWN</SectionLabel>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginTop: 16,
          }}>
            {(['logic', 'evidence', 'clarity', 'overall'] as const).map((key, i) => {
              const cat = score[key]
              const color = SCORE_COLORS[key]
              return (
                <ScoreCard
                  key={key}
                  category={cat}
                  color={color}
                  delay={0.5 + i * 0.1}
                  isOverall={key === 'overall'}
                />
              )
            })}
          </div>
        </motion.div>

        {/* ── Best argument ── */}
        {score.bestArgument && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            style={{ marginBottom: 24 }}
          >
            <SectionLabel>BEST ARGUMENT</SectionLabel>
            <div style={{
              marginTop: 12,
              padding: '18px 20px',
              background: `linear-gradient(135deg, ${winnerColor}0D, transparent)`,
              border: `1px solid ${winnerColor}33`,
              borderLeft: `3px solid ${winnerColor}`,
              borderRadius: 12,
            }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: winnerColor,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                {winner === 'user' ? 'YOUR WINNING ARGUMENT' : 'AI\'S DECISIVE POINT'}
              </div>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
                margin: 0,
                fontStyle: 'italic',
              }}>
                "{score.bestArgument}"
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{ display: 'flex', gap: 10, marginBottom: 24 }}
        >
          <button
            className="btn btn-primary btn-lg"
            onClick={reset}
            style={{ flex: 1 }}
          >
            <RotateCcw size={15} />
            NEW DEBATE
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleShare}
            style={{ gap: 8 }}
          >
            <Share2 size={15} />
            {copied ? 'COPIED!' : 'SHARE'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleExport}
            style={{ gap: 8 }}
          >
            <Download size={15} />
            EXPORT
          </button>
        </motion.div>

        {/* ── Sponsor Exports: n8n + Miro ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
          style={{ marginBottom: 16 }}
        >
          <SectionLabel>AUTOMATE & VISUALIZE</SectionLabel>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>

            {/* ── n8n Button ─────────────────── */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleN8nExport}
              disabled={n8nStatus === 'loading'}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                padding: '14px 16px',
                background: n8nStatus === 'success'
                  ? 'rgba(52,211,153,0.08)'
                  : n8nStatus === 'error'
                  ? 'rgba(244,114,182,0.08)'
                  : 'rgba(255,100,0,0.06)',
                border: `1px solid ${
                  n8nStatus === 'success' ? 'rgba(52,211,153,0.3)'
                  : n8nStatus === 'error' ? 'rgba(244,114,182,0.3)'
                  : 'rgba(255,100,0,0.25)'
                }`,
                borderRadius: 12,
                cursor: n8nStatus === 'loading' ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'rgba(255,100,0,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {n8nStatus === 'loading' ? (
                    <Loader size={14} color="#FF6400" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : n8nStatus === 'success' ? (
                    <CheckCircle size={14} color="#34D399" />
                  ) : n8nStatus === 'error' || n8nStatus === 'unconfigured' ? (
                    <AlertCircle size={14} color="#F472B6" />
                  ) : (
                    <Zap size={14} color="#FF6400" />
                  )}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: n8nStatus === 'success' ? '#34D399'
                      : n8nStatus === 'error' ? '#F472B6'
                      : '#FF6400',
                    textTransform: 'uppercase',
                  }}>
                    {n8nStatus === 'loading' ? 'SENDING...'
                      : n8nStatus === 'success' ? 'SENT!'
                      : n8nStatus === 'error' ? 'FAILED'
                      : n8nStatus === 'unconfigured' ? 'NOT CONFIGURED'
                      : 'n8n AUTOMATE'}
                  </div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11,
                    color: 'var(--text-4)',
                    marginTop: 2,
                  }}>
                    {n8nStatus === 'success' || n8nStatus === 'error' || n8nStatus === 'unconfigured'
                      ? n8nMsg
                      : 'Email • Discord • Sheets • Notion'}
                  </div>
                </div>
              </div>
            </motion.button>

            {/* ── Miro Button ────────────────── */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMiroExport}
              disabled={miroStatus === 'loading'}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 6,
                padding: '14px 16px',
                background: miroStatus === 'success'
                  ? 'rgba(52,211,153,0.08)'
                  : miroStatus === 'error'
                  ? 'rgba(244,114,182,0.08)'
                  : 'rgba(255,215,0,0.04)',
                border: `1px solid ${
                  miroStatus === 'success' ? 'rgba(52,211,153,0.3)'
                  : miroStatus === 'error' ? 'rgba(244,114,182,0.3)'
                  : 'rgba(255,215,0,0.2)'
                }`,
                borderRadius: 12,
                cursor: miroStatus === 'loading' ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'rgba(255,215,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {miroStatus === 'loading' ? (
                    <Loader size={14} color="#FFD700" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : miroStatus === 'success' ? (
                    <CheckCircle size={14} color="#34D399" />
                  ) : miroStatus === 'error' || miroStatus === 'unconfigured' ? (
                    <AlertCircle size={14} color="#F472B6" />
                  ) : (
                    <Map size={14} color="#FFD700" />
                  )}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: miroStatus === 'success' ? '#34D399'
                      : miroStatus === 'error' ? '#F472B6'
                      : '#FFD700',
                    textTransform: 'uppercase',
                  }}>
                    {miroStatus === 'loading' ? 'CREATING...'
                      : miroStatus === 'success' ? 'BOARD CREATED!'
                      : miroStatus === 'error' ? 'FAILED'
                      : miroStatus === 'unconfigured' ? 'NOT CONFIGURED'
                      : 'MIRO MAP'}
                  </div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11,
                    color: 'var(--text-4)',
                    marginTop: 2,
                  }}>
                    {miroStatus === 'success' && miroUrl
                      ? 'Opening in new tab...'
                      : miroStatus === 'unconfigured'
                      ? 'Add MIRO_ACCESS_TOKEN to .env'
                      : 'Visual argument map'}
                  </div>
                </div>
              </div>
            </motion.button>

          </div>

          {/* Open Miro board link if created */}
          <AnimatePresence>
            {miroStatus === 'success' && miroUrl && (
              <motion.a
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                href={miroUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 8,
                  padding: '10px 16px',
                  background: 'rgba(255,215,0,0.06)',
                  border: '1px solid rgba(255,215,0,0.25)',
                  borderRadius: 8,
                  color: '#FFD700',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
              >
                <Map size={12} />
                OPEN ARGUMENT MAP IN MIRO →
              </motion.a>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── View Transcript ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <button
            onClick={() => setShowTranscript(v => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text-3)',
              cursor: 'pointer',
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
          >
            <span>VIEW FULL TRANSCRIPT</span>
            {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                marginTop: 8,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: i < messages.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    color: msg.role === 'user' ? 'var(--for)' : 'var(--brand)',
                    letterSpacing: '0.12em',
                    marginBottom: 5,
                  }}>
                    {msg.role === 'user' ? 'YOU' : 'AI'} · R{msg.round}
                  </div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: 'var(--text-3)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    {msg.text}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ── Leaderboard CTA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ marginTop: 24 }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => setScreen('leaderboard')}
            style={{ width: '100%', gap: 10 }}
          >
            <Trophy size={15} />
            VIEW HALL OF FAME
          </button>
        </motion.div>

      </div>
    </div>
  )
}

// ─── Score Card ────────────────────────────────────────────────
function ScoreCard({
  category, color, delay, isOverall,
}: {
  category: ScoreCategory
  color: string
  delay: number
  isOverall: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      style={{
        padding: isOverall ? '20px 16px' : '16px 12px',
        background: isOverall ? `color-mix(in srgb, ${color} 8%, transparent)` : 'var(--surface)',
        border: `1px solid ${isOverall ? color + '44' : 'var(--border)'}`,
        borderRadius: 12,
        textAlign: 'center',
        boxShadow: isOverall ? `0 0 30px ${color}22` : 'none',
      }}
    >
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.1em',
        color: isOverall ? color : 'var(--text-4)',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        {category.label.split(' ')[0]}
      </div>

      {/* Dual rings: user vs AI */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 8,
        flexWrap: 'wrap',
      }}>
        <div style={{ textAlign: 'center' }}>
          <ScoreRing
            score={category.userScore}
            size={isOverall ? 80 : 58}
            color={color}
            strokeWidth={isOverall ? 6 : 5}
            delay={delay}
          />
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            color: color,
            marginTop: 4,
            letterSpacing: '0.08em',
          }}>YOU</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <ScoreRing
            score={category.aiScore}
            size={isOverall ? 80 : 58}
            color="rgba(255,255,255,0.25)"
            strokeWidth={isOverall ? 6 : 5}
            delay={delay + 0.1}
          />
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            color: 'var(--text-4)',
            marginTop: 4,
            letterSpacing: '0.08em',
          }}>AI</div>
        </div>
      </div>

      {category.commentary && (
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: 'var(--text-4)',
          lineHeight: 1.4,
          margin: 0,
        }}>
          {category.commentary}
        </p>
      )}
    </motion.div>
  )
}

// ─── Section Label ─────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'var(--text-3)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{ width: 16, height: 1, background: 'var(--border)' }} />
      {children}
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

// ─── Step Dots ─────────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  return (
    <div className="step-dots">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={`step-dot ${i < current ? 'done' : i === current ? 'active' : ''}`}
        />
      ))}
    </div>
  )
}
