'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, ArrowUp, Loader2, FileText, LayoutGrid, Compass } from 'lucide-react'
import { efTrack } from '@/components/analytics/visitor'
import { renderRich, splitCards, ChatCard } from '@/components/chat/ChatWidget'

type Lang = 'de' | 'en' | 'es'
type Msg = { role: 'user' | 'assistant'; content: string }
type Result = { kind: 'page' | 'framework' | 'blog'; href: string; title: string; text: string; image: string | null }

const AVATAR = '/eili/eili.jpg'
const BLUE = '#1A5FD4'

const TX: Record<Lang, {
  eyebrow: string; title: string; titleWith: (t: string) => string; lead: string
  hello: (name: string | null) => string; ctxPath: (words: string) => string; ctxRef: (from: string) => string; ctxNone: string; ask: string
  placeholder: string; send: string; chips: string[]; chipSearch: (w: string) => string
  meant: string; results: string; resultsFor: (q: string) => string; kinds: Record<Result['kind'], string>; thinking: string; error: string; home: string; open: string
}> = {
  de: {
    eyebrow: '404 · Seite nicht gefunden', title: 'Diese Seite gibt es nicht. Eily findet, was Du suchst.',
    titleWith: (t) => `Hier ist nichts. Aber „${t}“ finden wir.`,
    lead: 'Wir benennen Dinge gern um, bevor sie fertig sind. Vielleicht war der Link alt, vielleicht war es eine Idee, die wir verworfen haben. Frag einfach.',
    hello: (n) => (n ? `Hey ${n}, ` : 'Hey, '),
    ctxPath: (w) => `die Adresse gibt es so nicht. Klingt, als suchst Du etwas zu „${w}“. Unten stehen die Seiten, die am besten passen. Oder frag mich direkt.`,
    ctxRef: (f) => ` Du kamst von ${f}.`,
    ctxNone: 'die Adresse gibt es so nicht. Sag mir, was Du suchst, dann bringe ich Dich hin.',
    ask: 'Frag Eily', placeholder: 'Was suchst Du? Frag mich alles zu Vertrieb, Academy, Mystery Shopping …', send: 'Senden',
    chips: ['Was bringt die SalesMade Academy unserem Team?', 'Wie läuft Mystery Shopping ab?', 'Ich möchte mit Markus sprechen', 'Welches Framework hilft bei Angeboten?', 'Wo bremst unser Umsatz?', 'Wie komme ich in den Kundenbereich?'],
    chipSearch: (w) => `Ich suche „${w}“`,
    meant: 'Meintest Du', results: 'Passt wahrscheinlich', resultsFor: (q) => `Passt zu „${q}“`,
    kinds: { page: 'Seite', framework: 'Framework', blog: 'Blog' }, thinking: 'Eily schaut nach …', error: 'Da ging gerade etwas schief. Versuch es nochmal oder schreib uns: team@eilersfriends.com', home: 'Zur Startseite', open: 'Ansehen',
  },
  en: {
    eyebrow: '404 · Page not found', title: "This page doesn't exist. Eily finds what you're looking for.",
    titleWith: (t) => `Nothing here. But we'll find “${t}”.`,
    lead: "We like to rename things before they're finished. Maybe the link was old, maybe it was an idea we dropped. Just ask.",
    hello: (n) => (n ? `Hey ${n}, ` : 'Hey, '),
    ctxPath: (w) => `that address doesn't exist. Sounds like you're looking for something on “${w}”. The best matches are below. Or ask me directly.`,
    ctxRef: (f) => ` You came from ${f}.`,
    ctxNone: "that address doesn't exist. Tell me what you're looking for and I'll take you there.",
    ask: 'Ask Eily', placeholder: 'What are you looking for? Ask me anything about sales, the Academy, Mystery Shopping …', send: 'Send',
    chips: ['What does the SalesMade Academy do for our team?', 'How does Mystery Shopping work?', "I'd like to talk to Markus", 'Which framework helps with offers?', 'Where is our revenue stuck?', 'How do I get to the member area?'],
    chipSearch: (w) => `I'm looking for “${w}”`,
    meant: 'Did you mean', results: 'Probably a match', resultsFor: (q) => `Matches for “${q}”`,
    kinds: { page: 'Page', framework: 'Framework', blog: 'Blog' }, thinking: 'Eily is looking …', error: 'Something went wrong. Try again or write to us: team@eilersfriends.com', home: 'Home', open: 'Open',
  },
  es: {
    eyebrow: '404 · Página no encontrada', title: 'Esta página no existe. Eily encuentra lo que buscas.',
    titleWith: (t) => `Aquí no hay nada. Pero encontramos «${t}».`,
    lead: 'Nos gusta renombrar cosas antes de terminarlas. Quizá el enlace era antiguo, quizá era una idea descartada. Pregunta sin más.',
    hello: (n) => (n ? `Hola ${n}, ` : 'Hola, '),
    ctxPath: (w) => `esa dirección no existe. Parece que buscas algo sobre «${w}». Abajo están las páginas que mejor encajan. O pregúntame directamente.`,
    ctxRef: (f) => ` Venías de ${f}.`,
    ctxNone: 'esa dirección no existe. Dime qué buscas y te llevo.',
    ask: 'Pregunta a Eily', placeholder: '¿Qué buscas? Pregúntame sobre ventas, la Academy, Mystery Shopping …', send: 'Enviar',
    chips: ['¿Qué aporta la SalesMade Academy a nuestro equipo?', '¿Cómo funciona Mystery Shopping?', 'Quiero hablar con Markus', '¿Qué framework ayuda con las ofertas?', '¿Dónde se frena nuestra facturación?', '¿Cómo entro al área de clientes?'],
    chipSearch: (w) => `Busco «${w}»`,
    meant: '¿Querías decir', results: 'Probablemente encaja', resultsFor: (q) => `Resultados para «${q}»`,
    kinds: { page: 'Página', framework: 'Framework', blog: 'Blog' }, thinking: 'Eily está buscando …', error: 'Algo ha fallado. Inténtalo de nuevo o escríbenos: team@eilersfriends.com', home: 'Inicio', open: 'Ver',
  },
}

