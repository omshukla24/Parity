// ═══════════════════════════════════════════════════════════════
// TopicInput — Landing screen
// User enters topic, selects debate mode and AI persona
// ═══════════════════════════════════════════════════════════════

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Zap, ArrowRight, BarChart3, Settings, Key } from 'lucide-react'
import { useDebateStore } from '../../store/debateStore'
import { useDebate } from '../../hooks/useDebate'
import { LoadingDots } from '../ui/TypewriterText'
import ApiKeyModal from '../ui/ApiKeyModal'
import type { DebateMode, PersonaType } from '../../types'

const MODES: { id: DebateMode; label: string; desc: string; icon: string }[] = [
  { id: 'casual',   label: 'CASUAL',    desc: 'Open sparring',      icon: '💬' },
  { id: 'oxford',   label: 'OXFORD',    desc: 'Formal structure',   icon: '🎓' },
  { id: 'socratic', label: 'SOCRATIC',  desc: 'AI only questions',  icon: '❓' },
  { id: 'speed',    label: 'SPEED',     desc: '30s per turn',       icon: '⚡' },
  { id: 'voice',    label: 'VOICE DUEL',desc: 'Live audio clash',   icon: '🎙️' },
]

const PERSONAS: { id: PersonaType; name: string; icon: string; style: string; color: string }[] = [
  { id: 'socrates',   name: 'SOCRATES',   icon: '🏛',  style: 'Questions everything',  color: '#818CF8' },
  { id: 'lawyer',     name: 'ATTORNEY',   icon: '⚖️',  style: 'Argues on precedent',   color: '#60A5FA' },
  { id: 'scientist',  name: 'SCIENTIST',  icon: '🔬',  style: 'Demands evidence',       color: '#34D399' },
  { id: 'journalist', name: 'JOURNALIST', icon: '📰',  style: 'Contrarian by nature',  color: '#F472B6' },
  { id: 'kant',       name: 'KANT',       icon: '📚',  style: 'Pure reason only',       color: '#A78BFA' },
]

const EXAMPLE_TOPICS = [
  'Social media does more harm than good',
  'AI will eliminate more jobs than it creates',
  'Remote work is better than office work',
  'Privacy matters more than security',
  'Universal Basic Income is inevitable',
  'Crypto is net positive for society',
]

