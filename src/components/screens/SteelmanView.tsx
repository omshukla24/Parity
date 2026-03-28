// ═══════════════════════════════════════════════════════════════
// SteelmanView — Best arguments for both sides, side by side
// ═══════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Shield, Sword } from 'lucide-react'
import { useDebateStore } from '../../store/debateStore'
import { ShimmerLine } from '../ui/TypewriterText'
import type { Argument } from '../../types'

export default function SteelmanView() {
  const { topic, steelmanFor, steelmanAgainst, isLoading, goBack, setScreen } =
    useDebateStore()

  const loading = isLoading || (steelmanFor.length === 0 && steelmanAgainst.length === 0)

  return (
    <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <div className="top-bar">
        <button className="nav-back" onClick={goBack}>
          <ArrowLeft size={14} /> BACK
        </button>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginBottom: 3,
          }}>STEELMAN ANALYSIS</div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-1)',
            maxWidth: 400,
            margin: '0 auto',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            "{topic}"
          </div>
        </div>

        <StepDots current={1} />
      </div>

      {/* ── Explanation banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: '10px 24px',
          background: 'var(--brand-dim)',
          borderBottom: '1px solid rgba(129,140,248,0.15)',
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: 'var(--brand)',
          letterSpacing: '0.08em',
          textAlign: 'center',
        }}
      >
        <span style={{ opacity: 0.6 }}>◈</span>
        {' '}THE AI HAS STEELMANNED BOTH POSITIONS — NO STRAW MEN. ONLY THE STRONGEST POSSIBLE CASE.
        {' '}<span style={{ opacity: 0.6 }}>◈</span>
      </motion.div>

      {/* ── Split panels ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>

        {/* FOR panel */}
        <div style={{
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <PanelHeader
            side="for"
            icon={<Shield size={14} />}
            label="THE CASE FOR"
            color="var(--for)"
            glowColor="var(--for-glow)"
          />
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 80px' }}>
            {loading ? (
              <LoadingArguments />
            ) : (
              steelmanFor.map((arg, i) => (
                <ArgumentCard key={arg.id} arg={arg} side="for" delay={i * 0.12} index={i} />
              ))
            )}
          </div>
        </div>

        {/* AGAINST panel */}
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <PanelHeader
            side="against"
            icon={<Sword size={14} />}
            label="THE CASE AGAINST"
            color="var(--against)"
            glowColor="var(--against-glow)"
          />
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 80px' }}>
            {loading ? (
              <LoadingArguments />
            ) : (
              steelmanAgainst.map((arg, i) => (
                <ArgumentCard key={arg.id} arg={arg} side="against" delay={i * 0.12 + 0.06} index={i} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 70%, transparent)',
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <button
          className="btn btn-primary btn-lg"
          onClick={() => setScreen('sideselect')}
          disabled={loading}
          style={{ minWidth: 240 }}
        >
          PICK YOUR SIDE
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  )
}

// ─── Panel Header ──────────────────────────────────────────────
function PanelHeader({
  side, icon, label, color, glowColor,
}: {
  side: 'for' | 'against'
  icon: React.ReactNode
  label: string
  color: string
  glowColor: string
}) {
  return (
    <div style={{
      padding: '14px 20px',
      borderBottom: `1px solid ${color}33`,
      background: `linear-gradient(180deg, ${glowColor} 0%, transparent 100%)`,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color,
      }}>{label}</span>
    </div>
  )
}

// ─── Argument Card ─────────────────────────────────────────────
function ArgumentCard({
  arg, side, delay, index,
}: {
  arg: Argument
  side: 'for' | 'against'
  delay: number
  index: number
}) {
  const color = side === 'for' ? 'var(--for)' : 'var(--against)'
  const bgColor = side === 'for' ? 'var(--for-dim)' : 'var(--against-dim)'
  const borderColor = side === 'for' ? 'var(--for-border)' : 'var(--against-border)'

  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'for' ? -16 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      style={{
        marginBottom: 12,
        padding: '14px 16px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
    >
      {/* Argument number + strength */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          color,
          letterSpacing: '0.15em',
        }}>
          ARG·{String(index + 1).padStart(2, '0')}
        </span>

        <StrengthBar value={arg.strength} color={color} />
      </div>

      {/* Text */}
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.75)',
        margin: 0,
      }}>
        {arg.text}
      </p>

      {/* Category badge */}
      {arg.category && (
        <div style={{
          marginTop: 8,
          display: 'inline-flex',
          padding: '2px 8px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 999,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {arg.category}
        </div>
      )}
    </motion.div>
  )
}

// ─── Strength Bar ──────────────────────────────────────────────
function StrengthBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 9,
        color: 'rgba(255,255,255,0.3)',
      }}>
        {value}%
      </span>
      <div style={{
        width: 48,
        height: 3,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
    </div>
  )
}

// ─── Loading Skeleton ──────────────────────────────────────────
function LoadingArguments() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          padding: '14px 16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          opacity: 1 - i * 0.2,
        }}>
          <ShimmerLine width="30%" height={10} style={{ marginBottom: 10 }} />
          <ShimmerLine width="100%" height={11} style={{ marginBottom: 6 }} />
          <ShimmerLine width="90%"  height={11} style={{ marginBottom: 6 }} />
          <ShimmerLine width="75%"  height={11} />
        </div>
      ))}
    </div>
  )
}

// ─── Step Dots ─────────────────────────────────────────────────
function StepDots({ current }: { current: number }) {
  const steps = ['topic', 'steelman', 'side', 'debate', 'verdict']
  return (
    <div className="step-dots">
      {steps.map((_, i) => (
        <div
          key={i}
          className={`step-dot ${i < current ? 'done' : i === current ? 'active' : ''}`}
        />
      ))}
    </div>
  )
}
