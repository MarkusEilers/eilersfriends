'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { X, Send, Loader2, ArrowRight } from 'lucide-react'
import { efTrack } from '@/components/analytics/visitor'

const ACCENT = '#1A5FD4'

type Msg = { role: 'user' | 'assistant'; content: string }

type Lang = 'de' | 'en' | 'es'
const AVATAR = '/eili/eili.jpg'

/** Eili — die KI-Assistentin von Eilers+Friends. Texte je Sprache. */
const TX: Record<Lang, {
  greeting: string; role: string; open: string; close: string; placeholder: string; human: string; send: string
  error: string; offline: string; nudges: Record<string, string>; nudgeCtx: (s: string) => string; dismiss: string
}> = {
  de: {
    greeting: 'Hey, ich bin Eili, die KI-Assistentin von Eilers+Friends. Frag mich alles zum Mystery Shopping, zur SalesMade Academy oder dazu, wie Vertrieb planbar wird. Oder ich verbinde Dich direkt mit Markus und dem Team. Was beschäftigt Dich gerade?',
    role: 'KI-Assistentin · Eilers+Friends', open: 'Chat mit Eili öffnen', close: 'Chat schließen', placeholder: 'Schreib Eili…',
    human: 'Lieber direkt mit dem Team sprechen? →', send: 'Senden',
    error: 'Hm, da ging gerade etwas schief. Magst Du es nochmal versuchen?', offline: 'Verbindung gerade nicht möglich. Schreib uns sonst direkt: team@eilersfriends.com',
    nudges: {
      a: 'Hey, danke, dass Du Dich umsiehst. Wie kann ich Dich am besten unterstützen?',
      b: 'Hey, ich bin Eili. Was suchst Du?',
      c: 'Hey! Mit welcher Frage bist Du hier?',
    },
    nudgeCtx: (s) => `Du schaust Dir gerade „${s}“ an. Soll ich Dir dazu etwas erklären?`, dismiss: 'Hinweis schließen',
  },
  en: {
    greeting: "Hey, I'm Eili, the AI assistant at Eilers+Friends. Ask me anything about Mystery Shopping, the SalesMade Academy or how to make sales predictable. Or I'll connect you straight to Markus and the team. What's on your mind?",
    role: 'AI assistant · Eilers+Friends', open: 'Open chat with Eili', close: 'Close chat', placeholder: 'Write to Eili…',
    human: 'Rather talk to the team directly? →', send: 'Send',
    error: 'Hm, something went wrong. Would you try again?', offline: "Can't connect right now. Write to us directly: team@eilersfriends.com",
    nudges: {
      a: 'Hey, thanks for looking around. How can I best help you?',
      b: "Hey, I'm Eili. What are you looking for?",
      c: 'Hey! What question brought you here?',
    },
    nudgeCtx: (s) => `You're looking at "${s}". Want me to explain anything about it?`, dismiss: 'Close hint',
  },
  es: {
    greeting: 'Hola, soy Eili, la asistente de IA de Eilers+Friends. Pregúntame lo que quieras sobre Mystery Shopping, la SalesMade Academy o cómo hacer las ventas previsibles. O te pongo en contacto directamente con Markus y el equipo. ¿Qué te preocupa ahora mismo?',
    role: 'Asistente de IA · Eilers+Friends', open: 'Abrir chat con Eili', close: 'Cerrar chat', placeholder: 'Escribe a Eili…',
    human: '¿Prefieres hablar directamente con el equipo? →', send: 'Enviar',
    error: 'Vaya, algo ha fallado. ¿Lo intentas otra vez?', offline: 'Ahora mismo no hay conexión. Escríbenos directamente: team@eilersfriends.com',
    nudges: {
      a: 'Hola, gracias por echar un vistazo. ¿Cómo puedo ayudarte mejor?',
      b: 'Hola, soy Eili. ¿Qué estás buscando?',
      c: '¡Hola! ¿Con qué pregunta has llegado aquí?',
    },
    nudgeCtx: (s) => `Estás viendo «${s}». ¿Quieres que te explique algo sobre esto?`, dismiss: 'Cerrar aviso',
  },
}

