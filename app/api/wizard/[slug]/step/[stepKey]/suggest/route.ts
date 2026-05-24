import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensurePromptTables, ensureWizardTables } from '@/lib/db/self-heal'
import { getDefaultStep } from '@/lib/wizard/step-prompts'
import { enrichSystemPrompt } from '@/lib/wizard/enrich'
import { buildWizardContext, contextSummary } from '@/lib/wizard/context'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; stepKey: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { slug, stepKey } = await params
  const body = await request.json().catch(() => ({} as Record<string, unknown>))

  // Load step config from DB or fall back to code default
  await ensurePromptTables()
  await ensureWizardTables()

  type Row = { system_prompt: string; voice: string | null; framework: string | null; model: string; temperature: number; output_schema: Record<string, unknown> }
  const dbRows = (await db.execute(sql`
    SELECT system_prompt, voice, framework, model, temperature, output_schema
    FROM framework_step_prompts
    WHERE framework_slug = ${slug} AND step_key = ${stepKey}
    LIMIT 1
  `)) as unknown as Row[] | { rows: Row[] }
  const list = Array.isArray(dbRows) ? dbRows : (dbRows.rows ?? [])
  let cfg: Row | null = list[0] ?? null

  if (!cfg) {
    const fallback = getDefaultStep(slug, stepKey)
    if (!fallback) {
      return NextResponse.json({ error: `Step not found: ${slug}/${stepKey}` }, { status: 404 })
    }
    cfg = {
      system_prompt: fallback.systemPrompt,
      voice: fallback.voice ?? null,
      framework: fallback.framework ?? null,
      model: 'gpt-4o-mini',
      temperature: 0.5,
      output_schema: fallback.outputSchema,
    }
  }

  // Enrich system prompt with voice + framework + locale
  const systemPrompt = enrichSystemPrompt(cfg.system_prompt, {
    voice: cfg.voice ?? undefined,
    framework: cfg.framework ?? undefined,
    locale: 'de',
  })

  // Build context from previous steps
  const ctx = await buildWizardContext(session.user.id, slug)
  const ctxSummary = ctx ? contextSummary(ctx) : '(Wizard noch nicht initialisiert)'

  // User prompt = body input + context
  const userPrompt = `Eingabe-Daten:
${JSON.stringify(body, null, 2)}

Vorheriger Wizard-Kontext:
${ctxSummary}

Bitte gib die Antwort als gültiges JSON nach diesem Output-Schema zurück:
${JSON.stringify(cfg.output_schema, null, 2)}

Nur das JSON-Objekt, keinen umgebenden Text, kein Markdown.`

  // Call OpenAI
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: cfg.temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[wizard/suggest] OpenAI error:', res.status, text)
      return NextResponse.json({ error: `OpenAI ${res.status}`, detail: text.slice(0, 500) }, { status: 502 })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'AI returned non-JSON', raw: content.slice(0, 500) }, { status: 502 })
    }

    return NextResponse.json({ ok: true, result: parsed })
  } catch (err) {
    console.error('[wizard/suggest] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
