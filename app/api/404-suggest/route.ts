import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 15

type Loc = 'de' | 'en' | 'es' | 'ru'
type Sug = { title: string; href: string; why: string }

const PAGES: { keys: RegExp; de: Sug; en: Sug }[] = [
  { keys: /(termin|anruf|anrufen|call|buch|slot|kalender|book)/i, de: { title: 'Termin buchen', href: '/schedule', why: 'Sprich direkt mit uns' }, en: { title: 'Book a call', href: '/schedule', why: 'Talk to us directly' } },
  { keys: /(framework|bauplan|b2b|angebot)/i, de: { title: 'Frameworks ansehen', href: '/frameworks', why: 'Unsere Baupläne' }, en: { title: 'Frameworks', href: '/frameworks', why: 'Our blueprints' } },
  { keys: /(salesmade|academy|training|vertrieb|sales|verkauf)/i, de: { title: 'SalesMade Academy', href: '/salesmade', why: 'Vertriebs-Ausbildung' }, en: { title: 'SalesMade Academy', href: '/salesmade', why: 'Sales training' } },
  { keys: /(kontakt|contact|erreichen|schreiben)/i, de: { title: 'Kontakt aufnehmen', href: '/kontakt', why: 'Wir melden uns' }, en: { title: 'Contact us', href: '/kontakt', why: 'We’ll get back to you' } },
  { keys: /(markus)/i, de: { title: 'Markus Eilers', href: '/markus', why: 'Vertrieb & AI im Sales' }, en: { title: 'Markus Eilers', href: '/markus', why: 'Sales & AI' } },
  { keys: /(aljona|leadership|führung)/i, de: { title: 'Aljona Eilers', href: '/aljona', why: 'Liquid Leadership' }, en: { title: 'Aljona Eilers', href: '/aljona', why: 'Liquid Leadership' } },
  { keys: /(login|portal|dashboard|konto|account)/i, de: { title: 'Login', href: '/auth/login', why: 'Zu Deinem Bereich' }, en: { title: 'Login', href: '/auth/login', why: 'Your area' } },
]
const DEFAULTS = { de: [{ title: 'Zur Startseite', href: '/', why: 'Von vorne' }, { title: 'Frameworks ansehen', href: '/frameworks', why: 'Unsere Baupläne' }, { title: 'Kontakt aufnehmen', href: '/kontakt', why: 'Wir helfen weiter' }], en: [{ title: 'Home', href: '/', why: 'Start over' }, { title: 'Frameworks', href: '/frameworks', why: 'Our blueprints' }, { title: 'Contact', href: '/kontakt', why: 'We’ll help' }] }
const FALLBACK_MSG: Record<Loc, string> = {
  de: 'Ich kann gerade nicht groß nachdenken — aber hier ist, wo Du vermutlich hinwolltest:',
  en: 'I can’t think out loud right now — but here’s where you probably meant to go:',
  es: 'Ahora no puedo pensar en voz alta — pero aquí es a donde probablemente querías ir:',
  ru: 'Сейчас не могу подумать вслух — но, вероятно, вам сюда:',
}

function fallback(query: string, locale: Loc) {
  const lang = locale === 'en' || locale === 'es' || locale === 'ru' ? 'en' : 'de'
  const matched = PAGES.filter(p => p.keys.test(query)).map(p => (lang === 'de' ? p.de : p.en))
  const suggestions = (matched.length ? matched : DEFAULTS[lang]).slice(0, 4)
  return { message: FALLBACK_MSG[locale] || FALLBACK_MSG.de, suggestions }
}

const SITE_MAP = `Seiten: / (Start), /frameworks, /salesmade (Academy), /schedule (Termin buchen), /kontakt, /markus, /aljona, /auth/login, /impressum, /datenschutz. /en/… englisch, /es/… spanisch.`

export async function POST(request: Request) {
  let body: { query?: string; path?: string; locale?: Loc }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid body' }, { status: 400 }) }
  const query = String(body.query || ''); const path = String(body.path || ''); const locale = (body.locale || 'de') as Loc
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json(fallback(query, locale))

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini', temperature: 0.5, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `Du hilfst auf einer 404-Seite von eilersfriends.com. ${SITE_MAP}\nAntworte NUR als JSON: {"message":"1–2 warme Sätze in Sprache ${locale}","suggestions":[{"title":"..","href":"/echter/pfad","why":".."}]} mit 2–4 suggestions, href nur echte Seiten oben.` },
          { role: 'user', content: `404 auf Pfad ${path}. Frage: "${query}". Sprache ${locale}.` },
        ],
      }),
    })
    if (!res.ok) return NextResponse.json(fallback(query, locale))
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) return NextResponse.json(fallback(query, locale))
    const parsed = JSON.parse(content)
    if (!parsed?.suggestions?.length) return NextResponse.json(fallback(query, locale))
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(fallback(query, locale))
  }
}
