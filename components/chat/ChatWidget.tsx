'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { MessageCircle, X, Send, Loader2, ArrowRight } from 'lucide-react'

const ACCENT = '#1A5FD4'

type Msg = { role: 'user' | 'assistant'; content: string }

const GREETING: Msg = {
  role: 'assistant',
  content:
    'Hey! Ich bin der Assistent von Eilers+Friends. Frag mich alles zum Mystery Shopping, zur SalesMade Academy oder dazu, wie wir Vertrieb planbar machen — oder ich verbinde Dich direkt mit Markus und dem Team. Was beschäftigt Dich gerade?',
}

function renderRich(text: string): ReactNode {
  const nodes: ReactNode[] = []
  // Reihenfolge: [Text](href) | **fett** | https-URL | E-Mail | interner /pfad
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|(https?:\/\/[^\s)]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})|(\/[A-Za-z0-9][A-Za-z0-9/_-]*)/g
  let last = 0, k = 0, m: RegExpExecArray | null
  const linkCls = 'font-medium underline'
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      const href = m[2]
      nodes.push(<a key={k++} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={linkCls} style={{ color: ACCENT }}>{m[1]}</a>)
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={k++}>{m[3]}</strong>)
    } else if (m[4] !== undefined) {
      nodes.push(<a key={k++} href={m[4]} target="_blank" rel="noopener noreferrer" className={linkCls} style={{ color: ACCENT }}>{m[4]}</a>)
    } else if (m[5] !== undefined) {
      nodes.push(<a key={k++} href={`mailto:${m[5]}`} className={linkCls} style={{ color: ACCENT }}>{m[5]}</a>)
    } else if (m[6] !== undefined) {
      nodes.push(<a key={k++} href={m[6]} className={linkCls} style={{ color: ACCENT }}>{m[6]}</a>)
    }
    last = re.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/* ── Karten, die der Assistent mit [[card:…]] ausspielen kann ─────────────── */
const CARD_RE = /\[\[card:([^\]]+)\]\]/g

function splitCards(text: string): { text: string; cards: string[] } {
  const cards: string[] = []
  const clean = text.replace(CARD_RE, (_, c: string) => { cards.push(c.trim()); return '' }).trim()
  return { text: clean, cards: cards.slice(0, 1) }
}

function MysteryCard() {
  const [a, setA] = useState<{ free: number; capacity: number; soldOut: boolean; nextOpens: string } | null>(null)
  useEffect(() => { fetch('/api/mystery-shopping/availability').then((r) => r.json()).then(setA).catch(() => {}) }, [])
  const sold = a ? a.capacity - a.free : 0
  return (
    <a href="/mystery-shopping" className="block overflow-hidden rounded-2xl text-white no-underline shadow-md transition-transform hover:-translate-y-0.5" style={{ backgroundColor: '#0E1733' }}>
      <div className="relative h-24 bg-cover bg-center" style={{ backgroundImage: 'url(/mystery/hero.jpg)' }}>
        <span className="absolute right-3 top-3 flex h-14 w-14 rotate-[8deg] flex-col items-center justify-center rounded-full text-lg font-bold shadow-lg" style={{ backgroundColor: '#16A34A' }}>1 €</span>
        <span className="absolute right-14 top-2 flex h-11 w-11 -rotate-12 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#EB0028] line-through shadow">997 €</span>
      </div>
      <div className="p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6FA3FF' }}>Mystery Shopping</p>
        <p className="mt-1 text-sm font-bold leading-snug">In welcher Liga spielt Euer Vertriebsteam?</p>
        <p className="mt-1 text-xs text-white/70">1 Gespräch als imaginärer Kunde · 14 Seiten Report · 1 Skill, sofort besser</p>
        {a && (
          <div className="mt-2.5">
            <p className="text-[11px] text-white/80">{a.soldOut ? `Ausgebucht · nächster Durchgang ab ${a.nextOpens}` : `Nur noch ${a.free} von ${a.capacity} frei`}</p>
            <div className="mt-1 flex gap-[3px]">{Array.from({ length: a.capacity }, (_, i) => <i key={i} className="block h-2 w-2 rounded-full" style={{ background: i < sold ? '#fff' : 'transparent', boxShadow: i < sold ? undefined : 'inset 0 0 0 1.5px #fff' }} />)}</div>
          </div>
        )}
        <span className="mt-3 flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-xs font-bold" style={{ backgroundColor: '#2563FF' }}>Jetzt Mystery Shopping buchen <ArrowRight size={13} /></span>
      </div>
    </a>
  )
}

function SimpleCard({ href, eyebrow, title, text, cta, bg, fg = '#0D0D0B', accent = ACCENT }: { href: string; eyebrow: string; title: string; text: string; cta: string; bg: string; fg?: string; accent?: string }) {
  return (
    <a href={href} className="block rounded-2xl p-3.5 no-underline shadow-sm transition-transform hover:-translate-y-0.5" style={{ background: bg, color: fg }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>{eyebrow}</p>
      <p className="mt-1 text-sm font-bold leading-snug">{title}</p>
      <p className="mt-1 text-xs opacity-75">{text}</p>
      <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold" style={{ color: accent }}>{cta} <ArrowRight size={13} /></span>
    </a>
  )
}

function ChatCard({ spec }: { spec: string }) {
  const [kind, ...args] = spec.split('|').map((x) => x.trim())
  switch (kind) {
    case 'mystery-shopping': return <MysteryCard />
    case 'academy': return <SimpleCard href="/academy" eyebrow="SalesMade Academy · Nur 30 Plätze" title="Nächster Flight: 20. November" text="12 Monate Ausbildung, die Euer Team auf das Niveau von Ausnahme-Verkäufern bringt." cta="Platz sichern" bg="linear-gradient(135deg,#EBF1FF,#BBCFF5)" />
    case 'gespraechs-check': return <SimpleCard href="/gespraechs-check" eyebrow="Gesprächs-Check · kostenlos" title="Wo ist Dein letztes Erstgespräch gekippt?" text="Transkript hochladen, Auswertung in unter 5 Minuten." cta="Gespräch auswerten" bg="#0F1E3A" fg="#fff" accent="#93B8F5" />
    case 'frameworks': return <SimpleCard href="/frameworks" eyebrow="Frameworks · kostenlos" title="Klaut unsere Frameworks" text="Beef Radar, Unwiderstehliche B2B-Angebote und mehr — mit AI-Agenten." cta="Zu den Frameworks" bg="#F4F4F2" />
    case 'booking': {
      const url = args[0] && /^(https:\/\/(www\.)?eilersfriends\.com)?\/schedule\//.test(args[0]) ? args[0] : '/schedule'
      return <SimpleCard href={url} eyebrow="Termin" title={`Gespräch mit ${args[1] || 'dem Team'} buchen`} text="Freien Slot wählen, die Einladung kommt per Teams." cta="Zum Kalender" bg="#fff" />
    }
    default: return null
  }
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
              <div key={i}>
              <div className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ' +
                    (m.role === 'user' ? 'text-white' : 'border border-gray-200 bg-white text-gray-800')
                  }
                  style={m.role === 'user' ? { backgroundColor: ACCENT } : undefined}
                >
                  {m.role === 'assistant' ? renderRich(splitCards(m.content).text) : m.content}
                </div>
              </div>
              {m.role === 'assistant' && splitCards(m.content).cards.map((c, j) => (
                <div key={j} className="mt-2 max-w-[85%]"><ChatCard spec={c} /></div>
              ))}
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
