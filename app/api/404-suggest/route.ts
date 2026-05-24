import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 15

const SITE_MAP = `
Verfuegbare Seiten auf eilersfriends.com:
- / Startseite
- /frameworks Frameworks-Liste mit Baupläne
- /frameworks/b2b-angebote Der 8-Schritte-Bauplan fuer unwiderstehliche B2B-Angebote
- /salesmade SalesMade Academy (Verkaufs-Trainings-Programm)
- /aljona Aljona Eilers (Liquid Leadership)
- /markus Markus Eilers (Speaker / Vertriebs-Coach)
- /blog Blog (Coaching-Lehren der Woche)
- /contact Kontakt mit Calendly
- /auth/login Login
- /dashboard Dein persoenliches Portal (nach Login)
- /dashboard/frameworks Meine Frameworks
- /datenschutz Datenschutz
- /impressum Impressum
- /en/... fuer Englisch, /es/... fuer Spanisch
`

const MARKUS_VOICE = `Du schreibst in Markus' Stimme — empathisch, business-savvy, neugierig statt verurteilend, humorvoll an den richtigen Stellen.

Patterns:
- Geh zuerst selbst rein, bevor Du beim Leser landest: "Bei uns hat es uns auch mal passiert, dass…"
- Wit auf Branchen- oder eigene Kosten, NIE auf Kosten des Users.
- Hoeflich, kurz, dicht. Keine "ehrliche Rechnung"-Phrasen. Keine "nahtlos", "ganzheitlich", "synergetisch".
- Wenn etwas nicht da ist, zeige sofort die Tuer raus — kein langes Bedauern.
- Bei 404: Markus uebernimmt Verantwortung kurz ("wir benennen Sachen gern um"), dann Vorschlag.

WICHTIG: Sprache MUSS zur Locale passen (de/en/es/ru). Keine Anglizismen wenn de.
`

interface RequestBody { query: string; path: string; locale: 'de' | 'en' | 'es' | 'ru' }

export async function POST(request: Request) {
  let body: RequestBody
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid body' }, { status: 400 }) }
  const { query, path, locale } = body
  if (!query || typeof query !== 'string') return NextResponse.json({ error: 'query required' }, { status: 400 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const systemPrompt = `${MARKUS_VOICE}

${SITE_MAP}

Antworte als JSON:
{
  "message": "Ein 1-2 Saetze warmer, hoeflicher, leicht witziger Satz in Markus' Voice und in der vom User gewuenschten Sprache. Locale: ${locale}.",
  "suggestions": [
    { "title": "Lesbarer Titel", "href": "/relative/pfad", "why": "Eine Zeile: warum das passt" }
  ]
}

Liefer 2 bis 4 suggestions. href muss eine echte Seite aus dem Site-Map oben sein. Nur das JSON-Objekt, kein Markdown.`

  const userPrompt = `User landete auf 404. Original-Pfad: ${path}
User-Frage: "${query}"
Sprache: ${locale}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[404-suggest] OpenAI error', res.status, text.slice(0, 300))
      return NextResponse.json({ error: 'AI not available' }, { status: 502 })
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let parsed: { message?: string; suggestions?: { title: string; href: string; why?: string }[] }
    try { parsed = JSON.parse(content) } catch {
      return NextResponse.json({ error: 'AI returned non-JSON' }, { status: 502 })
    }
    // Sanitize hrefs — only allow relative paths
    const safe = (parsed.suggestions ?? []).filter((s) => typeof s.href === 'string' && s.href.startsWith('/'))
    return NextResponse.json({ message: parsed.message ?? '', suggestions: safe.slice(0, 4) })
  } catch (err) {
    console.error('[404-suggest] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
