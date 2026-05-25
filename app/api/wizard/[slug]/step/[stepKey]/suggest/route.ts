import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensurePromptTables, ensureWizardTables, ensureCompanyProfile } from '@/lib/db/self-heal'
import { getDefaultStep } from '@/lib/wizard/step-prompts'
import { enrichSystemPrompt } from '@/lib/wizard/enrich'
import { buildWizardContext, contextSummary } from '@/lib/wizard/context'

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
  { params }: { params: Promise<{ slug: string; stepKey: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug, stepKey } = await params
  const body = await request.json().catch(() => ({} as Record<string, unknown>))

  await ensurePromptTables()
  await ensureWizardTables()
  await ensureCompanyProfile()

  type Row = { system_prompt: string; voice: string | null; framework: string | null; model: string; temperature: number; output_schema: Record<string, unknown> }
  const dbRows = (await db.execute(sql`
    SELECT system_prompt, voice, framework, model, temperature, output_schema
    FROM framework_step_prompts WHERE framework_slug = ${slug} AND step_key = ${stepKey} LIMIT 1
  `)) as unknown as Row[] | { rows: Row[] }
  const list = Array.isArray(dbRows) ? dbRows : (dbRows.rows ?? [])
  let cfg: Row | null = list[0] ?? null
  if (!cfg) {
    const fallback = getDefaultStep(slug, stepKey)
    if (!fallback) return NextResponse.json({ error: `Step not found: ${slug}/${stepKey}` }, { status: 404 })
    cfg = {
      system_prompt: fallback.systemPrompt,
      voice: fallback.voice ?? null,
      framework: fallback.framework ?? null,
      model: 'gpt-4o-mini',
      temperature: 0.5,
      output_schema: fallback.outputSchema,
    }
  }
  const systemPrompt = enrichSystemPrompt(cfg.system_prompt, {
    voice: cfg.voice ?? undefined,
    framework: cfg.framework ?? undefined,
    locale: 'de',
  })

  const profileRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT organisation_name, website, summary, value_proposition, target_audience, tone, keywords, products
      FROM company_profile WHERE user_id = ${session.user.id} LIMIT 1
    `)
  )
  const profile = profileRows[0] ?? null
  const profileText = profile ? `
COMPANY PROFILE (aus Welcome-Step):
- Organisation: ${profile.organisation_name ?? '—'}
- Website: ${profile.website ?? '—'}
- Summary: ${profile.summary ?? '—'}
- Value Proposition: ${profile.value_proposition ?? '—'}
- Target Audience: ${profile.target_audience ?? '—'}
- Tone: ${profile.tone ?? '—'}
- Keywords: ${Array.isArray(profile.keywords) ? (profile.keywords as string[]).join(', ') : '—'}
` : '\n(Welcome-Step noch nicht ausgefuellt — Profile fehlt.)\n'

  const ctx = await buildWizardContext(session.user.id, slug)
  const ctxSummary = ctx ? contextSummary(ctx) : '(Wizard noch nicht initialisiert)'

  const userPrompt = `Eingabe-Daten (aktueller Step):
${JSON.stringify(body, null, 2)}
${profileText}
Vorheriger Wizard-Kontext:
${ctxSummary}

Bitte gib die Antwort als gueltiges JSON nach diesem Output-Schema zurueck:
${JSON.stringify(cfg.output_schema, null, 2)}

Nur das JSON-Objekt, keinen umgebenden Text, kein Markdown.`

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: cfg.model, temperature: cfg.temperature,
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
    let parsed: unknown
    try { parsed = JSON.parse(content) } catch {
      return NextResponse.json({ error: 'AI returned non-JSON', raw: content.slice(0, 500) }, { status: 502 })
    }
    return NextResponse.json({ ok: true, result: parsed })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
