// ═══════════════════════════════════════════════════════════════
// VoiceDebateArena — Immersive Voice Duel Mode
// Inspired by the OpenAI mobile app voice interface.
// Full-screen audio experience with animated visual states:
//   IDLE → LISTENING → THINKING → SPEAKING
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Mic, MicOff, Hand, Flag,
  ChevronRight,
} from 'lucide-react'
import { useDebateStore } from '../../store/debateStore'
import { useDebate } from '../../hooks/useDebate'
import type { DebateMessage } from '../../types'

// ─── Visual States ──────────────────────────────────────────────
type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'

const PERSONAS_META: Record<string, {
  name: string; icon: string; color: string; tagline: string
}> = {
  socrates:   { name: 'Socrates',   icon: '🏛', color: '#818CF8', tagline: 'The Questioner' },
  lawyer:     { name: 'Attorney',   icon: '⚖️', color: '#60A5FA', tagline: 'The Advocate' },
  scientist:  { name: 'Scientist',  icon: '🔬', color: '#34D399', tagline: 'The Empiricist' },
  journalist: { name: 'Journalist', icon: '📰', color: '#F472B6', tagline: 'The Contrarian' },
  kant:       { name: 'Kant',       icon: '📚', color: '#A78BFA', tagline: 'The Rationalist' },
}

const STATE_LABELS: Record<VoiceState, { text: string; color: string }> = {
  idle:      { text: 'TAP TO SPEAK',    color: 'var(--text-3)' },
  listening: { text: 'LISTENING…',       color: '#34D399' },
  thinking:  { text: 'THINKING…',        color: '#818CF8' },
  speaking:  { text: 'AI IS SPEAKING',   color: '#F472B6' },
}

