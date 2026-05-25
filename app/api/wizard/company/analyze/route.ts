import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 30

interface AnalyseResult {
  organisationName: string
  summary: string
  valueProposition: string
  targetAudience: string
  tone: string
  keywords: string[]
  brandColor?: string
  accentColor?: string
  products?: { name: string; description: string }[]
  industry?: string
}

async function fetchWebsiteText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EilersFriendsBot/1.0)' },
      redirect: 'follow',
    })
    if (!res.ok) return ''
    const html = await res.text()
    // crude extract: strip scripts/styles, then tags, collapse whitespace
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return cleaned.slice(0, 12000)
  } catch (err) {
    console.error('[analyze] fetch failed:', err)
    return ''
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, organisationName } = await request.json().catch(() => ({})) as { url?: string; organisationName?: string }
  if (!url || typeof url !== 'string') return NextResponse.json({ error: 'url required' }, { status: 400 })

  let normalisedUrl = url.trim()
  if (!/^https?:\/\//i.test(normalisedUrl)) normalisedUrl = 'https://' + normalisedUrl

  const websiteText = await fetchWebsiteText(normalisedUrl)
  if (!websiteText) {
    return NextResponse.json({ error: 'Website-Inhalt konnte nicht geladen werden.' }, { status: 422 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const systemPrompt = `Du bist Markus Eilers' Recherche-Co-Pilot. Analysiere die uebergebene Website und liefere strukturierte GTM-Daten als JSON.

WICHTIG:
- Sprache: Antworte in der Sprache der Website (DE wenn DE-Inhalte ueberwiegen, sonst EN).
- Keine Marketing-Floskeln. Direkte, business-savvy Sprache wie Markus.
- summary: 2-3 Sätze, was das Unternehmen tut.
- valueProposition: 2-3 Sätze, wie das Unternehmen Wert schafft (für wen, mit welchem messbarem Outcome).
- targetAudience: Konkrete Rollen, Branchen, Unternehmensgroesse.
- tone: 2-4 Adjektive, max ein Satz (z.B. "Professional and Direct").
- keywords: 4-8 Such-/Branchen-Begriffe, einzelne Worte oder Mehrwort-Tags.
- brandColor: Hex-Code der Hauptmarke (#RRGGBB), wenn erkennbar.
- accentColor: Hex-Code Akzent.
- products: 2-5 Hauptprodukte/Services mit Name + Description (1 Satz).
- industry: 1-3 Worte.
- organisationName: Falls leer in Input, aus Website ableiten.

Output strikt als JSON-Objekt, keine umliegenden Texte, kein Markdown.`

  const userPrompt = `Organisation (Input): ${organisationName ?? '(nicht angegeben)'}
URL: ${normalisedUrl}

Website-Text (Auszug):
${websiteText.slice(0, 10000)}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('[analyze] OpenAI', res.status, text.slice(0, 300))
      return NextResponse.json({ error: 'AI nicht erreichbar' }, { status: 502 })
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let parsed: AnalyseResult
    try { parsed = JSON.parse(content) as AnalyseResult } catch {
      return NextResponse.json({ error: 'AI returned non-JSON' }, { status: 502 })
    }
    if (!parsed.organisationName && organisationName) parsed.organisationName = organisationName
    return NextResponse.json({ ok: true, result: parsed, url: normalisedUrl })
  } catch (err) {
    console.error('[analyze] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
