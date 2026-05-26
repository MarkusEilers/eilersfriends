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

export async function POST(_request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params

  await ensureCompanyProfile()
  await ensureBauplanV2Tables()

  // Load context: company_profile, business_context, product, building_blocks
  const profile = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT summary, value_proposition, target_audience, industry FROM company_profile WHERE user_id = ${session.user.id} LIMIT 1`)
  )[0]
  const bc = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT market_position, target_market, business_model, competitive_positioning FROM bauplan_business_context WHERE bauplan_id = ${draftId} LIMIT 1`)
  )[0]
  const product = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT product_name, product_type, product_summary FROM bauplan_product WHERE bauplan_id = ${draftId} LIMIT 1`)
  )[0]

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const systemPrompt = `Du bist ein B2B-ICP-Analyst. Du schlaegst Pill-Vorschlaege fuer das ICP (Ideal Customer Profile) vor — anklickbare Pills, der User waehlt aus, was passt.

WICHTIGSTE REGELN:
1. KEINE HALLUZINATION. Nutze ausschliesslich COMPANY-PROFILE + BUSINESS-KONTEXT + PRODUKT als Anker.
2. CFO-Sprache ist nicht VP-Sales-Sprache — orientiere Dich an der konkreten Rolle.
3. Pains und Gains: KONKRET, nicht "Mehr Effizienz". Schmerz/Wunsch + Reality + Economic Impact + KPI.
4. Pains und Gains MUESSEN wenn moeglich an eine der vorgeschlagenen Currencies "linked" sein (via linkedCurrencyMetric Feld).

Antwort als gueltiges JSON.`

  const userPrompt = `COMPANY-PROFILE:
- Summary: ${profile?.summary ?? '—'}
- Value Proposition: ${profile?.value_proposition ?? '—'}
- Zielgruppe: ${profile?.target_audience ?? '—'}
- Branche: ${profile?.industry ?? '—'}

BUSINESS-KONTEXT:
- Markt-Position: ${bc?.market_position ?? '—'}
- Zielmarkt: ${bc?.target_market ?? '—'}

PRODUKT:
- Name: ${product?.product_name ?? '—'}
- Summary: ${product?.product_summary ?? '—'}

Gib zurueck:
{
  "pills": {
    "roles": [ { "text": "VP Sales B2B SaaS" }, { "text": "Head of Sales" }, ... 3-5 ],
    "whereToMeet": [ { "text": "LinkedIn" }, { "text": "SaaStr" }, ... 3-6 ],
    "currencies": [
      { "metric": "Pipeline-Coverage", "unit": "x", "rangeLabel": "3-5x" },
      ... 4-6
    ],
    "pains": [
      { "topic": "Forecast wird Hoffnung", "reality": "Letzte Pipeline-Calls sind Hoffnungs-Calls.", "economicImpact": "~25% Q-Schwankung", "kpi": "Forecast-Accuracy", "linkedCurrencyMetric": "Forecast-Accuracy" },
      ... 4-6
    ],
    "gains": [
      { "topic": "Forecast wird Vertrag", "reality": "Pipeline-Calls werden zu Reviews mit klaren Commits.", "economicImpact": "Forecast-Varianz unter 8%", "kpi": "Forecast-Accuracy", "linkedCurrencyMetric": "Forecast-Accuracy" },
      ... 3-4
    ]
  }
}

Nur das JSON-Objekt.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) return NextResponse.json({ error: `OpenAI ${res.status}` }, { status: 502 })
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(content) } catch { return NextResponse.json({ error: 'AI returned non-JSON' }, { status: 502 }) }
    return NextResponse.json({ ok: true, pills: parsed.pills ?? {} })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
