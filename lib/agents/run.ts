import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureAgentSchema, type AgentDef, type StepDef } from './schema'
import { PFLICHT_PACKS } from './material'
import { loadPacks, renderPacks, bannedWords, catalogIndex, loadItems, renderIndex, type IndexRow } from './knowledge'
import { lint, lintReport, type Finding } from './lint'
import { resolveModel } from '@/lib/strategy/models'
import { recordUsage } from '@/lib/strategy/usage'
import { runSearch, COLLECT_INSTRUCTION, sucheAnbieter } from '@/lib/strategy/research/web'
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

/**
 * Kein Fehler, sondern eine Vertagung.
 *
 * Ein Schritt, der laenger braucht, als eine Lambda-Laufzeit hergibt, wirft
 * das hier. Der Cursor bleibt stehen, der Schritt geht auf offen zurueck, und
 * der naechste Anlauf macht dort weiter, wo dieser aufgehoert hat.
 */
class Vertagt extends Error {
  constructor(public readonly stand: string) { super(stand) }
}

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
    results: {}, packs: '', packsKurz: '', banned: [], material: '',
  }
  // Ergebnisse der bereits erledigten Schritte einsammeln.
  for (const s of loaded.steps) {
    if (s.status === 'fertig' && s.output) ctx.results[String(s.step_key)] = s.output
  }
  if (ctx.results.kontext) {
    const k = ctx.results.kontext as { packs?: string; packs_kurz?: string; banned?: string[]; material?: string }
    ctx.packs = k.packs ?? ''
    ctx.packsKurz = k.packs_kurz ?? ''
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
        const k = out.value as { packs?: string; packs_kurz?: string; banned?: string[]; material?: string }
        ctx.packs = k.packs ?? ''; ctx.packsKurz = k.packs_kurz ?? ''
        ctx.banned = k.banned ?? []; ctx.material = k.material ?? ''
      }
      await finishStep(runId, cursor, 'fertig', out.value, {
        model: out.model, tokensIn: out.tokensIn, tokensOut: out.tokensOut,
        duration: Date.now() - started,
      })
      if (out.tokensIn || out.tokensOut) {
        await bill(runId, run.org_id, run.product_id, def.key, step.key, out.model,
          out.tokensIn ?? 0, out.tokensOut ?? 0, out.units ?? {})
      }
    } catch (e) {
      if (e instanceof Vertagt) {
        await db.execute(sql`
          UPDATE agent_run_steps SET status = 'offen', error = ${e.stand}, started_at = NULL
          WHERE run_id = ${runId} AND seq = ${cursor}`)
        await db.execute(sql`
          UPDATE agent_runs SET status = 'offen', cursor = ${cursor}, updated_at = now()
          WHERE id = ${runId}`)
        return { id: runId, status: 'offen', cursor }
      }
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
  units: Record<string, number> = {},
) {
  await db.execute(sql`
    UPDATE agent_runs SET tokens_in = tokens_in + ${tin}, tokens_out = tokens_out + ${tout}
    WHERE id = ${runId}`)
  if (!orgId) return
  await recordUsage({
    companyId: orgId, productId,
    action: `${agentKey} · ${stepKey}`, agentKey, model: model ?? 'gpt-4.1',
    tokensIn: tin, tokensOut: tout, units, aiRunId: null,
  }).catch(() => {})
}

/* ─────────────────────────── Schritte ─────────────────────────── */

interface Ctx {
  runId: string; def: AgentDef
  orgId: string | null; productId: string | null
  input: Record<string, unknown>
  assumptions: string[]
  results: Record<string, unknown>
  packs: string; packsKurz: string; banned: string[]; material: string
}

interface StepOut {
  value: unknown
  model?: string
  tokensIn?: number
  tokensOut?: number
  /** Was neben den Tokens verbraucht wurde: { web_search: 12, bild: 2 } */
  units?: Record<string, number>
}

