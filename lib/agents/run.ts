import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureAgentSchema, type AgentDef, type StepDef } from './schema'
import { loadPacks, renderPacks, bannedWords } from './knowledge'
import { lint, lintReport } from './lint'
import { resolveModel } from '@/lib/strategy/models'
import { recordUsage } from '@/lib/strategy/usage'
import { runSearch, COLLECT_INSTRUCTION } from '@/lib/strategy/research/web'
import { factMap } from '@/lib/strategy/facts'
import { catalogFor, renderCatalog } from '@/lib/content/catalog'

/**
 * Der Kern.
 *
 * `advance` arbeitet Schritte ab, solange das Zeitbudget reicht, und gibt dann
 * zurueck. Wer den Lauf antreibt, ist dem Agenten egal: heute der Aufrufer, der
 * nachfragt, spaeter eine Warteschlange. Diese Entkopplung ist der Grund fuer die
 * Schritt-Tabelle — ohne sie muesste jeder Agent in eine Funktion passen, und
 * Recherche plus drei Varianten passen dort nicht hinein.
 */

const BUDGET_MS = 230_000

export interface RunHandle { id: string; status: string; cursor: number; output?: unknown }

/* ─────────────────────────── Registry ─────────────────────────── */

export async function activeAgent(key: string): Promise<AgentDef | null> {
  await ensureAgentSchema()
  const rows = await db.execute(sql`SELECT * FROM agents WHERE key = ${key} AND is_active LIMIT 1`)
  return (rows as unknown as AgentDef[])[0] ?? null
}

export async function listAgents(): Promise<AgentDef[]> {
  await ensureAgentSchema()
  const rows = await db.execute(sql`SELECT * FROM agents WHERE is_active ORDER BY key`)
  return rows as unknown as AgentDef[]
}

export async function publishAgent(a: Omit<AgentDef, 'id' | 'version'> & { notes?: string }) {
  await ensureAgentSchema()
  const cur = (await db.execute(sql`
    SELECT COALESCE(MAX(version), 0) AS v FROM agents WHERE key = ${a.key}`)) as unknown as { v: number }[]
  const next = Number(cur[0]?.v ?? 0) + 1
  await db.execute(sql`UPDATE agents SET is_active = false, updated_at = now() WHERE key = ${a.key} AND is_active`)
  const rows = await db.execute(sql`
    INSERT INTO agents (key, version, title, description, input_schema, output_schema, steps, knowledge,
      scopes, default_model_role, is_active, notes)
    VALUES (${a.key}, ${next}, ${a.title}, ${a.description ?? null},
            ${JSON.stringify(a.input_schema)}::jsonb, ${JSON.stringify(a.output_schema)}::jsonb,
            ${JSON.stringify(a.steps)}::jsonb, ${JSON.stringify(a.knowledge)}::jsonb,
            ${JSON.stringify(a.scopes)}::jsonb, ${a.default_model_role}, true, ${a.notes ?? null})
    RETURNING id, version`)
  return (rows as unknown as { id: string; version: number }[])[0]
}

/* ─────────────────────────── Lauf ─────────────────────────── */

export async function startRun(input: {
  agentKey: string; input: Record<string, unknown>
  orgId?: string | null; productId?: string | null
  userId?: string | null; via?: string
}): Promise<RunHandle> {
  const agent = await activeAgent(input.agentKey)
  if (!agent) throw new Error(`Kein aktiver Agent "${input.agentKey}"`)

  const rows = await db.execute(sql`
    INSERT INTO agent_runs (agent_key, agent_version, org_id, product_id, input, created_by, created_via, status)
    VALUES (${agent.key}, ${agent.version}, ${input.orgId ?? null}, ${input.productId ?? null},
            ${JSON.stringify(input.input)}::jsonb, ${input.userId ?? null}, ${input.via ?? 'ui'}, 'offen')
    RETURNING id`)
  const runId = (rows as unknown as { id: string }[])[0].id

  let seq = 0
  for (const step of agent.steps) {
    await db.execute(sql`
      INSERT INTO agent_run_steps (run_id, seq, step_key, kind, status)
      VALUES (${runId}, ${seq++}, ${step.key}, ${step.kind}, 'offen')`)
  }
  return { id: runId, status: 'offen', cursor: 0 }
}

interface RunRow {
  id: string; agent_key: string; agent_version: number; org_id: string | null; product_id: string | null
  status: string; input: Record<string, unknown>; output: Record<string, unknown> | null
  assumptions: string[]; cursor: number
}

