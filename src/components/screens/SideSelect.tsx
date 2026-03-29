// ═══════════════════════════════════════════════════════════════
// SideSelect — Choose FOR / AGAINST / DEVIL'S ADVOCATE
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Shield, Sword, Shuffle } from 'lucide-react'
import { useDebateStore } from '../../store/debateStore'
import type { Side } from '../../types'

const PERSONAS_META: Record<string, { name: string; icon: string; color: string }> = {
  socrates:   { name: 'Socrates',   icon: '🏛',  color: '#818CF8' },
  lawyer:     { name: 'Attorney',   icon: '⚖️',  color: '#60A5FA' },
  scientist:  { name: 'Scientist',  icon: '🔬',  color: '#34D399' },
  journalist: { name: 'Journalist', icon: '📰',  color: '#F472B6' },
  kant:       { name: 'Kant',       icon: '📚',  color: '#A78BFA' },
}

const SIDES: {
  id: Side
  label: string
  sublabel: string
  desc: string
  icon: React.ReactNode
  color: string
  glowColor: string
  tip: string
}[] = [
  {
    id: 'for',
    label: 'FOR',
    sublabel: 'Defend the claim',
    desc: 'Argue in support of the proposition. Bring evidence, logic, and conviction.',
    icon: <Shield size={28} />,
    color: 'var(--for)',
    glowColor: 'var(--for-glow)',
    tip: 'Start with your strongest argument. Establish the burden of proof early.',
  },
  {
    id: 'against',
    label: 'AGAINST',
    sublabel: 'Oppose the claim',
    desc: 'Challenge the proposition. Find the weaknesses in the steelmanned case.',
    icon: <Sword size={28} />,
    color: 'var(--against)',
    glowColor: 'var(--against-glow)',
    tip: 'Attack the premise, not just the conclusion. Find what needs to be true for the FOR side to win — then disprove it.',
  },
  {
    id: 'devil',
    label: "DEVIL'S ADVOCATE",
    sublabel: 'Hard mode',
    desc: 'Fight the side you actually agree with. Train your ability to argue against your own beliefs.',
    icon: <Shuffle size={28} />,
    color: 'var(--devil)',
    glowColor: 'var(--devil-glow)',
    tip: 'This is hard mode. Separate yourself from your beliefs. You are a hired advocate, not a true believer.',
  },
]

export default function SideSelect() {
  const { topic, persona, userSide, goBack, setUserSide, setScreen } = useDebateStore()
  const [hoveredSide, setHoveredSide] = useState<Side | null>(null)
  const personaMeta = PERSONAS_META[persona]

  const mode = useDebateStore((s) => s.mode)

  const handleConfirm = () => {
    setScreen(mode === 'voice' ? 'voice_debate' : 'debate')
  }

  return (
    <div className="screen-scroll" style={{ position: 'relative', zIndex: 10 }}>
      <div style={{
        maxWidth: 1024,
        margin: '0 auto',
        padding: '0 24px 80px',
        minHeight: '100vh',
      }}>

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
          <StepDots current={2} />
        </div>

        {/* ── Topic reminder ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 40,
            padding: '14px 18px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}
        >
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: 'var(--text-4)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 5,
          }}>
            PROPOSITION
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-1)',
            lineHeight: 1.4,
          }}>
            "{topic}"
          </div>
        </motion.div>

        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 28 }}
        >
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#fff',
            marginBottom: 8,
          }}>
            Choose your side.
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'var(--text-3)',
          }}>
            You'll argue this position against{' '}
            <span style={{ color: personaMeta.color }}>
              {personaMeta.icon} {personaMeta.name}
            </span>
            . Pick wisely.
          </p>
        </motion.div>

        {/* ── Side cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SIDES.map((side, idx) => (
            <motion.div
              key={side.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.08 }}
            >
              <SideCard
                side={side}
                selected={userSide === side.id}
                hovered={hoveredSide === side.id}
                onSelect={() => setUserSide(side.id)}
                onHover={() => setHoveredSide(side.id)}
                onLeave={() => setHoveredSide(null)}
              />
            </motion.div>
          ))}
        </div>

        {/* ── Strategy tip ── */}
        {(hoveredSide ?? userSide) && (
          <motion.div
            key={hoveredSide ?? userSide}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 20,
              padding: '12px 16px',
              background: 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.18)',
              borderRadius: 10,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.5,
              margin: 0,
            }}>
              <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Strategy: </span>
              {SIDES.find(s => s.id === (hoveredSide ?? userSide))?.tip}
            </p>
          </motion.div>
        )}

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ marginTop: 32, display: 'flex', gap: 12 }}
        >
          <button
            className="btn btn-primary btn-lg"
            onClick={handleConfirm}
            style={{ flex: 1 }}
          >
            ENTER THE ARENA
            <ArrowRight size={16} />
          </button>
        </motion.div>

      </div>
    </div>
  )
}

// ─── Side Card ─────────────────────────────────────────────────
function SideCard({
  side, selected, hovered, onSelect, onHover, onLeave,
}: {
  side: typeof SIDES[0]
  selected: boolean
  hovered: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
}) {
  const active = selected || hovered

  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '20px 22px',
        background: active ? `color-mix(in srgb, ${side.color} 8%, transparent)` : 'var(--surface)',
        border: `1px solid ${active ? side.color + '55' : 'var(--border)'}`,
        borderLeft: `3px solid ${active ? side.color : 'transparent'}`,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        boxShadow: selected ? `0 0 24px color-mix(in srgb, ${side.color} 15%, transparent)` : 'none',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 52,
        height: 52,
        flexShrink: 0,
        borderRadius: 12,
        background: active ? `color-mix(in srgb, ${side.color} 15%, transparent)` : 'var(--surface)',
        border: `1px solid ${active ? side.color + '44' : 'var(--border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? side.color : 'var(--text-3)',
        transition: 'all 0.2s ease',
      }}>
        {side.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: active ? side.color : 'var(--text-1)',
            transition: 'color 0.2s',
          }}>
            {side.label}
          </span>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: active ? side.color + '88' : 'var(--text-4)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {side.sublabel}
          </span>
        </div>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: 'var(--text-3)',
          lineHeight: 1.45,
          margin: 0,
        }}>
          {side.desc}
        </p>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: side.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#000', fontSize: 11, fontWeight: 700 }}>✓</span>
        </div>
      )}
    </button>
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