async function runStep(step: StepDef, ctx: Ctx): Promise<StepOut> {
  switch (step.kind) {
    case 'intake': return intake(ctx)
    case 'kontext': return kontext(ctx)
    case 'recherche': return recherche(step, ctx)
    case 'modell': return callModel(step, ctx)
    case 'faecher': return fanout(step, ctx)
    case 'sektionen': return sections(step, ctx)
    case 'auswahl': return choose(step, ctx)
    case 'lint': return linter(step, ctx)
    case 'revision': return revision(step, ctx)
    case 'zerlegen': return zerlegen(step, ctx)
    case 'skelett': return skelett(step, ctx)
    case 'flicken': return flicken(step, ctx)
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

  // Fuer die Abschnitts-Aufrufe reicht das Pflichtwissen: Kernregelwerk,
  // Verbotsliste, Markus-Stimme, Selbstpruefung. Der ganze Block in jedem der
  // zehn Aufrufe kostet Minutenbudget und verduennt die Aufmerksamkeit auf
  // das, was in diesem Abschnitt zu tun ist.
  //
  // Die Auswahl laeuft ueber den Paketschluessel, nicht ueber die Art: Das
  // Kernregelwerk ist eine "methode" und waere sonst genau da weggefallen, wo
  // es am meisten gebraucht wird — beim Schreiben.
  const pflicht = new Set(PFLICHT_PACKS)
  const kurz = renderPacks(packs.filter((p) => pflicht.has(p.key)))

  return {
    value: {
      packs: parts.filter(Boolean).join('\n\n---\n\n'),
      packs_kurz: kurz,
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
  // Suchfragen duerfen Platzhalter tragen — die Farb-Recherche fragt nach dem,
  // was in der Gliederung steht, nicht nach dem Thema im Allgemeinen.
  const queries = step.queries?.length ? step.queries.map((q) => render(q, ctx)) : [
    `Belege, Zahlen und Studien zu: ${thema}`,
    `Was ${audience} dazu öffentlich schreibt — Foren, Bewertungen, Beiträge`,
  ]
  let tin = 0, tout = 0, suchen = 0
  const findings = []
  for (const q of queries.slice(0, 3)) {
    const f = await runSearch('recherche', q, COLLECT_INSTRUCTION)
    tin += f.tokensIn; tout += f.tokensOut; suchen += f.searches ?? 0
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
    model: sucheAnbieter().modell, tokensIn: tin, tokensOut: tout,
    units: suchen ? { web_search: suchen } : {},
  }
}

/** Platzhalter der Form {{schritt.feld}} oder {{eingabe.feld}} aufloesen. */
function render(tpl: string, ctx: Ctx, extra?: Record<string, unknown>): string {
  return tpl.replace(/\{\{([a-z0-9_.]+)\}\}/gi, (_m, path: string) => {
    if (path === 'wissen') return ctx.packs
    if (path === 'wissen_kurz') return ctx.packsKurz || ctx.packs
    if (path === 'material') return ctx.material
    const [head, ...rest] = path.split('.')
    const base = head === 'eingabe' ? ctx.input : (extra?.[head] ?? ctx.results[head])
    let v: unknown = base
    for (const p of rest) v = (v as Record<string, unknown> | undefined)?.[p]
    if (v === undefined || v === null) return ''
    return typeof v === 'string' ? v : JSON.stringify(v, null, 2)
  })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Die Minutenbremse.
 *
 * Das Konto darf 30.000 Token je Minute. Ein Abschnittsaufruf bringt es mit
 * Material, Farbe und Klangmassstab auf ueber 17.000 — zwei davon kurz
 * hintereinander, und die Minute ist voll.
 *
 * Bisher liefen wir in das Limit hinein und warteten danach, was die Anbieter
 * uns sagte. Das funktioniert, solange es einmal passiert; bei acht Abschnitten
 * hintereinander verbraucht es die Wiederholungen und der Lauf stirbt an einer
 * Eigenschaft des Tarifs.
 *
 * Also wird vorher gewartet. Wir fuehren ein Fenster ueber die letzte Minute
 * und halten den naechsten Aufruf an, bis er hineinpasst. Das macht lange Laeufe
 * langsam und zuverlaessig — in dieser Reihenfolge.
 */
const TPM = Number(process.env.OPENAI_TPM ?? 26_000)

/**
 * Was in der letzten Minute verbraucht wurde — und wann der aelteste Eintrag
 * aus dem Fenster faellt.
 *
 * Steht in der Datenbank, nicht im Speicher: Zwei Lambda-Instanzen, die sich
 * beide fuer allein halten, verbrauchen zusammen das Doppelte.
 */
async function verbraucht(model: string): Promise<{ summe: number; freiIn: number }> {
  const rows = (await db.execute(sql`
    SELECT COALESCE(SUM(tokens), 0)::int AS summe,
           COALESCE(EXTRACT(EPOCH FROM (MIN(at) + interval '61 seconds' - now())), 0)::float AS frei_in
    FROM model_window WHERE model = ${model} AND at > now() - interval '60 seconds'`)) as unknown as
    Array<{ summe: number; frei_in: number }>
  return { summe: rows[0]?.summe ?? 0, freiIn: Math.max(0, rows[0]?.frei_in ?? 0) }
}

async function bremse(model: string, geschaetzt: number): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const { summe, freiIn } = await verbraucht(model)
    if (geschaetzt + summe <= TPM || summe === 0) return
    await sleep(Math.min(Math.max(1_500, Math.ceil(freiIn * 1000) + 500), 20_000))
  }
}

async function merkeVerbrauch(model: string, tokens: number) {
  await db.execute(sql`INSERT INTO model_window (model, tokens) VALUES (${model}, ${tokens})`)
  // Aufraeumen, damit die Tabelle nicht waechst.
  if (Math.random() < 0.05) {
    await db.execute(sql`DELETE FROM model_window WHERE at < now() - interval '10 minutes'`)
  }
}

/**
 * Ein Modellaufruf, mit Geduld.
 *
 * Die Organisation hat ein Minutenlimit. Ein langer Text besteht aus acht bis
 * zehn Aufrufen kurz hintereinander und laeuft zuverlaessig hinein. Das ist kein
 * Fehler des Agenten, sondern eine Eigenschaft des Kontos — und weil sie sich
 * ankuendigt ("try again in 9s"), wird gewartet statt abgebrochen. Ein Lauf, der
 * an einem Minutenlimit stirbt, hat alles davor umsonst bezahlt.
 */
async function ask(step: StepDef, ctx: Ctx, extra?: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY fehlt')
  const model = resolveModel((step.modelRole ?? ctx.def.default_model_role) as never, null)
  const body = JSON.stringify({
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
  })

  // Grob geschaetzt: gut drei Zeichen je Token, plus was die Antwort kosten darf.
  const geschaetzt = Math.ceil(body.length / 3.2) + (step.maxTokens ?? 4000)
  await bremse(model, geschaetzt)

  let res: Response | null = null
  let lastText = ''
  for (let versuch = 0; versuch < 4; versuch++) {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body,
    })
    if (res.ok) break
    lastText = await res.text()
    if (res.status !== 429 && res.status < 500) break
    // Die Antwort nennt die Wartezeit selbst — wenn nicht, verdoppeln wir.
    const hint = /try again in ([\d.]+)s/i.exec(lastText)
    const waitMs = hint ? Math.ceil(Number(hint[1]) * 1000) + 800 : 2500 * (versuch + 1)
    await sleep(Math.min(waitMs, 30_000))
  }
  if (!res || !res.ok) throw new Error(`Modell ${res?.status ?? 0}: ${lastText.slice(0, 200)}`)
  const data = await res.json()
  await merkeVerbrauch(model, (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0))
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
 * Aus dem Katalog waehlen.
 *
 * Erst das Verzeichnis — Titel und Schlagworte, keine Ruempfe. Dann eine
 * Entscheidung, dann werden nur die gewaehlten Bausteine geladen. 514 Eintraege
 * vollstaendig in den Prompt zu kippen waere ein halbes Buch und wuerde die
 * Aufmerksamkeit auf das Eigentliche ersticken.
 *
 * Und die Begruendung wird mitverlangt. Eine Wahl ohne Begruendung ist ein
 * Zufall, den man spaeter nicht pruefen kann.
 */
async function choose(step: StepDef, ctx: Ctx): Promise<StepOut> {
  const a = ctx.results.aufnahme as { textart?: string; audience?: string; ueberzeugungsziel?: string } | undefined
  const picks = step.pick ?? []

  /**
   * Je Art ein eigenes Verzeichnis, mit eigener Obergrenze.
   *
   * Vorher lief eine Abfrage ueber alle Arten mit einer gemeinsamen Grenze.
   * Die Vorlagen stellen allein 707 der 785 Bausteine — sie haben die Liste
   * gefuellt, und die 123 Hooks und 151 CTAs standen zwar drin, gingen aber in
   * der Masse unter. Das Modell waehlte eine Vorlage und sonst nichts.
   *
   * Getrennte Abfragen halten die Liste kurz und jede Art sichtbar.
   */
  const proArt = 45
  const rows: IndexRow[] = []
  for (const p of picks) {
    const mitTag = await catalogIndex({
      kinds: [p.kind], orgId: ctx.orgId,
      tags: a?.textart ? [String(a.textart)] : undefined,
      limit: proArt,
    })
    // Zu wenige Treffer auf die Textart: dieselbe Art ohne Schlagwort-Filter.
    const liste = mitTag.length >= 6 ? mitTag
      : await catalogIndex({ kinds: [p.kind], orgId: ctx.orgId, limit: proArt })
    rows.push(...liste)
  }
  if (!rows.length) return { value: { gewaehlt: [], begruendung: 'Der Katalog ist leer.' } }

  const res = await ask({
    ...step,
    system: `Du waehlst aus einem Verzeichnis. Du schreibst nichts.

${(step.pick ?? []).map((p) => `- ${p.anzahl} × ${p.kind} (als "${p.als}")`).join('\n')}

Du siehst nur Titel und Schluessel. Waehle, was zu Auftrag, Zielgruppe und Textart passt, und begruende jede Wahl in einem Satz. Eine Wahl ohne Begruendung ist ein Zufall.

Nimm nicht, was am bekanntesten klingt, sondern was zu dieser Aufgabe passt. Zwei Beispiele derselben Handschrift sind eine Wahl zu wenig.

ZU DEN STIMMEN. Die Stimme von Markus Eilers gilt immer und steht nicht zur Wahl. Was Du hier waehlst, ist eine zweite Stimme fuer die STRUKTUR: Kennedy fuer Direct Response und Angebote, Welsh fuer Kurzform, Graziosi fuer Geschichte, Vosler fuer Langform und Belief-Chains, Kern fuer Video und den Ueberschriften-Bogen, Braun fuer Kaltkontakt.

Guru-Profile liefern Struktur, nie Klang. Bei Kollision gewinnt Markus. Kennedy-Urgency, Drohkulissen und Hype sind in jedem Framework verboten.`,
    user: `Textart: ${a?.textart ?? ''}
Zielgruppe: ${a?.audience ?? ''}
Ueberzeugungsziel: ${a?.ueberzeugungsziel ?? ''}

Verzeichnis:
${renderIndex(rows)}`,
    schema: {
      type: 'object', required: ['gewaehlt'],
      properties: {
        gewaehlt: {
          type: 'array',
          minItems: picks.reduce((n, p) => n + p.anzahl, 0),
          items: {
            type: 'object', required: ['pack', 'key', 'als', 'warum'],
            properties: {
              pack: { type: 'string' }, key: { type: 'string' },
              als: { type: 'string', enum: picks.map((p) => p.als) },
              warum: { type: 'string' },
            },
          },
        },
      },
    },
    temperature: 0.3, maxTokens: 2000,
  }, ctx)

  let picked = ((res.value as { gewaehlt?: Array<{ pack: string; key: string; als: string; warum: string }> }).gewaehlt ?? [])

  // Eine vorgegebene Stimme ist keine Anregung. Was der Auftraggeber gewaehlt
  // hat, ersetzt die Wahl des Modells — und zwar das ganze Profil, nicht nur
  // ein Stueck daraus.
  const gewuenscht = String((ctx.input as Record<string, unknown>).stimme ?? '').trim().toLowerCase()
  if (gewuenscht) {
    const pack = `voice.${gewuenscht}`
    const alle = await catalogIndex({ kinds: ['voice'], orgId: ctx.orgId, limit: 200 })
    const eigen = alle.filter((r) => r.pack === pack)
    if (eigen.length) {
      picked = [
        ...picked.filter((p) => p.als !== 'stimme'),
        ...eigen.slice(0, 6).map((r) => ({
          pack, key: String(r.key ?? ''), als: 'stimme',
          warum: 'Vom Auftraggeber gesetzt.',
        })),
      ]
    }
  }
  /**
   * Was das Modell vergessen hat, holen wir selbst.
   *
   * Eine leere Gruppe ist kein Urteil ("hier passte nichts"), sondern fast
   * immer Bequemlichkeit. Beobachtet: von sechs Gruppen kam eine zurueck, und
   * die Hooks blieben ungenutzt, obwohl 123 im Regal standen.
   */
  for (const p of picks) {
    if (picked.some((g) => g.als === p.als)) continue
    const frei = rows.filter((r2) => r2.kind === p.kind && r2.key)
    if (!frei.length) continue
    picked.push(...frei.slice(0, p.anzahl).map((r2) => ({
      pack: r2.pack, key: String(r2.key), als: p.als,
      warum: 'Nachgezogen — das Modell hatte diese Gruppe übergangen.',
    })))
  }

  const bodies = await loadItems(picked.map((p) => ({ pack: p.pack, key: p.key })), ctx.orgId)

  const gruppen: Record<string, string[]> = {}
  for (const p of picked) {
    const body = bodies.find((b) => b.pack === p.pack && b.key === p.key)
    if (!body) continue
    ;(gruppen[p.als] ??= []).push(`**${body.title}** _(${body.pack_name})_\n_Gewählt, weil: ${p.warum}_\n\n${body.body}`)
  }

  await db.execute(sql`
    INSERT INTO agent_artifacts (run_id, step_key, kind, label, payload)
    VALUES (${ctx.runId}, ${step.key}, 'auswahl', ${`${picked.length} gewählt`},
            ${JSON.stringify(picked)}::jsonb)`)

  const value: Record<string, unknown> = { gewaehlt: picked }
  for (const [als, texte] of Object.entries(gruppen)) value[als] = texte.join('\n\n---\n\n')
  return { value, model: res.model, tokensIn: res.tokensIn, tokensOut: res.tokensOut }
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
/**
 * Der Skelett-Validator.
 *
 * Kein Modellaufruf. Er prueft nur, was sich zaehlen laesst — und genau das ist
 * der Punkt: Ein Modell, das man fragt, ob seine Gliederung vollstaendig ist,
 * antwortet zuverlaessig mit ja.
 *
 * Vier Fragen: Traegt jeder Ueberzeugungsschritt mindestens einen Abschnitt?
 * Zeigt jeder Abschnitt auf einen Beleg, den es gibt? Steht der schwerste
 * Schritt an einer starken Stelle? Und stimmen die Budgets in der Summe?
 */
async function skelett(step: StepDef, ctx: Ctx): Promise<StepOut> {
  interface Abschnitt {
    name?: string; ziel?: string; beleg?: string; woerter?: number
    paraphrase?: string; beats?: string[]
  }
  const plan = (ctx.results[step.source ?? 'struktur'] as { abschnitte?: Abschnitt[] }) ?? {}
  const parts = plan.abschnitte ?? []
  const kette = (ctx.results.kette as { ziele?: Array<{ id?: string; satz?: string; schwere?: string }> }) ?? {}
  const ziele = kette.ziele ?? []
  const ev = (ctx.results.evidenz as { belege?: Array<{ id?: string }> }) ?? {}
  const belegIds = new Set((ev.belege ?? []).map((b) => String(b.id ?? '').toUpperCase()).filter(Boolean))

  const befunde: Array<{ art: string; schwere: 'fehler' | 'warnung'; text: string }> = []
  const ids = (s: string) => [...String(s).toUpperCase().matchAll(/\b([BE]\d+)\b/g)].map((m) => m[1])

  // 1 · Jeder Ueberzeugungsschritt braucht einen Abschnitt, der ihn traegt.
  const belegt = new Set(parts.flatMap((p) => ids(`${p.ziel ?? ''} ${p.beleg ?? ''}`)))
  for (const z of ziele) {
    const id = String(z.id ?? '').toUpperCase()
    if (id && !belegt.has(id)) {
      befunde.push({ art: 'Überzeugungsschritt ohne Abschnitt', schwere: 'fehler',
        text: `${id}: „${z.satz ?? ''}" trägt kein Abschnitt. Entweder rein damit oder streichen.` })
    }
  }

  // 2 · Keine toten Verweise.
  if (belegIds.size) {
    for (const p of parts) {
      for (const id of ids(p.beleg ?? '')) {
        if (id.startsWith('E') && !belegIds.has(id)) {
          befunde.push({ art: 'toter Verweis', schwere: 'fehler',
            text: `„${p.name ?? ''}" beruft sich auf ${id} — den Beleg gibt es nicht.` })
        }
      }
    }
  }

  // 3 · Abschnitte ohne jeden Beleg.
  for (const p of parts) {
    if (!String(p.beleg ?? '').trim()) {
      befunde.push({ art: 'Abschnitt ohne Beleg', schwere: 'warnung',
        text: `„${p.name ?? ''}" stützt sich auf nichts aus dem Material.` })
    }
    if (!String(p.paraphrase ?? '').trim()) {
      befunde.push({ art: 'keine Leser-Paraphrase', schwere: 'warnung',
        text: `„${p.name ?? ''}" sagt nicht, was der Leser danach denken soll.` })
    }
  }

  // 4 · Der schwerste Schritt gehoert nicht ans Ende.
  const schwer = ziele.find((z) => /schwer|hoch/i.test(String(z.schwere ?? '')))
  if (schwer?.id) {
    const pos = parts.findIndex((p) => ids(`${p.ziel ?? ''}`).includes(String(schwer.id).toUpperCase()))
    if (pos >= 0 && pos > parts.length * 0.7) {
      befunde.push({ art: 'schwerer Schritt zu spät', schwere: 'warnung',
        text: `Der schwierigste Überzeugungsschritt (${schwer.id}) steht an Stelle ${pos + 1} von ${parts.length}. `
          + 'Wer bis dahin nicht überzeugt ist, liest nicht mehr.' })
    }
  }

  /**
   * 5a · Passt die Menge der Botschaften zur Laenge?
   *
   * Beobachtet: elf vorgegebene Botschaften auf 1.300 Woerter. Die Kette darf
   * keine weglassen, die Gliederung macht daraus zwoelf Abschnitte, und der
   * Text wird ein Drittel zu lang — oder jede Botschaft bekommt hundert
   * Woerter und keine wird belegt. Beides faellt erst am Ende auf.
   */
  const zielW = Number((ctx.results.aufnahme as { ziel_woerter?: number } | undefined)?.ziel_woerter ?? 0)
  if (zielW && ziele.length) {
    const jeSchritt = Math.round(zielW / ziele.length)
    if (jeSchritt < 120) {
      befunde.push({ art: 'zu viele Botschaften für die Länge', schwere: 'warnung',
        text: `${ziele.length} Überzeugungsschritte auf ${zielW} Wörter sind ${jeSchritt} Wörter je Schritt. `
          + 'Unter 120 trägt keiner einen eigenen Gedanken — Schritte zusammenlegen oder die Länge erhöhen.' })
    }
  }

  // 5 · Budgets.
  const soll = zielW
  const summe = parts.reduce((a, p) => a + (Number(p.woerter) || 0), 0)
  if (soll && Math.abs(summe - soll) > soll * 0.1) {
    befunde.push({ art: 'Budget stimmt nicht', schwere: 'warnung',
      text: `Die Abschnitte summieren sich auf ${summe} Wörter, das Ziel sind ${soll}.` })
  }

  await db.execute(sql`
    INSERT INTO agent_artifacts (run_id, step_key, kind, label, payload)
    VALUES (${ctx.runId}, ${step.key}, 'skelett', ${`${befunde.length} Befunde`},
            ${JSON.stringify(befunde)}::jsonb)`)

  return {
    value: {
      befunde,
      sauber: befunde.every((b) => b.schwere !== 'fehler'),
      liste: befunde.map((b) => `- [${b.schwere}] ${b.art}: ${b.text}`).join('\n') || '(keine)',
    },
  }
}

/**
 * Zerlegen — der Einstieg fuer "Stay the course".
 *
 * Kein Modellaufruf. Der Originaltext wird an seinen eigenen Absaetzen in
 * Passagen geschnitten, und jede Passage bekommt als Budget ihre eigene
 * Laenge. Das ist der ganze Unterschied zum Neuschreiben: Das Mass kommt vom
 * Original, nicht von einer Zielgroesse.
 */
async function zerlegen(step: StepDef, ctx: Ctx): Promise<StepOut> {
  const quelle = String((ctx.input as Record<string, unknown>).inhalte ?? '').trim()
  if (!quelle) throw new Error('Kein Originaltext zum Veredeln')

  const roh = quelle.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const teile: string[] = []
  let puffer = ''
  const zaehl = (t: string) => t.split(/\s+/).filter(Boolean).length

  for (const p of roh) {
    // Eine Ueberschrift beginnt immer eine neue Passage.
    const istKopf = /^#{1,6}\s/.test(p) || (zaehl(p) <= 12 && !/[.!?]$/.test(p))
    if (istKopf && puffer) { teile.push(puffer); puffer = p; continue }
    puffer = puffer ? `${puffer}\n\n${p}` : p
    if (zaehl(puffer) >= 220) { teile.push(puffer); puffer = '' }
  }
  if (puffer) teile.push(puffer)

  const abschnitte = teile.map((t, i) => {
    const kopf = t.match(/^#{1,6}\s*(.+)$/m)?.[1]
    return {
      name: kopf ?? `Passage ${i + 1}`,
      woerter: zaehl(t),
      quelle: t,
      beats: [] as string[],
    }
  })

  return { value: { abschnitte, passagen: abschnitte.length, woerter: zaehl(quelle) } }
}

async function sections(step: StepDef, ctx: Ctx): Promise<StepOut> {
  const from = step.sections ?? 'struktur'
  // Faellt die Nachbesserung aus — sie ist optional —, gilt die urspruengliche
  // Gliederung. Ein fehlender Reparaturschritt darf keinen Lauf kosten.
  const roh = ctx.results[from] ?? (from === 'nachbessern' ? ctx.results.struktur : undefined)
  const plan = (roh as {
    abschnitte?: Array<{
      name: string; woerter: number; beats?: string[]
      beleg?: string; stufe?: string; quelle?: string
      paraphrase?: string; wirkung?: string; befund?: string
    }>
    titel_vorschlag?: string
  }) ?? {}
  const parts = plan.abschnitte ?? []
  if (!parts.length) throw new Error(`Keine Gliederung in "${from}"`)

  // Die Zwischenueberschriften koennen aus einem eigenen Schritt kommen, der
  // nach der Farb-Recherche laeuft. Dann gewinnen sie gegen die Arbeitstitel
  // aus der Gliederung — Position fuer Position.
  // Die Paraphrasen der Beat-Pruefung schlagen die Arbeitstitel: Der Schreiber
  // schreibt auf den Satz, den der Leser danach denken soll, nicht auf die
  // Ueberschrift. Das ist der wirksamste einzelne Hebel im ganzen Lauf.
  {
    const q = (ctx.results.beats as {
      abschnitte?: Array<{ name?: string; paraphrase?: string; wirkung?: string; befund?: string }>
    }) ?? {}
    const liste = q.abschnitte ?? []
    parts.forEach((s, i) => {
      const t = liste[i]
      if (t?.paraphrase) (s as { paraphrase?: string }).paraphrase = t.paraphrase
      if (t?.wirkung) (s as { wirkung?: string }).wirkung = t.wirkung
      if (t?.befund) (s as { befund?: string }).befund = t.befund
    })
  }

  if (step.headings) {
    const h = (ctx.results[step.headings] as { ueberschriften?: string[] }) ?? {}
    const list = h.ueberschriften ?? []
    parts.forEach((s, i) => { if (list[i]) s.name = list[i] })
  }

  // Ein vom Auftraggeber gesetzter Titel ist keine Anregung. Er steht so da,
  // wie er uebergeben wurde.
  const fixTitel = String((ctx.input as Record<string, unknown>).titel ?? '').trim()
  const fixUnter = String((ctx.input as Record<string, unknown>).untertitel ?? '').trim()

  const minRatio = step.minRatio ?? 0.85
  type Fertig = { name: string; text: string; woerter: number; budget: number; nachgelegt: boolean }
  let out: Fertig[] = []
  let tin = 0, tout = 0, model: string | undefined
  let tail = ''

  /**
   * Schon geschriebene Abschnitte wiederfinden.
   *
   * Mit der Minutenbremse dauert ein Abschnitt bis zu einer halben Minute
   * Wartezeit. Acht davon passen nicht in eine Lambda-Laufzeit. Also wird nach
   * jedem Abschnitt abgelegt, was fertig ist, und beim naechsten Anlauf dort
   * weitergemacht — derselbe Gedanke wie beim Lauf selbst, eine Ebene tiefer.
   */
  const merken = async () => {
    await db.execute(sql`
      INSERT INTO agent_artifacts (run_id, step_key, kind, label, payload)
      VALUES (${ctx.runId}, ${step.key}, 'abschnitte-teil', ${`${out.length}/${parts.length}`},
              ${JSON.stringify(out)}::jsonb)`)
  }
  {
    const rows = (await db.execute(sql`
      SELECT payload FROM agent_artifacts
      WHERE run_id = ${ctx.runId} AND step_key = ${step.key} AND kind = 'abschnitte-teil'
      ORDER BY created_at DESC LIMIT 1`)) as unknown as Array<{ payload: Fertig[] }>
    const bisher = rows[0]?.payload
    if (Array.isArray(bisher) && bisher.length && bisher.length < parts.length) {
      out = bisher
      tail = bisher[bisher.length - 1]?.text ?? ''
    }
  }

  const offen = parts.slice(out.length)
  // Wieviel Zeit bleibt in diesem Anlauf? Lieber sauber aufhoeren und im
  // naechsten weitermachen, als mitten im Abschnitt abgeschnitten werden.
  const start = Date.now()

  for (const s of offen) {
    if (out.length > (parts.length - offen.length) && Date.now() - start > 170_000) {
      await merken()
      throw new Vertagt(`${out.length} von ${parts.length} Abschnitten stehen — weiter beim nächsten Anlauf.`)
    }
    const budget = Math.max(60, Number(s.woerter) || 200)
    const write = async (extra: Record<string, unknown>) => {
      const res = await ask(step, ctx, {
        abschnitt: { ...s, budget },
        vorher: { schluss: tail.slice(-400) },
        // Die CTA-Muster braucht nur der letzte Abschnitt. In den anderen sind
        // sie teurer Ballast — und eine Einladung, zu frueh zu schliessen.
        letzter: out.length === parts.length - 1,
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
    if (out.length < parts.length) await merken()
  }

  // Ueberschriften setzt nur, wer welche geschrieben hat. Beim Veredeln eines
  // Originals stehen sie schon im Text.
  const body = out
    .map((s, i) => (step.headings && i > 0 ? `## ${s.name}\n\n${s.text.trim()}` : s.text.trim()))
    .join('\n\n')
  const kopf = fixTitel
    ? `# ${fixTitel}\n\n${fixUnter ? `*${fixUnter}*\n\n` : ''}`
    : plan.titel_vorschlag ? `# ${plan.titel_vorschlag}\n\n` : ''
  const full = `${kopf}${body}`
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
        titel: fixTitel || plan.titel_vorschlag || '',
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
  const a = ctx.results.aufnahme as
    { ansprache?: string; ziel_woerter?: number; textart?: string } | undefined
  // Der Lock steht in der Eingabe oder wird beim Aufnehmen aus dem Auftrag
  // destilliert — beides gilt, die Eingabe gewinnt.
  const lock = String((ctx.input as Record<string, unknown>).message_lock
    ?? (ctx.results.aufnahme as { message_lock?: string } | undefined)?.message_lock ?? '').trim()
  // Eine Botschaft je Zeile; Aufzaehlungszeichen und Nummern fliegen raus.
  const botschaften = String((ctx.input as Record<string, unknown>).botschaften ?? '')
    .split('\n').map((z) => z.replace(/^\s*([-*+•]|\d+[.)])\s*/, '').trim())
    .filter((z) => z.length > 11)
  const from = step.source ?? 'entwuerfe'
  const drafts = (ctx.results[from] as { varianten?: Array<Record<string, unknown>> })?.varianten ?? []
  const reports = drafts.map((d) => {
    const text = String(d.text ?? d.inhalt ?? '')
    const r = lint({
      text, banned: ctx.banned,
      address: a?.ansprache ?? null,
      targetWords: a?.ziel_woerter ?? null,
      // Das Material ist die Wahrheit. Was hier nicht steht, darf dort nicht stehen.
      material: `${String(ctx.input.inhalte ?? '')}\n${String(ctx.input.context_md ?? ctx.input.kontext ?? '')}`,
      lock: lock || null,
      botschaften: botschaften.length ? botschaften : null,
      kanal: a?.textart ?? null,
    })
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

  const zaehl = (t: string) => t.trim().split(/\s+/).filter(Boolean).length

  for (let i = 0; i < drafts.length; i++) {
    const findings = reports[i]?.findings ?? []
    if (!findings.length) { out.push(drafts[i]); continue }

    // Der Titel geht nicht durch die Revision. Er wurde vorgegeben oder eigens
    // geschrieben; eine Revision, die Befunde beheben soll, hat ihn zweimal
    // stillschweigend ersetzt. Also wird er vorher abgenommen und hinterher
    // wieder davorgesetzt.
    const vorher = String((drafts[i] as { text?: string }).text ?? '')
    const kopfEnde = /^(#\s.*\n(?:\n\*.*\*\n)?)/.exec(vorher)
    const kopf = kopfEnde?.[1] ?? ''
    const koerper = kopf ? vorher.slice(kopf.length) : vorher

    const r = await ask(step, ctx, {
      variante: { ...drafts[i], text: koerper },
      befunde: { liste: lintReport(findings as never) },
    })
    tin += r.tokensIn; tout += r.tokensOut; model = r.model

    let neuerText = String((r.value as { text?: string }).text ?? '')
    if (kopf && !neuerText.startsWith('#')) neuerText = kopf + neuerText

    /**
     * Die Laengenbremse.
     *
     * Eine Revision soll Befunde beheben, nicht kuerzen. Beobachtet: 1.556
     * Woerter gingen hinein, 1.159 kamen heraus — ein Viertel des Textes war
     * weg, samt einem ganzen Abschnitt. Wer so kuerzt, hat nicht korrigiert,
     * sondern neu geschrieben. Dann ist der Entwurf davor der bessere.
     */
    const alt = zaehl(vorher), neu = zaehl(neuerText)
    if (alt > 200 && neu < alt * 0.92) {
      out.push({
        ...drafts[i],
        revision_verworfen:
          `Die Revision kürzte von ${alt} auf ${neu} Wörter. Beheben heißt nicht kürzen — `
          + 'der Entwurf davor bleibt stehen.',
      })
      continue
    }

    out.push({ ...drafts[i], ...(r.value as object), text: neuerText })
  }
  return { value: { varianten: out }, model, tokensIn: tin, tokensOut: tout }
}

/**
 * Flicken statt neu schreiben.
 *
 * Die Revision hatte einen Konstruktionsfehler: Sie bekam den ganzen Text und
 * eine Liste von Befunden und sollte "beheben". Ein Modell, das einen ganzen
 * Text vor sich hat, schreibt ihn. Das Ergebnis war zweimal dasselbe — Befunde
 * behoben, dafuer ein Viertel gekuerzt, ein Abschnitt verschwunden, der Titel
 * ersetzt.
 *
 * Hier geht es umgekehrt. Jeder Befund wird zu einem Austausch: DIESER Satz
 * wird durch JENEN ersetzt. Wo der Linter den Ersatz kennt (ein verbotenes
 * Wort, ein Fuellwort), passiert das ohne Modell. Wo geurteilt werden muss,
 * sieht das Modell nur die betroffenen Saetze — nicht den Text.
 *
 * Danach wird zeichenweise ersetzt. Alles ausserhalb der getauschten Stellen
 * ist unveraendert, nachweislich: Wir zaehlen, wieviel stehen geblieben ist.
 */
async function flicken(step: StepDef, ctx: Ctx): Promise<StepOut> {
  const from = step.source ?? 'text'
  const drafts = (ctx.results[from] as { varianten?: Array<Record<string, unknown>> })?.varianten ?? []
  const reports = (ctx.results[step.reports ?? 'pruefung'] as
    { berichte?: Array<{ findings: Finding[] }> })?.berichte ?? []
  // Die Prosa-Pruefung liefert Befunde in eigener Form; sie reihen sich ein.
  const prosa = (ctx.results.bild as {
    befunde?: Array<{ frage?: string; flagge?: string; stelle?: string; warum?: string; vorschlag?: string }>
  })?.befunde ?? []

  const out: Array<Record<string, unknown>> = []
  let tin = 0, tout = 0, model: string | undefined
  const protokoll: Array<{ regel: string; alt: string; neu: string; quelle: string }> = []

  /** Den Satz finden, in dem eine Fundstelle liegt. Ein halber Satz laesst sich nicht tauschen. */
  const satzUm = (text: string, pos: number): string => {
    const start = Math.max(
      text.lastIndexOf('. ', pos), text.lastIndexOf('\n', pos),
      text.lastIndexOf('! ', pos), text.lastIndexOf('? ', pos))
    const rest = text.slice(pos)
    const m = /[.!?](\s|$)/.exec(rest)
    const ende = pos + (m ? m.index + 1 : rest.length)
    return text.slice(start < 0 ? 0 : start + 1, ende).trim()
  }

  for (let i = 0; i < drafts.length; i++) {
    let text = String(drafts[i].text ?? '')
    const findings = reports[i]?.findings ?? []
    if (!findings.length && !prosa.length) { out.push(drafts[i]); continue }

    /* ── 1 · Was der Linter selbst weiss: ohne Modell ─────────────────── */
    let mechanisch = 0
    for (const f of findings) {
      if (f.alt === undefined || f.neu === undefined) continue
      if (!text.includes(f.alt)) continue
      const ersetzt = f.neu
        ? text.replace(f.alt, f.neu)
        // Leerer Ersatz heisst streichen — mitsamt dem Leerzeichen davor.
        : text.replace(new RegExp(`\\s?${f.alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')
      if (ersetzt !== text) {
        protokoll.push({ regel: f.rule, alt: f.alt, neu: f.neu, quelle: 'Linter' })
        text = ersetzt
        mechanisch++
      }
    }

    /* ── 2 · Was ein Urteil braucht: nur die Saetze, nicht der Text ───── */
    const offen: Array<{
      nr: number; satz: string; regel: string; hinweis: string
      vorschlag?: string; ist?: string
    }> = []
    const gesehen = new Set<string>()

    for (const f of findings) {
      if (f.neu !== undefined) continue
      const satz = f.alt ?? (f.position !== undefined ? satzUm(text, f.position) : '')
      if (!satz || satz.length < 12 || gesehen.has(satz) || !text.includes(satz)) continue
      gesehen.add(satz)
      offen.push({ nr: offen.length + 1, satz, regel: f.rule, hinweis: f.hint, ist: f.ist ?? 'satz' })
    }
    for (const b of prosa) {
      const satz = String(b.stelle ?? '').trim()
      if (!satz || gesehen.has(satz) || !text.includes(satz)) continue
      gesehen.add(satz)
      offen.push({
        nr: offen.length + 1, satz,
        regel: `${b.frage ?? 'Prosa'} (${b.flagge ?? 'gelb'})`,
        hinweis: String(b.warum ?? ''), vorschlag: String(b.vorschlag ?? ''),
      })
    }

    if (offen.length) {
      const res = await ask(step, ctx, { auftraege: offen, anzahl: offen.length })
      tin += res.tokensIn; tout += res.tokensOut; model = res.model
      const liste = ((res.value as { austausch?: Array<{ nr?: number; neu?: string }> }).austausch ?? [])
      for (const a of liste) {
        const auftrag = offen.find((o) => o.nr === Number(a.nr))
        let ersatz = String(a.neu ?? '').trim()
        if (!auftrag || !ersatz || !text.includes(auftrag.satz)) continue

        if (auftrag.ist === 'ueberschrift') {
          // Eine Ueberschrift traegt kein Satzzeichen am Ende und bleibt kurz;
          // ihre Markdown-Ebene steht davor und wird nicht mitgetauscht.
          ersatz = ersatz.replace(/^#+\s*/, '').replace(/[.:;]+$/, '').trim()
          if (!ersatz || ersatz.length > 80) continue
        } else if (ersatz.length > auftrag.satz.length * 3 + 60) {
          // Eine Ersetzung, die dreimal so lang ist, ist keine Ersetzung mehr.
          continue
        }

        text = text.replace(auftrag.satz, ersatz)
        protokoll.push({ regel: auftrag.regel, alt: auftrag.satz, neu: ersatz, quelle: 'Urteil' })
      }
    }

    const vorher = String(drafts[i].text ?? '')
    const zaehl = (t: string) => t.trim().split(/\s+/).filter(Boolean).length
    out.push({
      ...drafts[i], text,
      geflickt: protokoll.length,
      mechanisch,
      woerter_vorher: zaehl(vorher),
      woerter_nachher: zaehl(text),
    })
  }

  await db.execute(sql`
    INSERT INTO agent_artifacts (run_id, step_key, kind, label, payload)
    VALUES (${ctx.runId}, ${step.key}, 'flicken', ${`${protokoll.length} Stellen getauscht`},
            ${JSON.stringify(protokoll)}::jsonb)`)

  return { value: { varianten: out, protokoll }, model, tokensIn: tin, tokensOut: tout }
}

function collect(ctx: Ctx): StepOut {
  const final = (ctx.results.flicken as { varianten?: unknown[] })?.varianten
    ?? (ctx.results.revision as { varianten?: unknown[] })?.varianten
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
      // Was bewusst offen blieb, gehoert ins Ergebnis. Eine Luecke, die niemand
      // sieht, wird beim naechsten Mal von jemandem erfunden.
      offen: (ctx.results.evidenz as { offen?: unknown[] })?.offen ?? [],
      beweislast: (ctx.results.evidenz as { beweislast?: string })?.beweislast ?? null,
      skelett: ctx.results.skelettpruefung ?? null,
      beats: ctx.results.beats ?? null,
      prosapruefung: ctx.results.bild ?? null,
      quellen,
      pruefung: lintOut,
      wissen: (ctx.results.kontext as { pack_keys?: string[] })?.pack_keys ?? [],
    },
  }
}
