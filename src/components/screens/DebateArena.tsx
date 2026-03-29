// ═══════════════════════════════════════════════════════════════
// DebateArena — The live turn-based debate screen
// Features: streaming AI, fallacy detection, coach mode,
//           round tracking, persona avatar
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, Zap, Eye, EyeOff, BookOpen,
  AlertTriangle, ChevronRight, Flag, Mic, MicOff, Volume2, VolumeX
} from 'lucide-react'
import { useDebateStore } from '../../store/debateStore'
import { useDebate } from '../../hooks/useDebate'
import { FallacyList } from '../ui/FallacyBadge'
import { LoadingDots } from '../ui/TypewriterText'
import type { DebateMessage } from '../../types'

const PERSONAS_META: Record<string, {
  name: string; icon: string; color: string; tagline: string
}> = {
  socrates: { name: 'Socrates', icon: '🏛', color: '#818CF8', tagline: 'The Questioner' },
  lawyer: { name: 'Attorney', icon: '⚖️', color: '#60A5FA', tagline: 'The Advocate' },
  scientist: { name: 'Scientist', icon: '🔬', color: '#34D399', tagline: 'The Empiricist' },
  journalist: { name: 'Journalist', icon: '📰', color: '#F472B6', tagline: 'The Contrarian' },
  kant: { name: 'Kant', icon: '📚', color: '#A78BFA', tagline: 'The Rationalist' },
}

const SIDE_LABELS: Record<string, { label: string; color: string }> = {
  for: { label: 'FOR', color: 'var(--for)' },
  against: { label: 'AGAINST', color: 'var(--against)' },
  devil: { label: "DEVIL'S ADVOCATE", color: 'var(--devil)' },
}