const STOP = /^(de|en|es|www|html?|php|index|page|seite|the|and|und|der|die|das)$/
function context(pathname: string) {
  const m = pathname.match(/^\/(en|es)(\/|$)/)
  const lang: Lang = (m?.[1] as Lang) ?? 'de'
  const rest = m ? pathname.slice(m[1].length + 1) : pathname
  let words = ''
  try { words = decodeURIComponent(rest) } catch { words = rest }
  words = words.replace(/\.[a-z0-9]{2,4}$/i, '').split(/[/_\-.+]+/).filter((w) => w && w.length > 1 && !STOP.test(w.toLowerCase()) && !/^\d+$/.test(w)).join(' ').slice(0, 60)
  return { lang, path: pathname, words }
}

export function NotFound404() {
  const pathname = usePathname() || (typeof window !== 'undefined' ? window.location.pathname : '/')
  const [ctx, setCtx] = useState(() => context(pathname))
  const T = TX[ctx.lang]
  const [name, setName] = useState<string | null>(null)
  const [ref, setRef] = useState<string | null>(null)
  const [extra, setExtra] = useState<string[]>([])
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [best, setBest] = useState<{ href: string; title: string } | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [resultsQ, setResultsQ] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  // Alles mitnehmen, was wir wissen: Pfad, Suchparameter, Herkunft, bekannter Vorname
  useEffect(() => {
    const p = window.location.pathname
    const c = context(p)
    const sp = new URLSearchParams(window.location.search)
    const fromQuery = ['q', 'query', 's', 'search', 'utm_term', 'utm_content', 'utm_campaign'].map((k) => sp.get(k)).filter(Boolean) as string[]
    setExtra(fromQuery.map((x) => x.replace(/[_+-]+/g, ' ').slice(0, 60)))
    setCtx(c)
    try { const k = JSON.parse(sessionStorage.getItem('ef_ctx') || '{}'); if (k.firstName) setName(String(k.firstName).slice(0, 40)) } catch { /* privat */ }
    let from: string | null = null
    try {
      if (document.referrer) {
        const r = new URL(document.referrer)
        from = r.host === window.location.host ? (r.pathname === p ? null : r.pathname) : r.host.replace(/^www\./, '')
      }
    } catch { /* kein Referrer */ }
    setRef(from)
    efTrack('page_view', `404:${p}`.slice(0, 200), { referrer: from, query: fromQuery.join(' ').slice(0, 200), lang: c.lang })
    search('', p, c.lang, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, loading])

  async function search(q: string, path: string, lang: Lang, label = true) {
    try {
      const r = await fetch('/api/not-found/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q, path, lang }) })
      const j = await r.json()
      if (!q) setBest(j.best ?? null)
      setResults(j.results ?? [])
      setResultsQ(label && q ? q : null)
    } catch { /* Ergebnisse bleiben */ }
  }

  const words = [ctx.words, ...extra].filter(Boolean).join(' ').trim()
  const greeting = T.hello(name) + (words ? T.ctxPath(words) : T.ctxNone) + (ref ? T.ctxRef(ref) : '')

  async function ask(text: string) {
    const q = text.trim()
    if (!q || loading) return
    const next: Msg[] = [...messages, { role: 'user', content: q }]
    setMessages(next); setInput(''); setLoading(true)
    search(q, ctx.path, ctx.lang)
    efTrack('chat_message', next.length === 1 ? 'first' : 'next', { path: ctx.path, page: '404' })
    try {
      const r = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          context: {
            path: ctx.path, lang: ctx.lang, section: '404',
            opener: `${greeting} [Kontext: Der Besucher ist auf einer 404-Seite gelandet (Pfad ${ctx.path}${ref ? `, kam von ${ref}` : ''}${words ? `, Suchwörter: ${words}` : ''}). Hilf ihm, die passende Seite zu finden, und verlinke sie.]`,
          },
        }),
      })
      const j = await r.json()
      setMessages((m) => [...m, { role: 'assistant', content: j.reply || T.error }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: T.error }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const chips = [words ? T.chipSearch(words) : null, ...T.chips].filter(Boolean).slice(0, 6) as string[]
  const KIcon = { page: Compass, framework: LayoutGrid, blog: FileText }

  return (
    <div id="ef-404" className="relative overflow-hidden bg-[#FAFAF8]">
      {/* Raster und Licht im Hintergrund, wie die Bühnen der Website */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(26,95,212,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(26,95,212,.06) 1px,transparent 1px)', backgroundSize: '32px 32px',
        WebkitMaskImage: 'radial-gradient(70% 60% at 50% 20%,#000 30%,transparent 75%)', maskImage: 'radial-gradient(70% 60% at 50% 20%,#000 30%,transparent 75%)',
      }} />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-240px] h-[520px] w-[900px] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side,rgba(37,99,255,.16),transparent)' }} />

      <div className="relative mx-auto max-w-[960px] px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] shadow-sm ring-1 ring-black/5" style={{ color: BLUE }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#EB0028]" />{T.eyebrow}
          </span>
          <h1 className="mx-auto mt-5 max-w-[760px] text-[34px] font-bold leading-[1.05] tracking-[-.035em] text-[#0D0D0B] sm:text-[52px]" style={{ textWrap: 'balance' }}>
            {words && words.length <= 28 ? T.titleWith(words) : T.title}
          </h1>
          <p className="mx-auto mt-4 max-w-[600px] text-[17px] leading-relaxed text-gray-600">{T.lead}</p>
          <p className="mt-3 font-mono text-xs text-gray-400">{ctx.path}</p>
        </div>

        {best && (
          <a href={best.href} onClick={() => efTrack('cta_click', `404_best:${best.href}`, { from: ctx.path })}
            className="group mx-auto mt-8 flex max-w-[640px] items-center justify-between gap-4 rounded-2xl bg-[#0E1733] px-6 py-4 text-white no-underline shadow-[0_24px_50px_-30px_rgba(14,23,51,.9)] transition-transform hover:-translate-y-0.5">
            <span><span className="block text-[11px] font-bold uppercase tracking-[.16em] text-[#6FA3FF]">{T.meant} …</span><span className="text-lg font-bold">{best.title}?</span></span>
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </a>
        )}

        {/* Eily, groß */}
        <div className="mx-auto mt-8 max-w-[760px] rounded-[28px] bg-white p-3 shadow-[0_40px_80px_-40px_rgba(14,23,51,.45)] ring-1 ring-black/5 sm:p-4">
          <div ref={threadRef} className="max-h-[440px] space-y-4 overflow-y-auto px-2 pb-2 pt-3 sm:px-3">
            <div className="flex items-start gap-3">
              <img src={AVATAR} alt="Eily" className="h-10 w-10 flex-shrink-0 rounded-full object-cover ring-2 ring-white" />
              <div className="rounded-2xl rounded-tl-md bg-[#F4F4F2] px-4 py-3 text-[15px] leading-relaxed text-gray-800">{greeting}</div>
            </div>
            {messages.map((m, i) => m.role === 'user' ? (
              <div key={i} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-tr-md px-4 py-3 text-[15px] leading-relaxed text-white" style={{ background: BLUE }}>{m.content}</div></div>
            ) : (
              <div key={i} className="flex items-start gap-3">
                <img src={AVATAR} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                <div className="max-w-[85%] space-y-2">
                  <div className="whitespace-pre-line rounded-2xl rounded-tl-md bg-[#F4F4F2] px-4 py-3 text-[15px] leading-relaxed text-gray-800">{renderRich(splitCards(m.content).text)}</div>
                  {splitCards(m.content).cards.map((c, j) => <div key={j} className="max-w-[320px]"><ChatCard spec={c} /></div>)}
                </div>
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 pl-[52px] text-sm text-gray-500"><Loader2 size={15} className="animate-spin" />{T.thinking}</div>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(input) }} className="relative mt-2">
            <label htmlFor="ef-404-ask" className="sr-only">{T.ask}</label>
            <textarea id="ef-404-ask" ref={inputRef} rows={2} value={input} placeholder={T.placeholder} autoFocus
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input) } }}
              className="block w-full resize-none rounded-[20px] border-2 border-[#E5E7EB] bg-white px-5 py-4 pr-16 text-[17px] leading-snug text-[#0D0D0B] outline-none transition-colors placeholder:text-gray-400 focus:border-[#1A5FD4]" />
            <button type="submit" aria-label={T.send} disabled={!input.trim() || loading}
              className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full text-white transition-opacity disabled:opacity-40" style={{ background: BLUE }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={20} />}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1">
            {chips.map((c, i) => (
              <button key={c} type="button" onClick={() => { efTrack('cta_click', `404_chip:${i}`, { chip: c }); ask(c) }} disabled={loading}
                className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${i === 0 && words ? 'bg-[#EBF1FF] text-[#154CAA] hover:bg-[#dde8ff]' : 'bg-[#F4F4F2] text-gray-700 hover:bg-[#ebebe8]'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Suchergebnisse */}
        {results.length > 0 && (
          <div className="mt-14">
            <p className="text-center text-[12px] font-bold uppercase tracking-[.16em]" style={{ color: BLUE }}>{resultsQ ? T.resultsFor(resultsQ.slice(0, 50)) : T.results}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => {
                const I = KIcon[r.kind]
                return (
                  <a key={r.href} href={r.href} onClick={() => efTrack('cta_click', `404_result:${r.href}`, { from: ctx.path })}
                    className="group flex flex-col overflow-hidden rounded-[20px] bg-white no-underline ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(14,23,51,.5)]">
                    {r.image ? <img src={r.image} alt="" className="aspect-[16/9] w-full object-cover" /> : null}
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em]" style={{ color: BLUE }}><I size={13} />{T.kinds[r.kind]}</span>
                      <span className="text-[17px] font-bold leading-snug tracking-[-.01em] text-[#0D0D0B]">{r.title}</span>
                      {r.text && <span className="line-clamp-3 text-[14px] leading-relaxed text-gray-600">{r.text}</span>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[13px] font-bold" style={{ color: BLUE }}>{T.open} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
                    </div>
                  </a>
                )
              })}
            </div>
            <p className="mt-8 text-center"><a href={ctx.lang === 'de' ? '/' : `/${ctx.lang}`} className="text-sm font-semibold text-gray-500 underline">{T.home}</a></p>
          </div>
        )}
      </div>
    </div>
  )
}
