// ═══════════════════════════════════════════════════════════════
// ApiKeyModal — User-provided Featherless AI API key config
// Stored in localStorage, sent as X-Featherless-Key header
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Key, CheckCircle, ExternalLink, Eye, EyeOff, Trash2, Zap, Map } from 'lucide-react'
import { useDebateStore } from '../../store/debateStore'

interface ApiKeyModalProps {
  open: boolean
  onClose: () => void
  currentKey: string
  onSave: (key: string, n8n: string, miro: string) => void
}

export default function ApiKeyModal({ open, onClose, currentKey, onSave }: ApiKeyModalProps) {
  const { n8nUrl: storeN8n, miroToken: storeMiro } = useDebateStore()
  const [inputKey, setInputKey] = useState(currentKey)
  const [inputN8n, setInputN8n] = useState(storeN8n)
  const [inputMiro, setInputMiro] = useState(storeMiro)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  // Sync with parent key when modal opens
  useEffect(() => {
    if (open) {
      setInputKey(currentKey)
      setInputN8n(storeN8n)
      setInputMiro(storeMiro)
      setSaved(false)
    }
  }, [open, currentKey, storeN8n, storeMiro])

  const handleSave = () => {
    onSave(inputKey.trim(), inputN8n.trim(), inputMiro.trim())
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 900)
  }

  const handleClear = () => {
    setInputKey('')
    setInputN8n('')
    setInputMiro('')
    onSave('', '', '')
  }

  const maskedKey = inputKey
    ? inputKey.slice(0, 8) + '•'.repeat(Math.max(0, inputKey.length - 12)) + inputKey.slice(-4)
    : ''

  const isValid = inputKey.trim().length > 10

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 100,
            }}
          />

          {/* Modal centering wrapper — flex-based so framer-motion transforms don't conflict */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 101,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              width: 'min(480px, calc(100vw - 32px))',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: '#0A0A0A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '28px 28px 24px',
              boxShadow: '0 0 60px rgba(129,140,248,0.1), 0 24px 80px rgba(0,0,0,0.8)',
              pointerEvents: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(129,140,248,0.12)',
                    border: '1px solid rgba(129,140,248,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Key size={15} color="#818CF8" />
                  </div>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#fff',
                  }}>
                    API Key
                  </span>
                </div>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  Your key is stored in your browser only — never sent to our servers.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', padding: 4, flexShrink: 0,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Featherless AI section */}
            <div style={{
              padding: '16px 18px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              marginBottom: 16,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🪶</span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: '0.08em',
                  }}>
                    FEATHERLESS AI
                  </span>
                  {currentKey && (
                    <span style={{
                      padding: '2px 8px',
                      background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      borderRadius: 4,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      color: '#34D399',
                      letterSpacing: '0.05em',
                    }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <a
                  href="https://featherless.ai/onboarding?returnTo=/account"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    color: '#818CF8',
                    textDecoration: 'none',
                    letterSpacing: '0.08em',
                    opacity: 0.8,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
                >
                  GET FREE KEY <ExternalLink size={10} />
                </a>
              </div>

              {/* Key input */}
              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder="Paste your Featherless API key..."
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    width: '100%',
                    padding: '11px 44px 11px 14px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isValid && inputKey ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 8,
                    color: '#fff',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    outline: 'none',
                    letterSpacing: '0.04em',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = isValid && inputKey ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)')}
                />
                <button
                  onClick={() => setShowKey(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.3)',
                    padding: 0,
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                color: 'rgba(255,255,255,0.25)',
                margin: '8px 0 0',
                lineHeight: 1.4,
              }}>
                4,300+ open-source models · Flat-rate pricing · OpenAI-compatible
              </p>
            </div>

            {/* n8n section */}
            <div style={{
              padding: '16px 18px',
              background: 'rgba(255,100,0,0.02)',
              border: '1px solid rgba(255,100,0,0.1)',
              borderRadius: 12,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Zap size={15} color="#FF6400" />
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.08em',
                }}>
                  N8N WEBHOOK URL
                </span>
                {storeN8n && (
                  <span style={{
                    padding: '2px 8px',
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.25)',
                    borderRadius: 4,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    color: '#34D399',
                    letterSpacing: '0.05em',
                  }}>ACTIVE</span>
                )}
              </div>
              <input
                type="text"
                value={inputN8n}
                onChange={e => setInputN8n(e.target.value)}
                placeholder="https://youri.app.n8n.cloud/webhook/..."
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                  outline: 'none',
                  letterSpacing: '0.04em',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Miro section */}
            <div style={{
              padding: '16px 18px',
              background: 'rgba(255,215,0,0.02)',
              border: '1px solid rgba(255,215,0,0.1)',
              borderRadius: 12,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Map size={15} color="#FFD700" />
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.08em',
                }}>
                  MIRO ACCESS TOKEN
                </span>
                {storeMiro && (
                  <span style={{
                    padding: '2px 8px',
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.25)',
                    borderRadius: 4,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    color: '#34D399',
                    letterSpacing: '0.05em',
                  }}>ACTIVE</span>
                )}
              </div>
              <input
                type="password"
                value={inputMiro}
                onChange={e => setInputMiro(e.target.value)}
                placeholder="eyJhbG..."
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                  outline: 'none',
                  letterSpacing: '0.04em',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* How it works */}
            <div style={{
              padding: '12px 14px',
              background: 'rgba(129,140,248,0.04)',
              border: '1px solid rgba(129,140,248,0.1)',
              borderRadius: 8,
              marginBottom: 20,
            }}>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                margin: 0,
                lineHeight: 1.5,
              }}>
                <span style={{ color: '#818CF8', fontWeight: 600 }}>How it works:</span>{' '}
                Your key is sent with each API request so all AI calls run on your Featherless account.
                Without a key, the app runs in demo mode with pre-written responses.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              {currentKey && (
                <button
                  onClick={handleClear}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 14px',
                    background: 'none',
                    border: '1px solid rgba(244,114,182,0.2)',
                    borderRadius: 8,
                    color: 'rgba(244,114,182,0.6)',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(244,114,182,0.4)'
                    e.currentTarget.style.color = '#F472B6'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(244,114,182,0.2)'
                    e.currentTarget.style.color = 'rgba(244,114,182,0.6)'
                  }}
                >
                  <Trash2 size={12} /> CLEAR
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 20px',
                  background: saved
                    ? 'rgba(52,211,153,0.15)'
                    : 'rgba(255,255,255,0.08)',
                  border: saved ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  color: saved ? '#34D399' : '#fff',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {saved ? (
                  <><CheckCircle size={13} /> SAVED</>
                ) : (
                  'SAVE CONFIG'
                )}
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
