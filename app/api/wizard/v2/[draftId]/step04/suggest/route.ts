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
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params

  await ensureCompanyProfile()
  await ensureBauplanV2Tables()

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const blocks = (body.blocks as Array<Record<string, unknown>>) ?? []
  const onlyOne = Boolean(body.onlyOne)
  if (blocks.length === 0) return NextResponse.json({ ok: true, cards: [] })

  // Load context: company_profile, business_context, product, challenges, ICP painsGains
  const profileRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT summary, value_proposition, target_audience, industry
      FROM company_profile WHERE user_id = ${session.user.id} LIMIT 1
    `)
  )
  const bcRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT market_position, target_market, business_model, competitive_positioning
      FROM bauplan_business_context WHERE bauplan_id = ${draftId} LIMIT 1
    `)
  )
  const productRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT product_name, product_type, product_summary
      FROM bauplan_product WHERE bauplan_id = ${draftId} LIMIT 1
    `)
  )
  const challengeRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT topic, reality, economic_impact, kpi FROM bauplan_challenges
      WHERE bauplan_id = ${draftId} AND type = 'challenge' LIMIT 10
    `)
  )
  const icpRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT pains_gains FROM bauplan_icp WHERE bauplan_id = ${draftId} LIMIT 1
    `)
  )

  const profile = profileRows[0]
  const bc = bcRows[0]
  const product = productRows[0]
  const challenges = challengeRows.map((r) => `- ${r.topic}: ${r.reality} (Impact: ${r.economic_impact}, KPI: ${r.kpi})`).join('\n') || '(noch keine Herausforderungen erfasst)'
  const painsGains = icpRows[0]?.pains_gains as Array<Record<string, unknown>> | undefined
  const pains = (painsGains ?? []).filter((p) => p.type === 'pain').slice(0, 5).map((p) => `- ${p.topic}: ${p.reality}`).join('\n') || '(noch keine Pains erfasst)'

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const systemPrompt = `Du bist ein B2B-Angebots-Analyst. Du fuellst das Beef-Radar: pro Baustein einen HOW (direkter Effekt, 1 Satz) + einen WHY (Welleneffekt mit Zahl + Einheit, 1 Satz).

WICHTIGSTE REGELN:
1. KEINE HALLUZINATION. Nutze ausschliesslich: COMPANY-PROFILE + BUSINESS-KONTEXT + PRODUKT + HERAUSFORDERUNGEN + ICP-PAINS als Anker.
2. WHY muss eine ZAHL haben (Stunden, %, €, Wochen, etc.) + Einheit. Wenn unsicher: gib ein Branchen-Range mit Quelle-Hinweis ("Branchen-Anker").
3. KEINE FLOSKELN. Verbotene Woerter:
   - "Mehr Effizienz" → ersetze durch "−45 Min/Tag pro X"
   - "Schneller im Markt" → "Sales-Cycle 6 → 3 Mo"
   - "Bessere Qualitaet" → "Bug-Rate ø 0,3/100"
   - "Mehr Umsatz" → "+15 MQLs pro Monat"
   - "Hoehere Zufriedenheit" → "NPS +18 nach 90 Tagen"
   - "Skalierbarkeit" → "Ramp-Up 12 → 4 Wochen"
   - "Mehr Sichtbarkeit" → "Marketing-Budget +25 % vor Board"
   - "Bessere Entscheidungen" → "Forecast-Accuracy +25 %"
4. HOW ist der direkte Effekt ("was passiert sofort"). WHY ist der Welleneffekt ("was bedeutet das wirtschaftlich").

Antwort als gueltiges JSON.`

  const blockList = blocks.map((b) => `- ${b.name}: ${b.description ?? ''}${b.isBonus ? ' [BONUS]' : ''} (id=${b.id})`).join('\n')

  const userPrompt = `COMPANY-PROFILE:
- Summary: ${profile?.summary ?? '—'}
- Value Proposition: ${profile?.value_proposition ?? '—'}
- Zielgruppe: ${profile?.target_audience ?? '—'}
- Branche: ${profile?.industry ?? '—'}

BUSINESS-KONTEXT:
- Markt-Position: ${bc?.market_position ?? '—'}
- Zielmarkt: ${bc?.target_market ?? '—'}
- Geschaeftsmodell: ${bc?.business_model ?? '—'}
- Wettbewerb: ${bc?.competitive_positioning ?? '—'}

PRODUKT:
- Name: ${product?.product_name ?? '—'}
- Typ: ${product?.product_type ?? '—'}
- Summary: ${product?.product_summary ?? '—'}

HERAUSFORDERUNGEN (Schmerz-Vektoren — was die Effekte aufloesen muessen):
${challenges}

ICP-PAINS:
${pains}

BAUSTEINE (Spalte 1 — fuer jeden Baustein HOW + WHY generieren):
${blockList}

${onlyOne ? 'Generiere fuer EINEN Baustein.' : 'Generiere fuer ALLE Bausteine.'}

Antworte als JSON:
{
  "cards": [
    { "buildingBlockId": "id-aus-input", "how": "1 Satz direkter Effekt", "why": "1 Satz Welleneffekt mit Zahl + Einheit" }
  ]
}

Nur das JSON-Objekt.`

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

    return NextResponse.json({ ok: true, cards: parsed.cards ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
