import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureCompanyProfile } from '@/lib/db/self-heal'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'

export const runtime = 'nodejs'
export const maxDuration = 25

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId: _draftId } = await params
  void _draftId

  await ensureCompanyProfile()
  await ensureBauplanV2Tables()

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const existingBlocks = (body.existingBlocks as Array<Record<string, unknown>>) ?? []
  const businessContext = body.businessContext as Record<string, unknown> | null
  const product = body.product as Record<string, unknown> | null
  const initial = Boolean(body.initial)

  // Load company profile
  const profileRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT organisation_name, summary, value_proposition, target_audience, keywords
      FROM company_profile WHERE user_id = ${session.user.id} LIMIT 1
    `)
  )
  const profile = profileRows[0]

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const systemPrompt = `Du bist ein B2B-Angebots-Architekt. Du schlaegst Bausteine fuer ein konkretes Produkt vor.

WICHTIGSTE REGEL: KEINE HALLUZINATION.
- Nutze ausschliesslich BUSINESS-KONTEXT + PRODUKT + COMPANY PROFILE als Kontext.
- Erfinde NIEMALS Bausteine, die zu einem GENERISCHEN Beispiel passen wuerden.
- Bausteine muessen konkret sein (Workshop, Audit, Library, Channel, Review, Session, Sprint).
- KEIN "Beratung", "Begleitung", "Unterstuetzung", "Coaching im Allgemeinen".
- Pro Baustein: Name max 4 Worte, Beschreibung 1 Satz was er LEISTET.

Wenn ${initial ? 'INITIAL' : 'APPEND'}: ${initial
  ? 'Schlage genau 5 Pflicht-Bausteine + 1 Bonus vor.'
  : 'Schlage 3-5 zusaetzliche Bausteine vor, die nicht zu den existierenden duplizieren.'}

Antwort als gueltiges JSON.`

  const existingNames = existingBlocks.map((b) => String(b.name ?? '')).filter(Boolean).join(' | ')

  const userPrompt = `COMPANY PROFILE:
- Organisation: ${profile?.organisation_name ?? '—'}
- Summary: ${profile?.summary ?? '—'}
- Value Proposition: ${profile?.value_proposition ?? '—'}
- Target Audience: ${profile?.target_audience ?? '—'}

BUSINESS-KONTEXT (aus Step 01a):
- Markt-Position: ${businessContext?.marketPosition ?? '—'}
- Zielmarkt: ${businessContext?.targetMarket ?? '—'}
- Geschaeftsmodell: ${businessContext?.businessModel ?? '—'}
- Wettbewerbs-Position: ${businessContext?.competitivePositioning ?? '—'}

PRODUKT (aus Step 01b):
- Name: ${product?.productName ?? '—'}
- Typ: ${product?.productType ?? '—'}
- Summary: ${product?.productSummary ?? '—'}

Bereits erfasste Bausteine: ${existingNames || '(keine)'}

Gib zurueck:
{
  "blocks": [
    { "name": "max 4 Worte", "description": "1 Satz was er LEISTET", "isBonus": false },
    ...
  ],
  "notes": "Optionale Klaerungsfrage, falls Profile zu duenn"
}

Nur das JSON-Objekt.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.6,
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

    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks as Array<Record<string, unknown>> : []
    const startOrder = existingBlocks.length
    const normalisedBlocks = blocks.map((b, i) => ({
      id: crypto.randomUUID(),
      name: String(b.name ?? ''),
      description: String(b.description ?? ''),
      isBonus: Boolean(b.isBonus),
      order: startOrder + i,
    }))

    return NextResponse.json({ ok: true, blocks: normalisedBlocks, notes: parsed.notes ?? '' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
