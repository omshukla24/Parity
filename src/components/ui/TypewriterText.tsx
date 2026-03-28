// ═══════════════════════════════════════════════════════════════
// TypewriterText — Character-by-character text reveal
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react'

interface TypewriterTextProps {
  text: string
  speed?: number        // ms per character
  delay?: number        // initial delay ms
  cursor?: boolean      // show blinking cursor
  onComplete?: () => void
  className?: string
  style?: React.CSSProperties
}

export function TypewriterText({
  text,
  speed = 18,
  delay = 0,
  cursor = true,
  onComplete,
  className,
  style,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const idxRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    idxRef.current = 0
    setDisplayed('')
    setDone(false)

    const startTimer = setTimeout(() => {
      const type = () => {
        if (idxRef.current < text.length) {
          idxRef.current++
          setDisplayed(text.slice(0, idxRef.current))
          timerRef.current = setTimeout(type, speed)
        } else {
          setDone(true)
          onComplete?.()
        }
      }
      type()
    }, delay)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(timerRef.current)
    }
  }, [text, speed, delay])

  return (
    <span className={className} style={style}>
      {displayed}
      {cursor && !done && (
        <span
          style={{
            display: 'inline-block',
            width: '0.55em',
            height: '1.05em',
            background: 'var(--brand)',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'blink 1s step-start infinite',
          }}
        />
      )}
    </span>
  )
}

// ─── Loading Dots ──────────────────────────────────────────────
export function LoadingDots({ color = 'currentColor' }: { color?: string }) {
  return (
    <span className="loading-dots" style={{ color }}>
      <span /><span /><span />
    </span>
  )
}

// ─── Shimmer placeholder ───────────────────────────────────────
export function ShimmerLine({
  width = '100%',
  height = 14,
  style,
}: {
  width?: number | string
  height?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 4,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}
