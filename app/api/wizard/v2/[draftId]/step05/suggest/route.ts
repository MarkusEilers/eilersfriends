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

  const profile = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT summary, target_audience, industry FROM company_profile WHERE user_id = ${session.user.id} LIMIT 1`)
  )[0]
  const product = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT product_name, product_summary FROM bauplan_product WHERE bauplan_id = ${draftId} LIMIT 1`)
  )[0]
  const blocks = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT id, name, description FROM bauplan_building_blocks WHERE bauplan_id = ${draftId}`)
  )

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const blockList = blocks.map((b) => `- ${b.name} (id=${b.id}): ${b.description ?? ''}`).join('\n') || '(noch keine Bausteine)'

  const systemPrompt = `Du identifizierst FUTURE PROBLEMS, die ein Kunde bei erfolgreicher Umsetzung des B2B-Angebots in 6-18 Monaten treffen wird.

REGELN:
- 5 Future Problems. Vorhersehbar, branchen-typisch.
- Pro Problem: problem (1 Satz), trigger (warum tritt es auf), solvedThrough (id eines passenden Bausteins, oder null wenn keiner passt).
- WENN ein Baustein das Problem mit-loest: solvedThrough = block-id + marginalCost (z.B. "1 Workshop-Tag", "0 — schon im Programm")
- WENN kein Baustein passt: solvedThrough = null (User soll dann einen Bonus ergaenzen)

KEINE HALLUZINATION — nur Probleme, die fuer das spezifische Produkt + Industrie typisch sind.

Antwort als JSON.`

  const userPrompt = `COMPANY: ${profile?.summary ?? '—'} (${profile?.industry ?? '—'})
ZIELGRUPPE: ${profile?.target_audience ?? '—'}
PRODUKT: ${product?.product_name ?? '—'} — ${product?.product_summary ?? '—'}

BAUSTEINE:
${blockList}

Gib zurueck:
{
  "problems": [
    { "problem": "...", "trigger": "...", "solvedThrough": "block-id-or-null", "marginalCost": "..." }
  ]
}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini', temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) return NextResponse.json({ error: `OpenAI ${res.status}` }, { status: 502 })
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(content) } catch { return NextResponse.json({ error: 'AI returned non-JSON' }, { status: 502 }) }
    return NextResponse.json({ ok: true, problems: parsed.problems ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