export async function getRun(runId: string) {
  await ensureAgentSchema()
  const rows = await db.execute(sql`SELECT * FROM agent_runs WHERE id = ${runId} LIMIT 1`)
  const run = (rows as unknown as RunRow[])[0]
  if (!run) return null
  const steps = await db.execute(sql`
    SELECT seq, step_key, kind, status, model, tokens_in, tokens_out, duration_ms, error, output
    FROM agent_run_steps WHERE run_id = ${runId} ORDER BY seq`)
  const artifacts = await db.execute(sql`
    SELECT step_key, kind, label, payload, created_at FROM agent_artifacts
    WHERE run_id = ${runId} ORDER BY created_at`)
  return { run, steps: steps as unknown as Array<Record<string, unknown>>, artifacts: artifacts as unknown as Array<Record<string, unknown>> }
}

/**
 * Einen oder mehrere Schritte abarbeiten.
 *
 * Gibt zurueck, sobald das Budget knapp wird — nicht wenn es aufgebraucht ist.
 * Ein Schritt, der mitten im Modellaufruf abgeschnitten wird, kostet Geld und
 * liefert nichts.
 */
export async function advance(runId: string): Promise<RunHandle> {
  const t0 = Date.now()
  const loaded = await getRun(runId)
  if (!loaded) throw new Error('Lauf nicht gefunden')
  const { run } = loaded
  if (run.status === 'fertig' || run.status === 'fehler') {
    return { id: run.id, status: run.status, cursor: run.cursor, output: run.output }
  }

  const agent = (await db.execute(sql`
    SELECT * FROM agents WHERE key = ${run.agent_key} AND version = ${run.agent_version} LIMIT 1`)) as unknown as AgentDef[]
  const def = agent[0]
  if (!def) throw new Error('Agenten-Fassung nicht gefunden')

  await db.execute(sql`UPDATE agent_runs SET status = 'laeuft', updated_at = now() WHERE id = ${runId}`)

  const ctx: Ctx = {
    runId, def, orgId: run.org_id, productId: run.product_id,
    input: run.input, assumptions: [...(run.assumptions ?? [])],
    results: {}, packs: '', banned: [], material: '',
  }
  // Ergebnisse der bereits erledigten Schritte einsammeln.
  for (const s of loaded.steps) {
    if (s.status === 'fertig' && s.output) ctx.results[String(s.step_key)] = s.output
  }
  if (ctx.results.kontext) {
    const k = ctx.results.kontext as { packs?: string; banned?: string[]; material?: string }
    ctx.packs = k.packs ?? ''
    ctx.banned = k.banned ?? []
    ctx.material = k.material ?? ''
  }

  let cursor = run.cursor
  while (cursor < def.steps.length) {
    if (Date.now() - t0 > BUDGET_MS - 40_000) break
    const step = def.steps[cursor]

    if (step.onlyIf && !truthy(ctx.input[step.onlyIf])) {
      await finishStep(runId, cursor, 'uebersprungen', null)
      cursor++
      continue
    }

    await db.execute(sql`
      UPDATE agent_run_steps SET status = 'laeuft', started_at = now() WHERE run_id = ${runId} AND seq = ${cursor}`)
    const started = Date.now()
    try {
      const out = await runStep(step, ctx)
      ctx.results[step.key] = out.value
      if (step.kind === 'kontext') {
        const k = out.value as { packs?: string; banned?: string[]; material?: string }
        ctx.packs = k.packs ?? ''; ctx.banned = k.banned ?? []; ctx.material = k.material ?? ''
      }
      await finishStep(runId, cursor, 'fertig', out.value, {
        model: out.model, tokensIn: out.tokensIn, tokensOut: out.tokensOut,
        duration: Date.now() - started,
      })
      if (out.tokensIn || out.tokensOut) {
        await bill(runId, run.org_id, run.product_id, def.key, step.key, out.model, out.tokensIn ?? 0, out.tokensOut ?? 0)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await finishStep(runId, cursor, 'fehler', null, { error: msg, duration: Date.now() - started })
      if (!step.optional) {
        await db.execute(sql`
          UPDATE agent_runs SET status = 'fehler', error = ${msg}, cursor = ${cursor},
            assumptions = ${JSON.stringify(ctx.assumptions)}::jsonb, finished_at = now(), updated_at = now()
          WHERE id = ${runId}`)
        return { id: runId, status: 'fehler', cursor }
      }
    }
    cursor++
    await db.execute(sql`
      UPDATE agent_runs SET cursor = ${cursor}, assumptions = ${JSON.stringify(ctx.assumptions)}::jsonb,
        updated_at = now() WHERE id = ${runId}`)
  }

  const done = cursor >= def.steps.length
  if (done) {
    const output = ctx.results[def.steps[def.steps.length - 1].key] ?? ctx.results
    await db.execute(sql`
      UPDATE agent_runs SET status = 'fertig', output = ${JSON.stringify(output)}::jsonb,
        assumptions = ${JSON.stringify(ctx.assumptions)}::jsonb, finished_at = now(), updated_at = now()
      WHERE id = ${runId}`)
    return { id: runId, status: 'fertig', cursor, output }
  }
  await db.execute(sql`UPDATE agent_runs SET status = 'offen', updated_at = now() WHERE id = ${runId}`)
  return { id: runId, status: 'offen', cursor }
}

const truthy = (v: unknown) => v !== undefined && v !== null && v !== false && v !== '' && v !== 0

async function finishStep(
  runId: string, seq: number, status: string, output: unknown,
  extra?: { model?: string; tokensIn?: number; tokensOut?: number; duration?: number; error?: string },
) {
  await db.execute(sql`
    UPDATE agent_run_steps SET status = ${status},
      output = ${output === null || output === undefined ? null : JSON.stringify(output)}::jsonb,
      model = ${extra?.model ?? null}, tokens_in = ${extra?.tokensIn ?? 0}, tokens_out = ${extra?.tokensOut ?? 0},
      duration_ms = ${extra?.duration ?? null}, error = ${extra?.error ?? null}, finished_at = now()
    WHERE run_id = ${runId} AND seq = ${seq}`)
}

async function bill(
  runId: string, orgId: string | null, productId: string | null,
  agentKey: string, stepKey: string, model: string | undefined, tin: number, tout: number,
) {
  await db.execute(sql`
    UPDATE agent_runs SET tokens_in = tokens_in + ${tin}, tokens_out = tokens_out + ${tout}
    WHERE id = ${runId}`)
  if (!orgId) return
  await recordUsage({
    companyId: orgId, productId,
    action: `${agentKey} · ${stepKey}`, agentKey, model: model ?? 'gpt-4.1',
    tokensIn: tin, tokensOut: tout, aiRunId: null,
  }).catch(() => {})
}

/* ─────────────────────────── Schritte ─────────────────────────── */

interface Ctx {
  runId: string; def: AgentDef
  orgId: string | null; productId: string | null
  input: Record<string, unknown>
  assumptions: string[]
  results: Record<string, unknown>
  packs: string; banned: string[]; material: string
}

interface StepOut { value: unknown; model?: string; tokensIn?: number; tokensOut?: number }

async function runStep(step: StepDef, ctx: Ctx): Promise<StepOut> {
  switch (step.kind) {
    case 'intake': return intake(ctx)
    case 'kontext': return kontext(ctx)
    case 'recherche': return recherche(step, ctx)
    case 'modell': return callModel(step, ctx)
    case 'faecher': return fanout(step, ctx)
    case 'sektionen': return sections(step, ctx)
    case 'lint': return linter(step, ctx)
    case 'revision': return revision(step, ctx)
    case 'sammeln': return collect(ctx)
    default: throw new Error(`Unbekannte Schrittart: ${step.kind}`)
  }
}

/** Seiten in Woerter, Luecken in Annahmen. Niemand wird gefragt. */
function intake(ctx: Ctx): StepOut {
  const i = ctx.input
  const laenge = (i.laenge ?? {}) as { wert?: number; einheit?: string }
  const words = laenge.einheit === 'seiten' ? Math.round((laenge.wert ?? 1) * 450) : (laenge.wert ?? 700)

  if (!i.tonalitaet) ctx.assumptions.push('Tonalität nicht angegeben — es gilt die Voice-Charta des Mandanten.')
  if (!i.ueberzeugungsziel) {
    ctx.assumptions.push('Kein Überzeugungsziel angegeben — der Text arbeitet auf Erkennen hin, nicht auf Handeln.')
  }
  if (!i.ansprache) ctx.assumptions.push('Ansprache nicht gesetzt — es wird die im Kontext vorherrschende übernommen.')
  if (!laenge.wert) ctx.assumptions.push(`Keine Länge angegeben — ${words} Wörter als Richtwert.`)

  return {
    value: {
      audience: i.audience ?? null,
      kontext: i.context_md ?? i.kontext ?? '',
      inhalte: i.inhalte ?? '',
      tonalitaet: i.tonalitaet ?? null,
      ueberzeugungsziel: i.ueberzeugungsziel ?? null,
      textart: i.textart ?? 'blog',
      ansprache: i.ansprache ?? null,
      ziel_woerter: words,
      recherche: Boolean(i.recherche),
    },
  }
}

/**
 * Wissen zusammenstellen: Pakete, Strategie-Fakten, Katalog.
 *
 * Hier fuettern sich die Ebenen gegenseitig — was die Strategie ueber Pains,
 * Gains und Saeulen weiss, steht dem Schreiber zur Verfuegung, und was der
 * Schreiber am Ende veroeffentlicht, kommt als Beleg in den Katalog zurueck.
 */
async function kontext(ctx: Ctx): Promise<StepOut> {
  const packs = await loadPacks(ctx.def.knowledge ?? [], ctx.orgId)
  const parts: string[] = [renderPacks(packs)]

  if (ctx.orgId) {
    const facts = await factMap(ctx.orgId, ctx.productId, [
      'icp.segments', 'icp.pains', 'icp.gains', 'icp.currencies',
      'messaging.pillars', 'conviction.stages', 'beef.rows', 'positioning.whitespace',
    ]).catch(() => ({} as Record<string, unknown>))
    const lines = Object.entries(facts)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `**${k}**\n${typeof v === 'string' ? v : JSON.stringify(v, null, 2)}`)
    if (lines.length) {
      parts.push(`### Was die Strategie über diesen Kunden weiß\n\n${lines.join('\n\n')}`)
    }

    const cat = await catalogFor({
      companyId: ctx.orgId,
      channel: String((ctx.results.aufnahme as { textart?: string })?.textart ?? ''),
      perKind: 6,
    }).catch(() => ({} as Record<string, Array<Record<string, unknown>>>))
    const rendered = renderCatalog(cat)
    if (rendered) parts.push(`### ${rendered}`)
  }

  return {
    value: {
      packs: parts.filter(Boolean).join('\n\n---\n\n'),
      banned: bannedWords(packs),
      material: String(ctx.input.context_md ?? ctx.input.kontext ?? ''),
      pack_keys: packs.map((p) => p.key),
    },
  }
}

