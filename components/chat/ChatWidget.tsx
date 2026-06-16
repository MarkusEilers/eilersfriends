'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

const ACCENT = '#1A5FD4'

type Msg = { role: 'user' | 'assistant'; content: string }

const GREETING: Msg = {
  role: 'assistant',
  content:
    'Hey! Ich bin der Assistent von Eilers+Friends. Frag mich alles zur SalesMade Academy, zum AI Intensive oder dazu, wie wir Vertrieb planbar machen — oder ich verbinde Dich direkt mit Markus und dem Team. Was beschäftigt Dich gerade?',
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter((m) => m.role !== 'assistant' || m !== GREETING) }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || 'Hm, da ging gerade etwas schief. Magst Du es nochmal versuchen?' }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Verbindung gerade nicht möglich. Schreib uns sonst direkt: team@eilersfriends.com' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat öffnen"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105"
          style={{ backgroundColor: ACCENT }}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(560px,80vh)] w-[min(380px,92vw)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: ACCENT }}>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <MessageCircle size={15} />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold">Eilers+Friends</p>
                <p className="text-[10px] opacity-80">Assistent · meist in Minuten</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Chat schließen" className="rounded-md p-1 hover:bg-white/15">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ' +
                    (m.role === 'user' ? 'text-white' : 'border border-gray-200 bg-white text-gray-800')
                  }
                  style={m.role === 'user' ? { backgroundColor: ACCENT } : undefined}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Escalation hint */}
          <a href="/kontakt" className="border-t border-gray-100 bg-white px-4 py-2 text-center text-[11px] font-medium hover:underline" style={{ color: ACCENT }}>
            Lieber direkt mit dem Team sprechen? →
          </a>

          {/* Input */}
          <div className="flex items-end gap-2 border-t border-gray-200 bg-white p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Schreib uns…"
              rows={1}
              className="max-h-28 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Senden"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40"
              style={{ backgroundColor: ACCENT }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