/** Proaktiver Hinweis: nicht dort, wo Leute gerade etwas ausfüllen oder arbeiten. */
const NO_NUDGE = /^\/(?:(?:en|es)\/)?(admin|dashboard|clients|checkout|auth|schedule|termin|protokoll|offer)(\/|$)/

/** Abschnitt, den sich jemand gerade ansieht: größte sichtbare Sektion, benannt nach ihrer Überschrift. */
function useDwell(pathname: string) {
  const dwell = useRef<Map<string, number>>(new Map())
  const current = useRef<string | null>(null)
  useEffect(() => {
    dwell.current = new Map(); current.current = null
    const label = (el: Element) => {
      const h = el.querySelector('h1,h2,h3')
      const t = (h?.textContent ?? '').replace(/\s+/g, ' ').trim()
      return t ? t.replace(/[.:!]+$/, '').slice(0, 90) : null
    }
    // Jede Sekunde: welche Sektion nimmt gerade die meiste Fläche im Bildschirm ein?
    const pick = () => {
      const vh = window.innerHeight
      let best: Element | null = null, max = 0
      document.querySelectorAll('main section, main [data-section], .acd section, .sb .wrap.sec').forEach((el) => {
        const r = el.getBoundingClientRect()
        const v = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
        if (v > max && label(el)) { max = v; best = el }
      })
      current.current = best ? label(best) : null
    }
    pick()
    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      pick()
      if (!current.current) return
      dwell.current.set(current.current, (dwell.current.get(current.current) ?? 0) + 1)
    }, 1000)
    const flush = () => {
      const top = [...dwell.current.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      if (top.length && top.reduce((n, [, v]) => n + v, 0) >= 8) efTrack('page_dwell', pathname, { sections: top.map(([s, v]) => ({ s, sec: v })) })
      dwell.current = new Map()
    }
    const onHide = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => { flush(); clearInterval(tick); document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', flush) }
  }, [pathname])
  return current
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
        <span className="absolute right-3 top-3 flex h-14 w-14 rotate-[8deg] flex-col items-center justify-center rounded-full text-lg font-bold shadow-lg" style={{ backgroundColor: '#1A5FD4', boxShadow: 'inset 0 0 0 3px #1A5FD4, inset 0 0 0 4px rgba(255,255,255,.5)' }}>1 €</span>
        <span className="absolute right-14 top-2 flex h-11 w-11 -rotate-12 items-center justify-center rounded-full text-[11px] font-bold text-white line-through shadow" style={{ backgroundColor: '#EB0028' }}>997 €</span>
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
  const pathname = usePathname() || '/'
  const lang: Lang = (pathname.match(/^\/(en|es)(\/|$)/)?.[1] as Lang) ?? 'de'
  const T = TX[lang]
  const greeting: Msg = { role: 'assistant', content: T.greeting }
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([greeting])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [nudge, setNudge] = useState<{ variant: string; text: string } | null>(null)
  const nudgeRef = useRef<{ variant: string; text: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const section = useDwell(pathname)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, open])

  // Begrüßung in der Sprache der Seite, solange noch nichts geschrieben wurde
  useEffect(() => {
    setMessages((m) => (m.length === 1 && m[0].role === 'assistant' && !nudgeRef.current ? [{ role: 'assistant', content: T.greeting }] : m))
  }, [T.greeting])

  // Proaktiver Hinweis: nach 30 oder 40 Sekunden ohne Klick, einmal pro Sitzung, Variante je Besucher fest
  useEffect(() => {
    if (open || NO_NUDGE.test(pathname)) return
    let shown = false
    try { shown = sessionStorage.getItem('ef_nudge_shown') === '1' } catch { /* privat */ }
    if (shown) return
    let v = ''
    try { v = sessionStorage.getItem('ef_nudge_v') ?? '' } catch { /* privat */ }
    if (!v) {
      const variants = ['a30', 'a40', 'b30', 'b40', 'c30', 'c40', 'ctx30', 'ctx40']
      v = variants[Math.floor(Math.random() * variants.length)]
      try { sessionStorage.setItem('ef_nudge_v', v) } catch { /* privat */ }
    }
    const delay = (v.endsWith('40') ? 40 : 30) * 1000
    let timer: ReturnType<typeof setTimeout>
    const arm = () => { clearTimeout(timer); timer = setTimeout(fire, delay) }
    const fire = () => {
      if (document.visibilityState !== 'visible') return arm()
      const key = v.replace(/\d+$/, '')
      const sec = section.current
      const text = key === 'ctx' && sec ? T.nudgeCtx(sec) : T.nudges[key === 'ctx' ? 'a' : key]
      const n = { variant: v + (key === 'ctx' && !sec ? '-fallback' : ''), text }
      nudgeRef.current = n
      setNudge(n)
      try { sessionStorage.setItem('ef_nudge_shown', '1') } catch { /* privat */ }
      efTrack('chat_nudge', `shown:${n.variant}`, { path: pathname, section: sec, lang })
    }
    const onClick = () => arm()
    document.addEventListener('click', onClick, true)
    arm()
    return () => { clearTimeout(timer); document.removeEventListener('click', onClick, true) }
  }, [pathname, open, lang, T, section])

  function openChat(fromNudge = false) {
    if (fromNudge && nudgeRef.current) {
      setMessages((m) => (m.length <= 1 ? [{ role: 'assistant', content: nudgeRef.current!.text }] : m))
      efTrack('chat_nudge', `opened:${nudgeRef.current.variant}`, { path: pathname })
    }
    setNudge(null)
    setOpen(true)
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    const first = next.filter((m) => m.role === 'user').length === 1
    efTrack('chat_message', first ? 'first' : 'next', { path: pathname, nudge: nudgeRef.current?.variant ?? null })
    if (first && nudgeRef.current) efTrack('chat_nudge', `replied:${nudgeRef.current.variant}`, { path: pathname })
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.filter((m, i) => !(i === 0 && m.role === 'assistant')),
          context: { path: pathname, section: section.current, lang, opener: messages[0]?.role === 'assistant' ? messages[0].content : null },
        }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || T.error }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: T.offline }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Proaktiver Hinweis */}
      {!open && nudge && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(300px,85vw)]">
          <div className="relative rounded-2xl border border-gray-200 bg-white p-3.5 pr-8 shadow-xl">
            <button type="button" onClick={() => { efTrack('chat_nudge', `dismissed:${nudge.variant}`, { path: pathname }); setNudge(null) }} aria-label={T.dismiss} className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-gray-100">
              <X size={14} />
            </button>
            <button type="button" onClick={() => openChat(true)} className="flex items-start gap-2.5 text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={AVATAR} alt="Eili" className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
              <span className="text-sm leading-snug text-gray-800">{nudge.text}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => openChat(!!nudge)}
          aria-label={T.open}
          className="fixed bottom-5 right-5 z-50 h-14 w-14 overflow-hidden rounded-full shadow-xl ring-2 ring-white transition-transform hover:scale-105"
          style={{ backgroundColor: ACCENT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AVATAR} alt="Eili" className="h-full w-full object-cover" />
          <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(560px,80vh)] w-[min(380px,92vw)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: ACCENT }}>
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={AVATAR} alt="Eili" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/40" />
              <div className="leading-tight">
                <p className="text-sm font-bold">Eili</p>
                <p className="text-[10px] opacity-80">{T.role}</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={T.close} className="rounded-md p-1 hover:bg-white/15">
              <X size={18} />
            </button>
          </div>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
            {messages.map((m, i) => (
              <div key={i}>
              <div className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                {m.role === 'assistant' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={AVATAR} alt="" className="mr-2 mt-0.5 h-6 w-6 flex-shrink-0 rounded-full object-cover" />
                )}
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
          <a href={lang === 'de' ? '/kontakt' : `/${lang}/kontakt`} className="border-t border-gray-100 bg-white px-4 py-2 text-center text-[11px] font-medium hover:underline" style={{ color: ACCENT }}>
            {T.human}
          </a>

          {/* Input */}
          <div className="flex items-end gap-2 border-t border-gray-200 bg-white p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={T.placeholder}
              rows={1}
              className="max-h-28 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label={T.send}
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
