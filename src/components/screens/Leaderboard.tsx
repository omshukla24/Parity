// ═══════════════════════════════════════════════════════════════
// Leaderboard — Hall of fame for best debates
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, Flame, Clock, ThumbsUp } from 'lucide-react'
import { useDebateStore } from '../../store/debateStore'

type Filter = 'top' | 'recent' | 'trending'

export default function Leaderboard() {
  const { leaderboard, goBack, setScreen } = useDebateStore()
  const [filter, setFilter] = useState<Filter>('top')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const sorted = [...leaderboard].sort((a, b) => {
    if (filter === 'top')      return b.score - a.score
    if (filter === 'recent')   return b.timestamp - a.timestamp
    if (filter === 'trending') return b.votes - a.votes
    return 0
  })

  return (
    <div className="screen-scroll" style={{ position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── Nav ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 28,
          paddingBottom: 20,
        }}>
          <button className="nav-back" onClick={goBack} style={{ position: 'static' }}>
            <ArrowLeft size={14} /> BACK
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setScreen('topic')}
          >
            START DEBATE
          </button>
        </div>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
          }}>
            <Trophy size={24} style={{ color: 'var(--warn)' }} />
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#fff',
            }}>
              Hall of Fame
            </h1>
          </div>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: 'var(--text-4)',
          }}>
            The greatest debates ever argued on P·A·R·I·T·Y
          </p>
        </motion.div>

        {/* ── Stats bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 28,
          }}
        >
          {[
            { icon: '🗣', label: 'Total Debates', value: '12,847' },
            { icon: '🏆', label: 'Human Wins',   value: '48%' },
            { icon: '🤖', label: 'AI Wins',       value: '52%' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1,
                marginBottom: 4,
              }}>{s.value}</div>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: 'var(--text-4)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── Filter tabs ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ display: 'flex', gap: 6, marginBottom: 20 }}
        >
          {([
            { id: 'top',      icon: <Trophy size={12} />,  label: 'TOP RATED' },
            { id: 'recent',   icon: <Clock size={12} />,   label: 'RECENT' },
            { id: 'trending', icon: <Flame size={12} />,   label: 'TRENDING' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              className={`mode-chip ${filter === tab.id ? 'active' : ''}`}
              onClick={() => setFilter(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ── Leaderboard entries ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((entry, i) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.06 }}
            >
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 16px',
                  background: expandedIdx === i ? 'rgba(255,255,255,0.04)' : 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                {/* Rank */}
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : 'var(--text-4)',
                  width: 24,
                  flexShrink: 0,
                  paddingTop: 2,
                }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 5,
                    flexWrap: 'wrap',
                  }}>
                    {/* Winner badge */}
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      color: entry.winner === 'AI' ? 'var(--against)' : 'var(--for)',
                      letterSpacing: '0.05em',
                    }}>
                      {entry.winner === 'AI' ? '🤖' : '👤'} {entry.winner.toUpperCase()}
                    </span>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      color: 'var(--text-4)',
                    }}>
                      {entry.side === 'for' ? '✦ FOR' : entry.side === 'against' ? '✦ AGAINST' : '✦ DEVIL'}
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--warn)',
                    }}>
                      {entry.score}/100
                    </span>
                  </div>

                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-2)',
                    marginBottom: 6,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: expandedIdx === i ? 'normal' : 'nowrap',
                  }}>
                    "{entry.topic}"
                  </div>

                  {/* Votes + time */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      color: 'var(--text-4)',
                    }}>
                      <ThumbsUp size={9} /> {entry.votes.toLocaleString()}
                    </span>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      color: 'var(--text-4)',
                    }}>
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded highlight */}
              {expandedIdx === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    marginTop: -4,
                  }}
                >
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    color: 'var(--brand)',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                  }}>
                    BEST ARGUMENT
                  </div>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: 'var(--text-3)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    "{entry.highlight}"
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  )
}

// ─── Time ago helper ───────────────────────────────────────────
function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const hrs = Math.floor(diff / 1000 / 60 / 60)
  if (hrs < 1) return 'just now'
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
