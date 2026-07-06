'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, Loader2, Send } from 'lucide-react'

type Suggestion = { title: string; href: string; why?: string }

interface SiteRoute { keywords: string[]; href: string; title: string; locales?: string[] }

// Statisches Site-Map fuer Token-Match (vor AI-Call)
const SITE: SiteRoute[] = [
  { keywords: ['framework', 'frameworks', 'bauplan', 'angebot', 'b2b', 'offer'], href: '/frameworks', title: 'Frameworks & Bauplaene' },
  { keywords: ['blog', 'newsletter', 'article'], href: '/blog', title: 'Blog' },
  { keywords: ['kontakt', 'contact', 'gespraech', 'meeting'], href: '/contact', title: 'Kontakt' },
  { keywords: ['salesmade', 'academy', 'sales', 'vertrieb'], href: '/salesmade', title: 'SalesMade Academy' },
  { keywords: ['aljona', 'leadership', 'fuehrung'], href: '/aljona', title: 'Aljona & Liquid Leadership' },
  { keywords: ['markus', 'speaker', 'keynote'], href: '/markus', title: 'Markus Eilers' },
  { keywords: ['datenschutz', 'privacy', 'dsgvo'], href: '/datenschutz', title: 'Datenschutz' },
  { keywords: ['impressum', 'imprint'], href: '/impressum', title: 'Impressum' },
  { keywords: ['login', 'anmelden', 'signin'], href: '/auth/login', title: 'Login' },
  { keywords: ['dashboard', 'portal', 'mein'], href: '/dashboard', title: 'Dein Dashboard' },
]

function parsePath(pathname: string) {
  let path = pathname || '/'
  let locale: 'de' | 'en' | 'es' | 'ru' = 'de'
  const m = path.match(/^\/(en|es|ru|de)(\/|$)/)
  if (m) {
    locale = m[1] as 'en' | 'es' | 'ru' | 'de'
    path = path.slice(m[1].length + 1) || '/'
  }
  const tokens = path
    .toLowerCase()
    .split(/[\/\-_]+/)
    .filter((t) => t.length >= 3 && t.length < 30)
  return { path, locale, tokens }
}

function matchSuggestions(tokens: string[]): Suggestion[] {
  const scored = SITE.map((s) => {
    const score = s.keywords.reduce((acc, k) => acc + (tokens.some((t) => t.includes(k) || k.includes(t)) ? 1 : 0), 0)
    return { ...s, score }
  })
  const top = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3)
  if (top.length > 0) return top.map(({ title, href }) => ({ title, href }))
  // Fallback: 3 most general routes
  return [
    { title: 'Zur Startseite', href: '/' },
    { title: 'Frameworks ansehen', href: '/frameworks' },
    { title: 'Kontakt aufnehmen', href: '/contact' },
  ]
}

const VOICE_FALLBACKS: Record<'de' | 'en' | 'es' | 'ru', string> = {
  de: 'Bei uns ist es so: wir nennen Sachen gern um, bevor sie fertig sind. Es kann also sein, dass Du auf einem alten Link gelandet bist, oder auf einer Idee, die wir wieder verworfen haben. Beides okay.',
  en: 'Here is the deal: we like to rename things before they are finished. So you might have landed on an old link, or on an idea we ended up scrapping. Both are fine.',
  es: 'Aqui esta el asunto: nos gusta renombrar cosas antes de que esten terminadas. Asi que puede que hayas aterrizado en un enlace viejo, o en una idea que descartamos. Ambas cosas estan bien.',
  ru: 'У нас так: мы любим переименовывать вещи до того, как они закончены. Возможно, вы попали на старую ссылку или на идею, которую мы отбросили. Оба варианта в порядке.',
}

const TITLE_FALLBACKS: Record<'de' | 'en' | 'es' | 'ru', string> = {
  de: 'Diese Seite gibt es nicht — oder noch nicht.',
  en: 'This page does not exist — or not yet.',
  es: 'Esta pagina no existe — o aun no.',
  ru: 'Этой страницы нет — или пока нет.',
}

