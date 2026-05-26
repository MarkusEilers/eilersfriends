import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureCompanyProfile } from '@/lib/db/self-heal'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'

export const runtime = 'nodejs'
export const maxDuration = 30

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params

  await ensureCompanyProfile()
  await ensureBauplanV2Tables()

  // Load company profile (from Welcome)
  const profileRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT organisation_name, website, summary, value_proposition, target_audience, tone, keywords, industry
      FROM company_profile WHERE user_id = ${session.user.id} LIMIT 1
    `)
  )
  const profile = profileRows[0]
  if (!profile?.summary) {
    return NextResponse.json({
      error: 'Welcome-Profile fehlt. Bitte erst Welcome-Schritt abschliessen (Website analysieren).',
    }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const systemPrompt = `Du bist ein B2B-Strategie-Analyst. Du nimmst ein Welcome-Profil eines Unternehmens und extrahierst:
1. Business-Kontext (Markt-Position, Zielmarkt, Geschaeftsmodell, kompetitive Positionierung)
2. Produkt/Service (Name, Typ, Summary, Stage)
3. Top 5 Bausteine + 1 Bonus, die das Hauptangebot tragen

WICHTIGSTE REGEL: KEINE HALLUZINATION.
- Nutze ausschliesslich Informationen aus dem COMPANY PROFILE.
- Erfinde NIEMALS Bausteine, Features oder Produkte, die nicht im Profile belegt sind.
- Wenn das Profile zu duenn ist: gib leere Strings und leere Liste zurueck, schreib im notes-Feld eine Klaerungsfrage.
- Bausteine muessen konkret sein (Workshop, Audit, Library, Channel, Review) — nicht "Beratung", "Begleitung", "Unterstuetzung".
- Pro Baustein: Name max 4 Worte + Beschreibung was er LEISTET (1 Satz), nicht was er IST.

Antwort als gueltiges JSON.`

  const userPrompt = `COMPANY PROFILE (aus Welcome-Step):
- Organisation: ${profile.organisation_name ?? '—'}
- Website: ${profile.website ?? '—'}
- Summary: ${profile.summary ?? '—'}
- Value Proposition: ${profile.value_proposition ?? '—'}
- Target Audience: ${profile.target_audience ?? '—'}
- Tone: ${profile.tone ?? '—'}
- Keywords: ${Array.isArray(profile.keywords) ? (profile.keywords as string[]).join(', ') : '—'}
- Industry: ${profile.industry ?? '—'}

Bitte gib zurueck:
{
  "businessContext": {
    "marketPosition": "1 Satz",
    "targetMarket": "1-2 Saetze",
    "businessModel": "saas|service|consulting|hybrid|marketplace|course|membership|lizenz",
    "competitivePositioning": "1 Satz"
  },
  "product": {
    "productName": "max 6 Worte, Arbeitstitel des konkreten Angebots",
    "productType": "programm|coaching|software|lizenz|membership|workshop|service|beratung",
    "productSummary": "1-2 Saetze: was ist es, fuer wen",
    "productStage": "idee|pilot|live|skalierung"
  },
  "blocks": [
    { "name": "max 4 Worte", "description": "1 Satz was er LEISTET", "isBonus": false },
    ... 4 weitere Pflicht-Bausteine ...,
    { "name": "max 4 Worte", "description": "1 Satz", "isBonus": true }
  ],
  "notes": "Falls Profile zu duenn — Klaerungsfrage an User. Sonst leer."
}

Nur das JSON-Objekt, kein Markdown.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `OpenAI ${res.status}`, detail: text.slice(0, 500) }, { status: 502 })
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(content) } catch {
      return NextResponse.json({ error: 'AI returned non-JSON' }, { status: 502 })
    }

    // Normalize blocks → add IDs + order
    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks as Array<Record<string, unknown>> : []
    const normalisedBlocks = blocks.map((b, i) => ({
      id: crypto.randomUUID(),
      name: String(b.name ?? ''),
      description: String(b.description ?? ''),
      isBonus: Boolean(b.isBonus),
      order: i,
    }))

    return NextResponse.json({
      ok: true,
      businessContext: parsed.businessContext ?? null,
      product: parsed.product ?? null,
      blocks: normalisedBlocks,
      notes: parsed.notes ?? '',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
