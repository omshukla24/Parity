// ═══════════════════════════════════════════════════════════════
// FallacyBadge — Animated logical fallacy indicator
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import type { FallacyDetection } from '../../types'

interface FallacyBadgeProps {
  fallacy: FallacyDetection
}

export default function FallacyBadge({ fallacy }: FallacyBadgeProps) {
  const [expanded, setExpanded] = useState(false)

  const isMajor = fallacy.severity === 'major'
  const color = isMajor ? '#EF4444' : '#F59E0B'
  const bg    = isMajor ? 'rgba(239,68,68,0.1)'  : 'rgba(245,158,11,0.1)'
  const border= isMajor ? 'rgba(239,68,68,0.28)' : 'rgba(245,158,11,0.28)'

  return (
    <div style={{ display: 'inline-block', maxWidth: '100%' }}>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{ display: 'inline-block' }}
      >
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px 3px 7px',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 999,
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            color,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <AlertTriangle size={10} strokeWidth={2.5} />
          {fallacy.type}
          {isMajor && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: color,
              color: '#000',
              fontFamily: "'Space Mono', monospace",
              fontSize: 8,
              fontWeight: 700,
              marginLeft: 2,
            }}>!</span>
          )}
        </button>
      </motion.div>

      {/* Expanded tooltip */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              marginTop: 8,
              padding: '12px 14px',
              background: 'rgba(10,10,10,0.95)',
              border: `1px solid ${border}`,
              borderRadius: 10,
              maxWidth: 320,
              position: 'relative',
            }}
          >
            <button
              onClick={() => setExpanded(false)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
              }}
            >
              <X size={12} />
            </button>

            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              color,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 6,
              fontWeight: 700,
            }}>
              {fallacy.type}
              <span style={{
                marginLeft: 8,
                fontSize: 9,
                color: 'rgba(255,255,255,0.35)',
                fontWeight: 400,
              }}>
                {isMajor ? '● MAJOR' : '○ minor'}
              </span>
            </div>

            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.5,
              margin: 0,
            }}>
              {fallacy.description}
            </p>

            {fallacy.quote && (
              <div style={{
                marginTop: 8,
                padding: '6px 10px',
                background: bg,
                borderRadius: 6,
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                fontStyle: 'italic',
              }}>
                "{fallacy.quote}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Fallacy List ──────────────────────────────────────────────
export function FallacyList({ fallacies }: { fallacies: FallacyDetection[] }) {
  if (!fallacies || fallacies.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}
    >
      {fallacies.map((f, i) => (
        <FallacyBadge key={i} fallacy={f} />
      ))}
    </motion.div>
  )
}