const CHAT_PLACEHOLDER: Record<'de' | 'en' | 'es' | 'ru', string> = {
  de: 'Sag mir kurz, was Du gesucht hast …',
  en: 'Tell me what you were looking for …',
  es: 'Dime que estabas buscando …',
  ru: 'Скажите, что вы искали …',
}

export function NotFoundClient() {
  const [path, setPath] = useState<string>('/')
  const [locale, setLocale] = useState<'de' | 'en' | 'es' | 'ru'>('de')
  const [initialSuggestions, setInitialSuggestions] = useState<Suggestion[]>([])
  const [query, setQuery] = useState<string>('')
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[]>([])
  const [busy, setBusy] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const pn = typeof window !== 'undefined' ? window.location.pathname : '/'
    const parsed = parsePath(pn)
    setPath(parsed.path)
    setLocale(parsed.locale)
    setInitialSuggestions(matchSuggestions(parsed.tokens))
  }, [])

  async function ask() {
    const q = query.trim()
    if (!q) {
      inputRef.current?.focus()
      return
    }
    setBusy(true); setError(null); setAiMessage(null); setAiSuggestions([])
    try {
      const res = await fetch('/api/404-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, path, locale }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Suggest fehlgeschlagen'); return }
      setAiMessage(data.message ?? null)
      setAiSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  const title = TITLE_FALLBACKS[locale]
  const intro = VOICE_FALLBACKS[locale]

  return (
    <div className="mt-12">
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F05A1A' }}>
        404 · {path}
      </div>
      <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: 'DM Serif Display, serif', color: '#0D0D0B' }}>
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-700">
        {intro}
      </p>

      <div className="mt-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
          {locale === 'en' ? 'Maybe one of these' : locale === 'es' ? 'Quiza uno de estos' : 'Vielleicht einer von diesen'}
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {initialSuggestions.map((s) => (
            <li key={s.href}>
              <Link href={s.href as '/'} className="block rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
                <span className="text-sm font-bold text-gray-900">{s.title}</span>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#1A5FD4' }}>
                  Ansehen <ArrowRight size={11} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: '#F05A1A' }} />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-700">
            {locale === 'en' ? 'Or ask me' : locale === 'es' ? 'O preguntame' : 'Oder frag mich kurz'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          {locale === 'en' ? 'I read the URL and your message and point you to the right place.' : locale === 'es' ? 'Leo la URL y tu mensaje y te indico el lugar correcto.' : 'Ich lese die URL und Deine Frage — und zeige Dir, wo Du landen wolltest.'}
        </p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') ask() }}
            placeholder={CHAT_PLACEHOLDER[locale]}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
          />
          <button
            onClick={ask}
            disabled={busy || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#F05A1A' }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-gray-400">Schreib uns einfach kurz: team@eilersfriends.com</p>}

        {aiMessage && (
          <div className="mt-5 rounded-xl border-l-4 px-4 py-3" style={{ borderColor: '#F05A1A', backgroundColor: '#FFF1EB' }}>
            <p className="text-sm leading-relaxed text-gray-800">{aiMessage}</p>
          </div>
        )}
        {aiSuggestions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {aiSuggestions.map((s, i) => (
              <li key={i}>
                <Link href={s.href as '/'} className="block rounded-xl border border-blue-200 bg-blue-50/50 p-3 transition-colors hover:bg-blue-50">
                  <span className="text-sm font-bold text-blue-900">{s.title}</span>
                  {s.why && <p className="mt-1 text-xs text-blue-800">{s.why}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-12 text-xs text-gray-400">
        {locale === 'en' ? 'PS: if you came from a working link in our newsletter that ended up here, please reply to the email — we owe you a fix.' : locale === 'es' ? 'PD: si llegaste desde un enlace en nuestro boletin, respondenos — te debemos un arreglo.' : 'PS: Falls Du einen Link aus unserem Newsletter geklickt hast und hier gelandet bist, schreib uns kurz — wir schulden Dir einen Fix.'}
      </p>
    </div>
  )
}
