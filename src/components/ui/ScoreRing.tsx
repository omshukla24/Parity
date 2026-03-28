// ═══════════════════════════════════════════════════════════════
// ScoreRing — Animated SVG score ring
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface ScoreRingProps {
  score: number      // 0–100
  size?: number      // px
  strokeWidth?: number
  color?: string
  bgColor?: string
  label?: string
  sublabel?: string
  delay?: number
}

export default function ScoreRing({
  score,
  size = 100,
  strokeWidth = 6,
  color = '#818CF8',
  bgColor = 'rgba(255,255,255,0.06)',
  label,
  sublabel,
  delay = 0,
}: ScoreRingProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)

  return (
    <div className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Animated progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: 1.2,
            delay,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{
            filter: `drop-shadow(0 0 8px ${color}55)`,
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transform: 'rotate(-90deg)',
          }}
        />
      </svg>

      <div className="score-ring-inner">
        {label !== undefined ? (
          <>
            <motion.span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: size > 80 ? 24 : 16,
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.5, duration: 0.4 }}
            >
              {Math.round(score)}
            </motion.span>
            {sublabel && (
              <motion.span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.7, duration: 0.4 }}
              >
                {sublabel}
              </motion.span>
            )}
          </>
        ) : (
          <motion.span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: size > 80 ? 28 : 18,
              fontWeight: 700,
              color: '#fff',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5, duration: 0.4 }}
          >
            {Math.round(score)}
          </motion.span>
        )}
      </div>
    </div>
  )
}