// ─── Component ────────────────────────────────────────────────
export default function TopicInput() {
  const { topic, mode, persona, isLoading, apiKey, setTopic, setMode, setPersona, setScreen, setApiKey } =
    useDebateStore()
  const { runSteelman } = useDebate()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [focused, setFocused] = useState(false)
  const [exampleIdx, setExampleIdx] = useState(0)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  const handleSubmit = async () => {
    if (!topic.trim() || isLoading) return
    await runSteelman()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const fillExample = () => {
    setTopic(EXAMPLE_TOPICS[exampleIdx % EXAMPLE_TOPICS.length])
    setExampleIdx(i => (i + 1) % EXAMPLE_TOPICS.length)
    textareaRef.current?.focus()
  }

  return (
    <div
      className="screen-scroll"
      style={{ position: 'relative', zIndex: 10 }}
    >
      <div style={{
        maxWidth: 1024,
        margin: '0 auto',
        padding: '0 24px 80px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* ── Top nav ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 28,
            paddingBottom: 12,
          }}
        >
          <ParityLogo />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* API Key indicator + settings button */}
            <button
              className="btn-icon"
              onClick={() => setShowApiKeyModal(true)}
              title={apiKey ? 'API Key configured — click to change' : 'Set your Featherless AI key'}
              style={{
                position: 'relative',
                color: apiKey ? '#34D399' : 'rgba(255,255,255,0.35)',
                borderColor: apiKey ? 'rgba(52,211,153,0.25)' : undefined,
                transition: 'all 0.2s',
              }}
            >
              <Key size={15} />
              {/* Green dot when key is set */}
              {apiKey && (
                <span style={{
                  position: 'absolute',
                  top: 5, right: 5,
                  width: 5, height: 5,
                  borderRadius: '50%',
                  background: '#34D399',
                  boxShadow: '0 0 6px #34D399',
                }} />
              )}
            </button>
            <button
              className="btn-icon"
              onClick={() => setScreen('leaderboard')}
              title="Leaderboard"
            >
              <Trophy size={16} />
            </button>
          </div>
        </motion.div>

        {/* API Key Modal */}
        <ApiKeyModal
          open={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          currentKey={apiKey}
          onSave={(key, n8n, miro) => { 
            setApiKey(key)
            useDebateStore.getState().setN8nUrl(n8n)
            useDebateStore.getState().setMiroToken(miro)
            setShowApiKeyModal(false) 
          }}
        />

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{ paddingTop: 48, paddingBottom: 48 }}
        >
          <div style={{ marginBottom: 16 }}>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--brand)',
                display: 'inline-block',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              LOVHACK S2 · DEBATE INTELLIGENCE ENGINE
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 700,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: '#fff',
            marginBottom: 20,
          }}>
            Enter any{' '}
            <span className="gradient-text-brand">opinion.</span>
            <br />
            Pick a side.{' '}
            <span style={{ color: 'var(--for)' }}>Win</span>
            {' '}the{' '}
            <span style={{ color: 'var(--against)' }}>argument.</span>
          </h1>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6,
            maxWidth: 600,
          }}>
            AI steelmans both sides. You pick your position. The engine argues back across 5 rounds. A judge renders a verdict.
          </p>
        </motion.div>

        {/* ── Topic Input ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <div
            className="input-wrap"
            style={{
              position: 'relative',
              borderColor: focused ? 'var(--brand)' : 'var(--border)',
              boxShadow: focused
                ? '0 0 0 3px var(--brand-dim), 0 0 40px rgba(129,140,248,0.08)'
                : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: focused ? 'var(--brand)' : 'var(--text-4)',
              marginBottom: 12,
              transition: 'color 0.2s',
            }}>
              PROPOSITION_
            </div>

            <textarea
              ref={textareaRef}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Type any claim, opinion, or statement..."
              rows={3}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontFamily: "'Space Mono', monospace",
                fontSize: 18,
                fontWeight: 400,
                lineHeight: 1.5,
                caretColor: 'var(--brand)',
                resize: 'none',
              }}
            />

            {/* Character count + example */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
            }}>
              <button
                onClick={fillExample}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  transition: 'color 0.2s',
                  padding: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
              >
                ↻ Try an example
              </button>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                color: topic.length > 200 ? 'var(--against)' : 'var(--text-4)',
              }}>
                {topic.length}/250
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Mode Selection ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          style={{ marginTop: 28 }}
        >
          <SectionLabel>DEBATE MODE</SectionLabel>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
            marginTop: 10,
          }}>
            {MODES.map(m => (
              <button
                key={m.id}
                className={`mode-chip ${mode === m.id ? 'active' : ''}`}
                onClick={() => setMode(m.id)}
              >
                <div style={{ fontSize: 16, marginBottom: 3 }}>{m.icon}</div>
                <div>{m.label}</div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: 9,
                  textTransform: 'none',
                  letterSpacing: 0,
                  color: 'rgba(255,255,255,0.35)',
                  marginTop: 2,
                }}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Persona Selection ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.45 }}
          style={{ marginTop: 28 }}
        >
          <SectionLabel>AI OPPONENT PERSONA</SectionLabel>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
            marginTop: 10,
          }}>
            {PERSONAS.map(p => (
              <button
                key={p.id}
                className={`persona-card persona-${p.id} ${persona === p.id ? 'active' : ''}`}
                onClick={() => setPersona(p.id)}
                style={{ '--persona-color': p.color } as React.CSSProperties}
              >
                <div className="persona-icon">{p.icon}</div>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: persona === p.id ? p.color : 'var(--text-2)',
                }}>
                  {p.name}
                </div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  color: 'var(--text-3)',
                  lineHeight: 1.3,
                }}>
                  {p.style}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{ marginTop: 36, display: 'flex', gap: 12, alignItems: 'center' }}
        >
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={!topic.trim() || isLoading}
            style={{
              flex: 1,
              opacity: !topic.trim() ? 0.4 : 1,
              cursor: !topic.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <LoadingDots color="#000" />
                <span style={{ marginLeft: 8 }}>ANALYZING...</span>
              </>
            ) : (
              <>
                INITIALIZE DEBATE
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <button
            className="btn btn-ghost"
            onClick={() => setScreen('leaderboard')}
            style={{ flexShrink: 0, gap: 8 }}
          >
            <BarChart3 size={15} />
            HALL OF FAME
          </button>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          style={{
            marginTop: 48,
            display: 'flex',
            gap: 32,
          }}
        >
          {[
            { value: '12,847', label: 'Debates Completed' },
            { value: '94%',    label: 'Fallacies Caught' },
            { value: '6.2K',   label: 'Topics Covered' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1,
              }}>{stat.value}</div>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                color: 'var(--text-4)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: 4,
              }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Sponsor credit ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: 'var(--text-4)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 12,
            textAlign: 'center',
          }}>
            LovHack Season 2 · Powered by
          </div>

          {/* Sponsor badges row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}>
            {/* Featherless AI */}
            <a
              href="https://featherless.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
            >
              <span style={{ fontSize: 13 }}>🪶</span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.08em',
              }}>FEATHERLESS AI</span>
            </a>

            <span style={{ color: 'var(--border)', fontSize: 12 }}>×</span>

            {/* n8n */}
            <a
              href="https://n8n.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: 'rgba(255,100,0,0.06)',
                border: '1px solid rgba(255,100,0,0.2)',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,100,0,0.4)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,100,0,0.2)' }}
            >
              <span style={{ fontSize: 13 }}>⚡</span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                color: '#FF6400',
                opacity: 0.8,
                letterSpacing: '0.08em',
              }}>n8n</span>
            </a>

            <span style={{ color: 'var(--border)', fontSize: 12 }}>×</span>

            {/* Miro */}
            <a
              href="https://miro.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: 'rgba(255,215,0,0.04)',
                border: '1px solid rgba(255,215,0,0.18)',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.35)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,215,0,0.18)' }}
            >
              <span style={{ fontSize: 13 }}>🗺️</span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                color: '#FFD700',
                opacity: 0.8,
                letterSpacing: '0.08em',
              }}>MIRO</span>
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────

function ParityLogo() {
  const letters = 'PARITY'.split('')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'linear-gradient(135deg, var(--for), var(--brand), var(--against))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Space Mono', monospace",
        fontWeight: 700,
        fontSize: 14,
        color: '#000',
      }}>P</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {letters.map((l, i) => (
          <span
            key={i}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.35em',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            {l}
          </span>
        ))}
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.05em',
          marginLeft: 12,
          textTransform: 'uppercase',
        }}>
          v1.0
        </span>
      </div>
    </div>
  )
}

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