export default function DebateArena() {
  const {
    topic, messages, round, maxRounds, mode, persona,
    userSide, coachMode, coachHint, isStreaming, isLoading,
    fallacyDetectorOn, goBack, setScreen,
    toggleCoachMode, toggleFallacyDetector,
  } = useDebateStore()

  const { sendDebateMessage, fetchCoachHint, runJudge } = useDebate()

  const [userInput, setUserInput] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [showCoachPanel, setShowCoachPanel] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [autoPlayAudio, setAutoPlayAudio] = useState(mode === 'voice')
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const personaMeta = PERSONAS_META[persona]
  const sideMeta = SIDE_LABELS[userSide]
  const isDebateOver = round >= maxRounds
  const canSend = userInput.trim().length > 0 && !isStreaming && !isLoading && !isDebateOver

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript
        }
        if (finalTranscript) setUserInput(prev => (prev + ' ' + finalTranscript).trim())
      }
      
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => {
        setIsListening(false)
        if (mode === 'voice' && !isDebateOver && !isStreaming) {
           // Optionally auto-restart, but safer to let user click to speak again to avoid feedback loops
        }
      }
      recognitionRef.current = recognition
      
      // Auto-start mic if in voice mode and not streaming
      if (mode === 'voice') {
        setTimeout(() => {
          try {
            recognition.start()
            setIsListening(true)
          } catch(e) {}
        }, 1000)
      }
    }
  }, [mode])

  const toggleMic = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setUserInput('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Text-to-Speech logic
  useEffect(() => {
    if (!isStreaming && messages.length > 0 && autoPlayAudio) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'ai' && lastMsg.text) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(lastMsg.text)
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          if (persona === 'socrates') utterance.voice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.lang.includes('en-GB')) || null
          else if (persona === 'lawyer') utterance.voice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English')) || null
          else if (persona === 'scientist') utterance.voice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Karen')) || null
          else if (persona === 'journalist') utterance.voice = voices.find(v => v.name.includes('Tessa') || v.name.includes('Google US English')) || null
          else if (persona === 'kant') utterance.voice = voices.find(v => v.name.includes('Moira') || v.lang.includes('en-IE')) || null
        }
        utterance.rate = 1.05
        window.speechSynthesis.speak(utterance)
      }
    }
  }, [messages, isStreaming, autoPlayAudio, persona])

  // Stop audio on unmount
  useEffect(() => {
    return () => { window.speechSynthesis.cancel() }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const handleSend = async () => {
    if (!canSend) return
    const text = userInput.trim()
    setUserInput('')
    setCharCount(0)
    await sendDebateMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value)
    setCharCount(e.target.value.length)
  }

  const handleCoachClick = async () => {
    toggleCoachMode()
    if (!coachMode && !coachHint) {
      await fetchCoachHint()
    }
    setShowCoachPanel(v => !v)
  }

  return (
    <div style={{
      position: 'relative',
      zIndex: 10,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ── Top Bar ── */}
      <div className="top-bar">
        <button className="nav-back" onClick={goBack} style={{ position: 'static', padding: 0 }}>
          <ArrowLeft size={14} /> BACK
        </button>

        {/* Round tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: maxRounds }).map((_, i) => (
              <div
                key={i}
                className={`round-pip ${i < round ? 'done' : i === round ? 'current' : ''}`}
              />
            ))}
          </div>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: 'var(--text-4)',
            letterSpacing: '0.1em',
          }}>
            {isDebateOver ? 'DEBATE COMPLETE' : `ROUND ${round + 1} OF ${maxRounds}`}
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Fallacy detector toggle */}
          <button
            className="btn-icon"
            onClick={toggleFallacyDetector}
            title={fallacyDetectorOn ? 'Fallacy Detector: ON' : 'Fallacy Detector: OFF'}
            style={{
              color: fallacyDetectorOn ? 'var(--warn)' : 'var(--text-4)',
              borderColor: fallacyDetectorOn ? 'rgba(245,158,11,0.3)' : 'var(--border)',
            }}
          >
            <AlertTriangle size={15} />
          </button>

          {/* Voice mode toggle */}
          <button
            className="btn-icon"
            onClick={() => {
              setAutoPlayAudio(!autoPlayAudio)
              if (autoPlayAudio) window.speechSynthesis.cancel()
            }}
            title={autoPlayAudio ? 'Voice Mode: ON' : 'Voice Mode: OFF'}
            style={{
              color: autoPlayAudio ? 'var(--brand)' : 'var(--text-4)',
              borderColor: autoPlayAudio ? 'rgba(52,211,153,0.3)' : 'var(--border)',
            }}
          >
            {autoPlayAudio ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Coach mode toggle */}
          <button
            className="btn-icon"
            onClick={handleCoachClick}
            title="Coach Mode"
            style={{
              color: coachMode ? 'var(--devil)' : 'var(--text-4)',
              borderColor: coachMode ? 'rgba(167,139,250,0.3)' : 'var(--border)',
            }}
          >
            <BookOpen size={15} />
          </button>

          {/* Force verdict (if at least 2 rounds done) */}
          {round >= 2 && !isDebateOver && (
            <button
              className="btn-icon"
              onClick={() => runJudge()}
              title="End debate & get verdict"
              style={{ color: 'var(--text-3)' }}
            >
              <Flag size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Topic strip ── */}
      <div style={{
        padding: '8px 24px',
        background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <span className="badge" style={{
          background: `color-mix(in srgb, ${sideMeta.color} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${sideMeta.color} 30%, transparent)`,
          color: sideMeta.color,
        }}>
          YOU: {sideMeta.label}
        </span>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: 'var(--text-3)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          "{topic}"
        </span>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          color: personaMeta.color,
          flexShrink: 0,
        }}>
          VS {personaMeta.icon} {personaMeta.name.toUpperCase()}
        </span>
      </div>

      {/* ── Coach hint panel ── */}
      <AnimatePresence>
        {coachMode && showCoachPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={{
              padding: '12px 24px',
              background: 'rgba(167,139,250,0.06)',
              borderBottom: '1px solid rgba(167,139,250,0.15)',
            }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: 'var(--devil)',
                letterSpacing: '0.15em',
                marginBottom: 6,
              }}>
                💡 COACH WHISPER — hover to reveal
              </div>
              <div className="coach-hint">
                {Array.isArray(coachHint) && coachHint.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {(coachHint as any[]).map((h, i) => (
                      <li key={i} className="coach-hint-text" style={{ marginBottom: 12 }}>
                        <strong style={{ color: 'var(--devil)' }}>Tip {i + 1}:</strong> {h.hint} <br />
                        <span style={{ opacity: 0.6, fontSize: '0.9em' }}>{h.strategy}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="coach-hint-text">
                    {typeof coachHint === 'string' ? coachHint : 'Loading coaching strategy...'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Opening message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '40px 20px' }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>{personaMeta.icon}</div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: personaMeta.color,
              marginBottom: 8,
            }}>
              {personaMeta.name}
            </div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              color: 'var(--text-4)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}>
              {personaMeta.tagline}
            </div>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: 'var(--text-3)',
              lineHeight: 1.6,
              maxWidth: 360,
              margin: '0 auto',
            }}>
              Make your opening argument. The debate begins with your first move. Choose your words carefully.
            </p>
          </motion.div>
        )}

        {/* Message list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                personaMeta={personaMeta}
                sideMeta={sideMeta}
                showFallacies={fallacyDetectorOn}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Debate over banner */}
        {isDebateOver && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 24,
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(52,211,153,0.08))',
              border: '1px solid rgba(129,140,248,0.2)',
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: 'var(--brand)',
              letterSpacing: '0.12em',
              marginBottom: 12,
            }}>
              DEBATE COMPLETE · {maxRounds} ROUNDS FINISHED
            </p>
            <button
              className="btn btn-primary"
              onClick={() => runJudge()}
              style={{ margin: '0 auto', display: 'flex', gap: 8 }}
            >
              REQUEST VERDICT
              <ChevronRight size={15} />
            </button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(16px)',
        flexShrink: 0,
      }}>
        {/* Mode indicator */}
        {mode === 'speed' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: 'var(--warn)',
            letterSpacing: '0.1em',
          }}>
            <Zap size={10} />
            SPEED MODE · Keep it concise
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}>
          <div style={{
            flex: 1,
            background: 'var(--surface)',
            border: `1px solid var(--border)`,
            borderRadius: 12,
            padding: '12px 16px',
            transition: 'border-color 0.2s',
          }}
            onFocus={() => { }}
          >
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isDebateOver ? 'Debate is over — request verdict above' : 'Make your argument...'}
              disabled={isDebateOver || isStreaming || isLoading}
              rows={2}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                lineHeight: 1.5,
                caretColor: sideMeta.color,
                resize: 'none',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6,
            }}>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: 'var(--text-4)',
              }}>
                {mode !== 'socratic' ? 'ENTER to send · SHIFT+ENTER for newline' : 'SOCRATIC MODE — respond to the AI\'s questions'}
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                color: charCount > 400 ? 'var(--against)' : 'var(--text-4)',
              }}>
                {charCount}/500
              </span>
            </div>
          </div>

          {/* Mic Button */}
          {(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition ? (
            <button
              onClick={toggleMic}
              disabled={isStreaming || isLoading || isDebateOver}
              title="Voice Typing"
              style={{
                width: 46, height: 46, flexShrink: 0, borderRadius: 12,
                background: isListening ? 'rgba(244,114,182,0.15)' : 'var(--surface)',
                border: isListening ? '1px solid var(--warn)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isListening ? 'var(--warn)' : 'var(--text-4)',
                transition: 'all 0.2s ease',
              }}
            >
              {isListening ? (
                <Mic size={16} />
              ) : (
                <MicOff size={16} />
              )}
            </button>
          ) : null}

          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: 46,
              height: 46,
              flexShrink: 0,
              borderRadius: 12,
              background: canSend ? sideMeta.color : 'var(--surface)',
              border: 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              color: canSend ? '#000' : 'var(--text-4)',
            }}
          >
            {isStreaming ? (
              <LoadingDots color={sideMeta.color} />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Message Bubble ────────────────────────────────────────────
function MessageBubble({
  message, personaMeta, sideMeta, showFallacies,
}: {
  message: DebateMessage
  personaMeta: { name: string; icon: string; color: string; tagline: string }
  sideMeta: { label: string; color: string }
  showFallacies: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Sender label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 5,
        fontFamily: "'Space Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.1em',
        color: 'var(--text-4)',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}>
        <span style={{
          color: isUser ? sideMeta.color : personaMeta.color,
          fontWeight: 700,
        }}>
          {isUser ? `YOU (${sideMeta.label})` : `${personaMeta.icon} ${personaMeta.name.toUpperCase()}`}
        </span>
        <span>· R{message.round}</span>
      </div>

      {/* Bubble */}
      <div
        className={isUser ? 'bubble bubble-user' : 'bubble bubble-ai'}
        style={{
          borderColor: isUser
            ? `color-mix(in srgb, ${sideMeta.color} 20%, transparent)`
            : 'var(--border)',
          position: 'relative',
        }}
      >
        {/* Streaming cursor */}
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          lineHeight: 1.65,
          color: isUser ? 'var(--text-1)' : 'var(--text-2)',
          whiteSpace: 'pre-wrap',
        }}>
          {message.text}
          {message.isStreaming && (
            <span style={{
              display: 'inline-block',
              width: '0.55em',
              height: '1em',
              background: personaMeta.color,
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              opacity: 0.8,
              animation: 'blink 1s step-start infinite',
            }} />
          )}
        </span>
      </div>

      {/* Fallacy badges */}
      {showFallacies && message.fallacies && message.fallacies.length > 0 && (
        <div style={{ maxWidth: '78%', marginTop: 4 }}>
          <FallacyList fallacies={message.fallacies} />
        </div>
      )}
    </motion.div>
  )
}
