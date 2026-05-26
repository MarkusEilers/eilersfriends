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

export async function POST(_req: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params
  await ensureCompanyProfile()
  await ensureBauplanV2Tables()

  // Pull WHY-cards, challenges/outcomes, future-solved
  const whyCards = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT text FROM bauplan_beef_radar_cards WHERE bauplan_id = ${draftId} AND "column" = 'why'`)
  ).map((r) => r.text as string)
  const challenges = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT topic, reality, economic_impact FROM bauplan_challenges WHERE bauplan_id = ${draftId}`)
  )
  const futureProblems = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT problem, marginal_cost FROM bauplan_future_problems WHERE bauplan_id = ${draftId} AND solved_through IS NOT NULL`)
  )

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const systemPrompt = `Du clusterst wirtschaftliche Wirkungen eines B2B-Angebots zu 3-5 EconomicClustern mit €-Bewertung.

REGELN:
1. Cluster sind THEMATISCH gruppiert (z.B. "Cycle-Zeit-Verkuerzung", "Ramp-Up beschleunigt", "Forecast-Verlaesslichkeit")
2. Pro Cluster eine konkrete €-Zahl, Einheit (user/quarter, user/year, department/quarter/year, company/quarter/year)
3. confidenceLevel: "belegt" wenn Quelle direkt zaehlt, "hypothese" wenn berechnet, "branchen-anker" wenn Industry-Avg
4. methodology bei "hypothese" PFLICHT — z.B. "3 FTE × 4h/Wo × 47 Wo × 90 €/h = 50.760 €"

Antwort als JSON.`

  const userPrompt = `WELLENEFFEKTE (aus Beef-Radar WHY):
${whyCards.map((w) => '- ' + w).join('\n') || '(keine)'}

HERAUSFORDERUNGEN:
${challenges.map((c) => `- ${c.topic}: ${c.reality} (Impact: ${c.economic_impact})`).join('\n') || '(keine)'}

GELOESTE FUTURE-PROBLEMS:
${futureProblems.map((f) => `- ${f.problem} (Cost: ${f.marginal_cost})`).join('\n') || '(keine)'}

Gib zurueck:
{
  "clusters": [
    {
      "clusterName": "Cycle-Zeit-Verkuerzung",
      "economicValuePerUnit": 240000,
      "unit": "company/year",
      "confidenceLevel": "hypothese",
      "methodology": "Avg-Cycle 5 Mo → 3 Mo, 12 Deals/Jahr × 100k Cash-Bindung × 8% Opportunity-Cost",
      "containedCards": []
    }
  ]
}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini', temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) return NextResponse.json({ error: `OpenAI ${res.status}` }, { status: 502 })
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(content) } catch { return NextResponse.json({ error: 'AI returned non-JSON' }, { status: 502 }) }
    return NextResponse.json({ ok: true, clusters: parsed.clusters ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