// ────────────────────────────────────────────────────────────────
export default function VoiceDebateArena() {
  const {
    topic, messages, round, maxRounds, persona,
    userSide, isStreaming, isLoading, setScreen,
  } = useDebateStore()
  const { sendDebateMessage, runJudge } = useDebate()

  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [lastAiText, setLastAiText] = useState('')


  const recognitionRef = useRef<any>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const personaMeta = PERSONAS_META[persona]
  const isDebateOver = round >= maxRounds

  // Ref to track only the finalized (committed) portion of the transcript.
  // Interim results are displayed but never accumulated into this ref.
  const finalizedTextRef = useRef('')
  const sendRef = useRef(sendDebateMessage)
  sendRef.current = sendDebateMessage

  // ── Initialize SpeechRecognition ──────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      let newFinal = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          newFinal += t
        } else {
          interim += t
        }
      }

      // Commit any finalized text to the ref
      if (newFinal) {
        finalizedTextRef.current = (finalizedTextRef.current + ' ' + newFinal).trim()
      }

      // Display = finalized so far + current interim (interim is always replaced, never accumulated)
      const display = interim
        ? (finalizedTextRef.current + ' ' + interim).trim()
        : finalizedTextRef.current
      setTranscript(display)

      // Reset silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        // Auto-send after 2s of silence
        recognition.stop()
      }, 2000)
    }

    recognition.onerror = () => {
      setVoiceState('idle')
    }

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      // Auto-send if there's finalized text
      const text = finalizedTextRef.current.trim()
      if (text) {
        setVoiceState('thinking')
        finalizedTextRef.current = ''
        setTranscript('')
        sendRef.current(text)
      } else {
        setVoiceState(prev => (prev === 'listening' ? 'idle' : prev))
      }
    }

    recognitionRef.current = recognition
    return () => {
      try { recognition.stop() } catch {}
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }
  }, [])

  // ── Watch for AI messages completing → trigger speech ─────────
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'ai' && lastMsg.text && !lastMsg.isStreaming) {
        setLastAiText(lastMsg.text)
        speakAiResponse(lastMsg.text)
      }
    }
  }, [messages, isStreaming])

  // ── Watch for loading/streaming to show "Thinking" state ──────
  useEffect(() => {
    if (isLoading || isStreaming) {
      setVoiceState('thinking')
    }
  }, [isLoading, isStreaming])

  // ── Speak AI Response via SpeechSynthesis ─────────────────────
  const speakAiResponse = useCallback((text: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    // Try to pick a fitting voice
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const voiceMap: Record<string, string[]> = {
        socrates:   ['Google UK English Male', 'Daniel', 'en-GB'],
        lawyer:     ['Samantha', 'Google US English'],
        scientist:  ['Google UK English Female', 'Karen'],
        journalist: ['Tessa', 'Google US English'],
        kant:       ['Moira', 'en-IE'],
      }
      const prefs = voiceMap[persona] ?? []
      const match = voices.find(v => prefs.some(p => v.name.includes(p) || v.lang.includes(p)))
      if (match) utterance.voice = match
    }

    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => setVoiceState('speaking')
    utterance.onend = () => {
      utteranceRef.current = null
      const currentRound = useDebateStore.getState().round
      const maxR = useDebateStore.getState().maxRounds
      if (currentRound >= maxR) {
        // Last round done — let user read the response, then go to verdict
        setVoiceState('idle')
        setLastAiText(text) // keep showing
        setTimeout(() => runJudge(), 2500)
      } else if (recognitionRef.current) {
        // Auto-start listening for the next argument
        finalizedTextRef.current = ''
        setTranscript('')
        setVoiceState('listening')
        try { recognitionRef.current.start() } catch {}
      } else {
        setVoiceState('idle')
      }
    }
    utterance.onerror = () => {
      setVoiceState('idle')
      utteranceRef.current = null
    }

    window.speechSynthesis.speak(utterance)
  }, [persona])

  // ── Interrupt AI Speech ───────────────────────────────────────
  const interruptAI = useCallback(() => {
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    setVoiceState('idle')
  }, [])

  // ── Start Listening ───────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isDebateOver) return
    interruptAI() // Stop any AI speech
    finalizedTextRef.current = ''
    setTranscript('')
    setVoiceState('listening')
    try {
      recognitionRef.current.start()
    } catch {
      // Already started
    }
  }, [isDebateOver, interruptAI])

  // ── Stop Listening & Send ─────────────────────────────────────
  const stopAndSend = useCallback(async () => {
    try { recognitionRef.current?.stop() } catch {}
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

    // Use the finalized ref as the source of truth (most reliable text)
    const text = (finalizedTextRef.current || transcript).trim()
    if (!text || isDebateOver) {
      setVoiceState('idle')
      return
    }
    setVoiceState('thinking')
    finalizedTextRef.current = ''
    setTranscript('')
    await sendDebateMessage(text)
  }, [transcript, isDebateOver, sendDebateMessage])

  // ── Handle main area tap/click ────────────────────────────────
  const handleCanvasClick = useCallback(() => {
    if (isDebateOver) return
    if (voiceState === 'speaking') {
      interruptAI()
    } else if (voiceState === 'listening') {
      stopAndSend()
    } else if (voiceState === 'idle') {
      startListening()
    }
  }, [voiceState, isDebateOver, interruptAI, stopAndSend, startListening])

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      try { recognitionRef.current?.stop() } catch {}
    }
  }, [])

  // ── Go Back ───────────────────────────────────────────────────
  const handleBack = () => {
    window.speechSynthesis.cancel()
    try { recognitionRef.current?.stop() } catch {}
    setScreen('sideselect')
  }

  const stateInfo = STATE_LABELS[voiceState]

  return (
    <div className="voice-arena" style={{
      position: 'relative',
      zIndex: 10,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(6,6,6,1) 0%, #000 100%)',
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        flexShrink: 0,
        zIndex: 20,
      }}>
        <button className="nav-back" onClick={handleBack} style={{ position: 'static', padding: 0 }}>
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

        {/* Verdict / Controls */}
        <div style={{ display: 'flex', gap: 6 }}>
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
        textAlign: 'center',
        flexShrink: 0,
        zIndex: 20,
      }}>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: 'var(--text-4)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          VOICE DUEL · VS {personaMeta.icon} {personaMeta.name.toUpperCase()}
        </span>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: 'var(--text-3)',
          marginTop: 4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 500,
          margin: '4px auto 0',
        }}>
          "{topic}"
        </div>
      </div>

      {/* ── Main Interactive Area ── */}
      <div
        onClick={handleCanvasClick}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDebateOver ? 'default' : 'pointer',
          userSelect: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow behind the orb */}
        <div className="voice-arena-glow" style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${
            voiceState === 'listening' ? 'rgba(52,211,153,0.12)' :
            voiceState === 'thinking' ? 'rgba(129,140,248,0.12)' :
            voiceState === 'speaking' ? 'rgba(244,114,182,0.12)' :
            'rgba(255,255,255,0.03)'
          } 0%, transparent 70%)`,
          transition: 'background 0.6s ease',
          pointerEvents: 'none',
        }} />

        {/* ─── Central Orb ─── */}
        <motion.div
          animate={{
            scale: voiceState === 'listening' ? [1, 1.08, 1] :
                   voiceState === 'thinking' ? [1, 1.03, 1] :
                   voiceState === 'speaking' ? [1, 1.12, 0.95, 1.08, 1] :
                   1,
          }}
          transition={{
            duration: voiceState === 'speaking' ? 1.8 :
                      voiceState === 'listening' ? 1.5 :
                      voiceState === 'thinking' ? 2.0 : 0.3,
            repeat: voiceState === 'idle' ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'relative',
            zIndex: 5,
          }}
        >
          <div className={`voice-orb voice-orb-${voiceState}`}>
            {/* Inner ring */}
            <div className={`voice-orb-inner voice-orb-inner-${voiceState}`}>
              {voiceState === 'idle' && (
                <Mic size={32} style={{ color: 'var(--text-3)', opacity: 0.6 }} />
              )}
              {voiceState === 'listening' && (
                <Mic size={32} style={{ color: '#34D399' }} />
              )}
              {voiceState === 'thinking' && (
                <div className="voice-thinking-dots">
                  <span /><span /><span />
                </div>
              )}
              {voiceState === 'speaking' && (
                <div className="voice-speaking-bars">
                  <span /><span /><span /><span /><span />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── State Label ─── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={voiceState}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              marginTop: 28,
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.2em',
              color: stateInfo.color,
              textTransform: 'uppercase',
              zIndex: 5,
            }}
          >
            {stateInfo.text}
          </motion.div>
        </AnimatePresence>

        {/* ─── Hint Text ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 12,
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: 'var(--text-4)',
            zIndex: 5,
          }}
        >
          {voiceState === 'idle' && !isDebateOver && 'Tap the orb to start speaking'}
          {voiceState === 'listening' && 'Tap to send your argument'}
          {voiceState === 'speaking' && 'Tap to interrupt'}
          {voiceState === 'thinking' && 'Processing your argument…'}
          {isDebateOver && 'Debate complete'}
        </motion.div>

        {/* ─── Live Transcript ─── */}
        {(
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 24,
            right: 24,
            maxHeight: 160,
            overflowY: 'auto',
            zIndex: 10,
          }}>
            <AnimatePresence>
              {/* Show user transcript while listening */}
              {voiceState === 'listening' && transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    borderRadius: 12,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    color: '#34D399',
                    letterSpacing: '0.1em',
                    display: 'block',
                    marginBottom: 4,
                  }}>
                    YOU
                  </span>
                  {transcript}
                  <span className="voice-cursor" />
                </motion.div>
              )}

              {/* Show last AI response */}
              {(voiceState === 'speaking' || voiceState === 'idle') && lastAiText && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${personaMeta.color}33`,
                    borderRadius: 12,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: 'var(--text-3)',
                    lineHeight: 1.5,
                    maxHeight: 120,
                    overflowY: 'auto',
                  }}
                >
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    color: personaMeta.color,
                    letterSpacing: '0.1em',
                    display: 'block',
                    marginBottom: 4,
                  }}>
                    {personaMeta.icon} {personaMeta.name.toUpperCase()}
                  </span>
                  {lastAiText.length > 200 ? lastAiText.slice(0, 200) + '…' : lastAiText}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Bottom Controls ── */}
      <div style={{
        padding: '16px 24px 28px',
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        flexShrink: 0,
        zIndex: 20,
      }}>
        {/* Mic button (secondary) */}
        {voiceState === 'listening' ? (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={(e) => { e.stopPropagation(); stopAndSend() }}
            className="voice-btn voice-btn-send"
            title="Send argument"
          >
            <ChevronRight size={20} />
            <span>SEND</span>
          </motion.button>
        ) : voiceState === 'speaking' ? (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={(e) => { e.stopPropagation(); interruptAI() }}
            className="voice-btn voice-btn-interrupt"
            title="Interrupt AI"
          >
            <Hand size={18} />
            <span>INTERRUPT</span>
          </motion.button>
        ) : voiceState === 'idle' && !isDebateOver ? (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={(e) => { e.stopPropagation(); startListening() }}
            className="voice-btn voice-btn-mic"
            title="Start speaking"
          >
            <Mic size={20} />
            <span>SPEAK</span>
          </motion.button>
        ) : isDebateOver ? (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => runJudge()}
            className="voice-btn voice-btn-verdict"
            title="Request verdict"
          >
            <Flag size={18} />
            <span>REQUEST VERDICT</span>
          </motion.button>
        ) : null}
      </div>
    </div>
  )
}