async function recherche(step: StepDef, ctx: Ctx): Promise<StepOut> {
  const a = ctx.results.aufnahme as Record<string, unknown> | undefined
  const thema = String(a?.inhalte ?? ctx.input.inhalte ?? '')
  const audience = String(a?.audience ?? '')
  const queries = step.queries?.length ? step.queries : [
    `Belege, Zahlen und Studien zu: ${thema}`,
    `Was ${audience} dazu öffentlich schreibt — Foren, Bewertungen, Beiträge`,
  ]
  let tin = 0, tout = 0
  const findings = []
  for (const q of queries.slice(0, 3)) {
    const f = await runSearch('recherche', q, COLLECT_INSTRUCTION)
    tin += f.tokensIn; tout += f.tokensOut
    findings.push({ query: q, text: f.text, citations: f.citations, error: f.error })
  }
  await db.execute(sql`
    INSERT INTO agent_artifacts (run_id, step_key, kind, label, payload)
    VALUES (${ctx.runId}, ${step.key}, 'recherche', 'Fundstellen', ${JSON.stringify(findings)}::jsonb)`)
  return {
    value: {
      material: findings.map((f) => `#### ${f.query}\n${f.text}\n${(f.citations ?? []).map((c) => `- ${c.url}`).join('\n')}`).join('\n\n'),
      quellen: findings.flatMap((f) => f.citations ?? []),
    },
    model: process.env.STRATEGY_SEARCH_MODEL ?? 'gpt-4.1', tokensIn: tin, tokensOut: tout,
  }
}

