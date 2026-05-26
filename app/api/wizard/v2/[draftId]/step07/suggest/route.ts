import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureCompanyProfile } from '@/lib/db/self-heal'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'

export const runtime = 'nodejs'
export const maxDuration = 30
function rowsOf<T>(r: unknown): T[] { if (Array.isArray(r)) return r as T[]; if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] } return [] }

export async function POST(_r: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const s = await auth(); if (!s?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params
  await ensureCompanyProfile(); await ensureBauplanV2Tables()
  const profile = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT summary, target_audience FROM company_profile WHERE user_id = ${s.user.id} LIMIT 1`))[0]
  const product = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT product_name, product_summary FROM bauplan_product WHERE bauplan_id = ${draftId} LIMIT 1`))[0]
  const challenges = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT type, topic FROM bauplan_challenges WHERE bauplan_id = ${draftId}`))
  const blocks = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT id, name FROM bauplan_building_blocks WHERE bauplan_id = ${draftId}`))

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const startSyms = challenges.filter((c) => c.type === 'challenge').map((c) => c.topic).slice(0, 4)
  const endSyms = challenges.filter((c) => c.type === 'outcome').map((c) => c.topic).slice(0, 4)

  const systemPrompt = `Du baust einen BULLETPROOF DELIVERY PLAN: 3 Phasen mit Methodik-Namen, From/To-Transformationen, 2-3 Steps pro Phase. Phasen-Namen muessen INTRIGUING sein — keine generischen "Setup/Implementation/Optimization". Beispiele: "Beef-Sichtung", "Vertriebs-Heimkehr", "Marktest-Schaerfung". Antwort als JSON.`
  const userPrompt = `PRODUKT: ${product?.product_name ?? '—'} — ${product?.product_summary ?? '—'}
ZIELGRUPPE: ${profile?.target_audience ?? '—'}
START-SYMPTOMS: ${JSON.stringify(startSyms)}
END-PROOF: ${JSON.stringify(endSyms)}
BAUSTEINE: ${blocks.map((b) => b.name).join(', ')}

Gib zurueck:
{
  "plan": {
    "name": "Methodik-Name max 6 Worte",
    "startingPain": "Vivider Start-State max 4 Worte",
    "startSymptoms": ["...", "..."],
    "endGoal": "Vivider End-State max 4 Worte",
    "endProofPoints": ["...", "..."],
    "headlinePromise": "Von X zu Y in N Wochen",
    "phases": [
      {
        "name": "Methodik-Phase-Name",
        "fromState": "Von ...",
        "toState": "Zu ...",
        "description": "1-2 Saetze",
        "steps": [
          { "title": "Step-Name", "fromState": "Von", "toState": "Zu", "linkedBuildingBlockIds": [] }
        ]
      }
    ]
  }
}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.5, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] }),
    })
    if (!res.ok) return NextResponse.json({ error: `OpenAI ${res.status}` }, { status: 502 })
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(content) } catch { return NextResponse.json({ error: 'AI returned non-JSON' }, { status: 502 }) }
    return NextResponse.json({ ok: true, plan: parsed.plan ?? null })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}
