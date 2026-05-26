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

  const profile = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT summary, target_audience, industry FROM company_profile WHERE user_id = ${session.user.id} LIMIT 1`)
  )[0]
  const bc = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT market_position, target_market FROM bauplan_business_context WHERE bauplan_id = ${draftId} LIMIT 1`)
  )[0]
  const product = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT product_name, product_summary FROM bauplan_product WHERE bauplan_id = ${draftId} LIMIT 1`)
  )[0]
  const icp = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT demographics, pains_gains FROM bauplan_icp WHERE bauplan_id = ${draftId} LIMIT 1`)
  )[0]

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const systemPrompt = `Du analysierst, welche aktuellen Herausforderungen die Kunden-Firma heute spuert und welche neuen Ergebnisse sie sich erhofft.

UNTERSCHIED ZU ICP:
- ICP-Pains sind PERSONEN-ZENTRISCH (was die Rolle Lena taeglich erlebt — identitaets-gebunden).
- Step 03 ist SITUATIONS-ZENTRISCH (was die Kunden-Firma als Ganzes nicht hinkriegt bzw. erreichen will — projekt-bezogen).

REGELN:
1. KEINE HALLUZINATION. Nutze Welcome + Business + Produkt + ICP-Demographics als Anker.
2. WORDING: NIE "Probleme" — immer "Herausforderungen" (heute) / "Ergebnisse" (Wunsch).
3. Pro Item: topic (max 6 Worte), reality (1-2 Saetze), economicImpact (€/% pro Q oder Jahr), kpi.

Antwort als JSON.`

  const userPrompt = `COMPANY-PROFILE:
- Summary: ${profile?.summary ?? '—'}
- Zielgruppe: ${profile?.target_audience ?? '—'}

PRODUKT:
- Name: ${product?.product_name ?? '—'}
- Summary: ${product?.product_summary ?? '—'}

ICP-Rolle: ${(icp?.demographics as Record<string, unknown> | undefined)?.role ?? '—'}

Gib zurueck:
{
  "pills": {
    "challenges": [
      { "topic": "Lange Sales-Cycles", "reality": "Deals brauchen 4-6 Mo", "economicImpact": "~80k €/Quartal Cash-Bindung", "kpi": "Days-to-Close" },
      ... 5-7
    ],
    "outcomes": [
      { "topic": "Cycles unter 3 Mo", "reality": "Deals schliessen in 8-12 Wochen", "economicImpact": "+240k €/Jahr Cash-Verfuegbarkeit", "kpi": "Days-to-Close" },
      ... 3-5
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