/** Platzhalter der Form {{schritt.feld}} oder {{eingabe.feld}} aufloesen. */
function render(tpl: string, ctx: Ctx, extra?: Record<string, unknown>): string {
  return tpl.replace(/\{\{([a-z0-9_.]+)\}\}/gi, (_m, path: string) => {
    if (path === 'wissen') return ctx.packs
    if (path === 'material') return ctx.material
    const [head, ...rest] = path.split('.')
    const base = head === 'eingabe' ? ctx.input : (extra?.[head] ?? ctx.results[head])
    let v: unknown = base
    for (const p of rest) v = (v as Record<string, unknown> | undefined)?.[p]
    if (v === undefined || v === null) return ''
    return typeof v === 'string' ? v : JSON.stringify(v, null, 2)
  })
}

async function ask(step: StepDef, ctx: Ctx, extra?: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY fehlt')
  const model = resolveModel((step.modelRole ?? ctx.def.default_model_role) as never, null)
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: step.temperature ?? 0.5,
      max_tokens: step.maxTokens ?? 4000,
      messages: [
        { role: 'system', content: render(step.system ?? '', ctx, extra) },
        { role: 'user', content: render(step.user ?? '', ctx, extra) },
      ],
      response_format: step.schema
        ? { type: 'json_schema', json_schema: { name: 'ergebnis', schema: step.schema, strict: false } }
        : { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`Modell ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return {
    value: JSON.parse(data.choices?.[0]?.message?.content ?? '{}'),
    model,
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  }
}

const callModel = (step: StepDef, ctx: Ctx) => ask(step, ctx)

/** Derselbe Auftrag mehrfach, mit bewusst verschiedenem Einstieg. */
async function fanout(step: StepDef, ctx: Ctx): Promise<StepOut> {
  const variants = step.variants ?? ['Szene', 'Beobachtung', 'Frage']
  const n = Math.min(step.fanout ?? variants.length, 4)
  const runs = await Promise.all(
    variants.slice(0, n).map((v) => ask(step, ctx, { variante: { ansatz: v } })),
  )
  for (let i = 0; i < runs.length; i++) {
    await db.execute(sql`
      INSERT INTO agent_artifacts (run_id, step_key, kind, label, payload)
      VALUES (${ctx.runId}, ${step.key}, 'variante', ${variants[i]}, ${JSON.stringify(runs[i].value)}::jsonb)`)
  }
  return {
    value: { varianten: runs.map((r, i) => ({ ansatz: variants[i], ...(r.value as object) })) },
    model: runs[0]?.model,
    tokensIn: runs.reduce((s, r) => s + r.tokensIn, 0),
    tokensOut: runs.reduce((s, r) => s + r.tokensOut, 0),
  }
}

/**
 * Abschnitt fuer Abschnitt schreiben.
 *
 * Das ist die Antwort auf den haeufigsten Fehler bei langen Texten: Man bittet
 * um 1.500 Woerter und bekommt 400. Kein Hinweis im Prompt aendert das
 * zuverlaessig — ein Modell schreibt bis zum gefuehlten Ende des Gedankens, und
 * das liegt fast immer frueher als das Budget.
 *
 * Also wird nicht einmal um 1.500 Woerter gebeten, sondern achtmal um 190. Jeder
 * Abschnitt kennt sein Budget, den vorigen Schluss fuer den Uebergang und seinen
 * eigenen Auftrag. Wer trotzdem zu kurz bleibt, wird einmal zum Ausbauen
 * zurueckgeschickt — mit der Auflage, zu vertiefen und nicht zu wiederholen.
 */
async function sections(step: StepDef, ctx: Ctx): Promise<StepOut> {
  const from = step.sections ?? 'struktur'
  const plan = (ctx.results[from] as {
    abschnitte?: Array<{ name: string; woerter: number; beats?: string[]; beleg?: string; stufe?: string }>
    titel_vorschlag?: string
  }) ?? {}
  const parts = plan.abschnitte ?? []
  if (!parts.length) throw new Error(`Keine Gliederung in "${from}"`)

  const minRatio = step.minRatio ?? 0.85
  const out: Array<{ name: string; text: string; woerter: number; budget: number; nachgelegt: boolean }> = []
  let tin = 0, tout = 0, model: string | undefined
  let tail = ''

  for (const s of parts) {
    const budget = Math.max(60, Number(s.woerter) || 200)
    const write = async (extra: Record<string, unknown>) => {
      const res = await ask(step, ctx, {
        abschnitt: { ...s, budget },
        vorher: { schluss: tail.slice(-400) },
        ...extra,
      })
      tin += res.tokensIn; tout += res.tokensOut; model = res.model
      return String((res.value as { text?: string }).text ?? '')
    }

    let text = await write({})
    let words = text.trim().split(/\s+/).filter(Boolean).length
    let nachgelegt = false

    if (words < budget * minRatio) {
      // Einmal nachlegen. Nicht zweimal — wer beim zweiten Versuch immer noch zu
      // kurz bleibt, hat zum Thema nicht mehr zu sagen, und dann ist Dehnen
      // schlimmer als Kuerze.
      const fehlend = budget - words
      const laenger = await write({
        ausbauen: {
          bisher: text,
          fehlend,
          auftrag:
            `Dieser Abschnitt hat ${words} von ${budget} Woertern. Bau ihn auf ${budget} aus. ` +
            'Nimm eine konkrete Szene dazu, rechne einen Gedanken durch, oder nimm den Einwand ' +
            'vorweg, den ein skeptischer Leser hier haette. Wiederhole nichts, was schon dasteht.',
        },
      })
      const lw = laenger.trim().split(/\s+/).filter(Boolean).length
      if (lw > words) { text = laenger; words = lw; nachgelegt = true }
    }

    tail = text
    out.push({ name: s.name, text, woerter: words, budget, nachgelegt })
  }

  const full = out.map((s) => s.text.trim()).join('\n\n')
  const total = full.trim().split(/\s+/).filter(Boolean).length
  const soll = parts.reduce((a, s) => a + (Number(s.woerter) || 0), 0)

  await db.execute(sql`
    INSERT INTO agent_artifacts (run_id, step_key, kind, label, payload)
    VALUES (${ctx.runId}, ${step.key}, 'abschnitte', ${`${total} von ${soll} Woertern`},
            ${JSON.stringify(out)}::jsonb)`)

  return {
    value: {
      varianten: [{
        ansatz: 'Langform',
        titel: plan.titel_vorschlag ?? '',
        text: full,
        abschnitte: out,
        worin_anders: `${total} Wörter über ${out.length} Abschnitte, Ziel ${soll}.`,
      }],
      woerter: total, soll, nachgelegt: out.filter((s) => s.nachgelegt).length,
    },
    model, tokensIn: tin, tokensOut: tout,
  }
}

function linter(step: StepDef, ctx: Ctx): StepOut {
  const a = ctx.results.aufnahme as { ansprache?: string; ziel_woerter?: number } | undefined
  const from = step.source ?? 'entwuerfe'
  const drafts = (ctx.results[from] as { varianten?: Array<Record<string, unknown>> })?.varianten ?? []
  const reports = drafts.map((d) => {
    const text = String(d.text ?? d.inhalt ?? '')
    const r = lint({ text, banned: ctx.banned, address: a?.ansprache ?? null, targetWords: a?.ziel_woerter ?? null })
    return { ansatz: d.ansatz, ...r }
  })
  return {
    value: {
      quelle: from, berichte: reports,
      sauber: reports.every((r) => r.stats.fehler === 0),
      offen: reports.reduce((s, r) => s + r.findings.length, 0),
    },
  }
}

async function revision(step: StepDef, ctx: Ctx): Promise<StepOut> {
  const from = step.source ?? 'entwuerfe'
  const drafts = (ctx.results[from] as { varianten?: Array<Record<string, unknown>> })?.varianten ?? []
  const reports = (ctx.results[step.reports ?? 'pruefung'] as
    { berichte?: Array<{ findings: unknown[]; ansatz?: string }> })?.berichte ?? []
  const out: Array<Record<string, unknown>> = []
  let tin = 0, tout = 0, model: string | undefined

  for (let i = 0; i < drafts.length; i++) {
    const findings = reports[i]?.findings ?? []
    if (!findings.length) { out.push(drafts[i]); continue }
    const r = await ask(step, ctx, {
      variante: drafts[i],
      befunde: { liste: lintReport(findings as never) },
    })
    tin += r.tokensIn; tout += r.tokensOut; model = r.model
    out.push({ ...drafts[i], ...(r.value as object) })
  }
  return { value: { varianten: out }, model, tokensIn: tin, tokensOut: tout }
}

function collect(ctx: Ctx): StepOut {
  const final = (ctx.results.revision as { varianten?: unknown[] })?.varianten
    ?? (ctx.results.entwuerfe as { varianten?: unknown[] })?.varianten
    ?? []
  const quellen = (ctx.results.recherche as { quellen?: unknown[] })?.quellen ?? []
  // Der spaetere Bericht zaehlt: er beurteilt, was am Ende dasteht, nicht den
  // Entwurf davor.
  const lintOut = ctx.results.nachpruefung ?? ctx.results.pruefung ?? null
  return {
    value: {
      varianten: final,
      annahmen: ctx.assumptions,
      quellen,
      pruefung: lintOut,
      wissen: (ctx.results.kontext as { pack_keys?: string[] })?.pack_keys ?? [],
    },
  }
}
