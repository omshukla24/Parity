// ═══════════════════════════════════════════════════════════════
// DotGrid — Animated canvas dot-field background
// Nothing Phone × Vercel aesthetic
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'
import { useDebateStore } from '../../store/debateStore'

interface Dot {
  x: number
  y: number
  baseOpacity: number
  opacity: number
  targetOpacity: number
  speed: number
}

export default function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const rafRef = useRef<number>(0)
  const screen = useDebateStore(s => s.screen)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SPACING = 24
    let W = 0, H = 0

    function buildGrid() {
      if (!canvas) return
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight

      const cols = Math.ceil(W / SPACING) + 1
      const rows = Math.ceil(H / SPACING) + 1
      dotsRef.current = []

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const base = 0.035 + Math.random() * 0.025
          dotsRef.current.push({
            x: c * SPACING,
            y: r * SPACING,
            baseOpacity: base,
            opacity: base,
            targetOpacity: base,
            speed: 0.003 + Math.random() * 0.008,
          })
        }
      }
    }

    // Screen-based color mapping
    const SCREEN_COLORS: Record<string, string> = {
      topic:      '255, 255, 255',
      steelman:   '255, 255, 255',
      sideselect: '255, 255, 255',
      debate:     '255, 255, 255',
      verdict:    '255, 255, 255',
      leaderboard:'255, 255, 255',
    }

    // Occasionally "breathe" a random dot
    let breatheTimer = 0

    function animate(time: number) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, W, H)

      breatheTimer++
      if (breatheTimer % 8 === 0 && dotsRef.current.length > 0) {
        const idx = Math.floor(Math.random() * dotsRef.current.length)
        const dot = dotsRef.current[idx]
        dot.targetOpacity = dot.baseOpacity * (4 + Math.random() * 6)
        setTimeout(() => {
          dot.targetOpacity = dot.baseOpacity
        }, 600 + Math.random() * 1200)
      }

      const color = SCREEN_COLORS[screen] ?? '255,255,255'

      for (const dot of dotsRef.current) {
        // Lerp toward target
        dot.opacity += (dot.targetOpacity - dot.opacity) * dot.speed * 2

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 1, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${dot.opacity})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    buildGrid()
    rafRef.current = requestAnimationFrame(animate)

    const ro = new ResizeObserver(() => buildGrid())
    ro.observe(document.body)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [screen])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 1,
      }}
    />
  )
}
