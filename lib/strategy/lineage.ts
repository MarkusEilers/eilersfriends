import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Input · Work · Output — und was passiert, wenn sich ein Input ändert.
 *
 *  INPUT   Was ein Schritt liest: bestätigte Fakten (vom Kunden, aus früheren
 *          Schritten, aus Recherche) und Signale von außen.
 *  WORK    Der Arbeitsstand im Schritt (strategy_step_states.data, Baustein-
 *          Ergebnisse, Entwürfe). Work fließt NIE direkt in andere Schritte —
 *          erst wenn es als Output übernommen wird.
 *  OUTPUT  Was ein Schritt erzeugt: neue Fakten-Versionen (strategy_facts) oder
 *          Dokumente (strategy_artifacts). Jede Output-Version merkt sich, aus
 *          welchen Input-Versionen sie entstanden ist (strategy_lineage).
 *
 * Kommt eine neue Input-Version oder ein wichtiges Signal dazu, werden alle
 * Outputs, die auf der alten Version stehen, als überholt markiert — und
 * transitiv alles, was auf diesen Outputs aufbaut. Überholt heißt nicht
 * gelöscht: Der Output gilt weiter, bis er neu erzeugt ist; die Oberfläche
 * zeigt „überholt" mit Grund und bietet „neu erzeugen" an.
 */

let ready = false
export async function ensureLineageSchema() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_signals (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id   UUID,
      kind         TEXT NOT NULL DEFAULT 'manual',
      source       TEXT,
      title        TEXT NOT NULL,
      body         TEXT,
      url          TEXT,
      payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
      importance   TEXT NOT NULL DEFAULT 'normal',
      affects_keys TEXT[] NOT NULL DEFAULT '{}',
      status       TEXT NOT NULL DEFAULT 'new',
      observed_at  TIMESTAMPTZ,
      received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      triaged_by   UUID,
      applied_at   TIMESTAMPTZ,
      created_by   UUID
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_signals_company ON strategy_signals (company_id, received_at DESC)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_artifacts (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id    UUID,
      step_id       UUID REFERENCES strategy_steps(id) ON DELETE SET NULL,
      key           TEXT NOT NULL,
      kind          TEXT NOT NULL DEFAULT 'document',
      title         TEXT NOT NULL,
      content       JSONB NOT NULL DEFAULT '{}'::jsonb,
      status        TEXT NOT NULL DEFAULT 'draft',
      is_current    BOOLEAN NOT NULL DEFAULT true,
      version       INT NOT NULL DEFAULT 1,
      supersedes_id UUID,
      ai_run_id     UUID,
      stale_since   TIMESTAMPTZ,
      stale_reason  TEXT,
      stale_cause   JSONB,
      created_by    UUID,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_lineage (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      output_kind   TEXT NOT NULL,           -- fact | artifact
      output_id     UUID NOT NULL,
      input_kind    TEXT NOT NULL,           -- fact | artifact | signal
      input_id      UUID NOT NULL,
      input_key     TEXT,
      input_version INT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (output_kind, output_id, input_kind, input_id)
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_lineage_input ON strategy_lineage (input_key, input_kind)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_lineage_output ON strategy_lineage (output_kind, output_id)`)
  await db.execute(sql`ALTER TABLE strategy_facts ADD COLUMN IF NOT EXISTS stale_since TIMESTAMPTZ`)
  await db.execute(sql`ALTER TABLE strategy_facts ADD COLUMN IF NOT EXISTS stale_reason TEXT`)
  await db.execute(sql`ALTER TABLE strategy_facts ADD COLUMN IF NOT EXISTS stale_cause JSONB`)
  ready = true
}

export interface InputRef { kind: 'fact' | 'artifact' | 'signal'; id: string; key?: string | null; version?: number | null }

/** Momentaufnahme der aktuellen Input-Versionen — VOR dem Agent-Lauf ziehen. */
export async function snapshotInputs(companyId: string, productId: string | null | undefined, keys: string[]): Promise<InputRef[]> {
  if (!keys.length) return []
  await ensureLineageSchema()
  const rows = (await db.execute(sql`
    SELECT id, key, version FROM strategy_facts
    WHERE company_id=${companyId} AND is_current AND status <> 'rejected'
      AND key = ANY(${'{' + keys.map((k) => '"' + k.replace(/["\\]/g, '') + '"').join(',') + '}'}::text[])
      AND (product_id IS NOT DISTINCT FROM ${productId ?? null}::uuid OR product_id IS NULL)`)) as unknown as { id: string; key: string; version: number }[]
  return rows.map((r) => ({ kind: 'fact' as const, id: r.id, key: r.key, version: r.version }))
}

export async function recordLineage(output: { kind: 'fact' | 'artifact'; id: string }, inputs: InputRef[]) {
  if (!inputs.length) return
  await ensureLineageSchema()
  for (const i of inputs) {
    await db.execute(sql`
      INSERT INTO strategy_lineage (output_kind, output_id, input_kind, input_id, input_key, input_version)
      VALUES (${output.kind}, ${output.id}, ${i.kind}, ${i.id}, ${i.key ?? null}, ${i.version ?? null})
      ON CONFLICT DO NOTHING`)
  }
}

/**
 * Überholt markieren — ausgehend von einem geänderten Schlüssel.
 *
 * 1. Alle aktuellen Outputs, deren Herkunft eine ältere Version dieses
 *    Schlüssels enthält, werden überholt.
 * 2. Für jeden dieser Outputs (ein Fakt mit eigenem Schlüssel) wiederholt
 *    sich das — so wandert „überholt" die Kette entlang.
 * Liefert, was markiert wurde.
 */
export async function propagateStale(input: {
  companyId: string; productId?: string | null
  changedKey: string; cause: { kind: 'fact' | 'signal' | 'stale'; id?: string; key?: string; label?: string }
}): Promise<{ facts: number; artifacts: number }> {
  await ensureLineageSchema()
  let facts = 0, artifacts = 0
  const queue: { key: string; cause: typeof input.cause }[] = [{ key: input.changedKey, cause: input.cause }]
  const seen = new Set<string>()
  while (queue.length) {
    const { key, cause } = queue.shift()!
    if (seen.has(key)) continue
    seen.add(key)
    const reason = cause.kind === 'signal' ? `Neues Signal: ${cause.label ?? key}`
      : cause.kind === 'fact' ? `Neuer Stand bei „${cause.key ?? key}"`
      : `Baut auf „${cause.key ?? key}" auf, das überholt ist`

    // Fakten, die auf einer anderen als der aktuellen Version von `key` stehen
    const hitFacts = (await db.execute(sql`
      UPDATE strategy_facts f SET stale_since = COALESCE(f.stale_since, now()), stale_reason = ${reason},
             stale_cause = ${JSON.stringify(cause)}::jsonb, updated_at = now()
      WHERE f.company_id = ${input.companyId} AND f.is_current AND f.stale_since IS NULL
        AND (f.product_id IS NOT DISTINCT FROM ${input.productId ?? null}::uuid OR ${input.productId ?? null}::uuid IS NULL)
        AND EXISTS (
          SELECT 1 FROM strategy_lineage l
          WHERE l.output_kind='fact' AND l.output_id=f.id AND l.input_key=${key}
            AND (${cause.kind !== 'fact'} OR NOT EXISTS (
              SELECT 1 FROM strategy_facts cur WHERE cur.id=l.input_id AND cur.is_current)))
      RETURNING f.key`)) as unknown as { key: string }[]
    const hitArts = (await db.execute(sql`
      UPDATE strategy_artifacts a SET stale_since = COALESCE(a.stale_since, now()), stale_reason = ${reason},
             stale_cause = ${JSON.stringify(cause)}::jsonb, status = 'stale', updated_at = now()
      WHERE a.company_id = ${input.companyId} AND a.is_current AND a.stale_since IS NULL
        AND EXISTS (
          SELECT 1 FROM strategy_lineage l
          WHERE l.output_kind='artifact' AND l.output_id=a.id AND l.input_key=${key}
            AND (${cause.kind !== 'fact'} OR NOT EXISTS (
              SELECT 1 FROM strategy_facts cur WHERE cur.id=l.input_id AND cur.is_current)))
      RETURNING a.key`)) as unknown as { key: string }[]
    facts += hitFacts.length; artifacts += hitArts.length
    for (const f of hitFacts) queue.push({ key: f.key, cause: { kind: 'stale', key: f.key } })
  }
  return { facts, artifacts }
}

/** Signal anwenden: betroffene Outputs (und alles dahinter) werden überholt. */
export async function applySignal(signalId: string, userId?: string | null) {
  await ensureLineageSchema()
  const [s] = (await db.execute(sql`SELECT id, company_id, product_id, title, affects_keys FROM strategy_signals WHERE id=${signalId}`)) as unknown as
    { id: string; company_id: string; product_id: string | null; title: string; affects_keys: string[] }[]
  if (!s) return { facts: 0, artifacts: 0 }
  let facts = 0, artifacts = 0
  for (const key of s.affects_keys ?? []) {
    // Ein Signal überholt die Outputs, die diesen Schlüssel LESEN, und den Schlüssel selbst.
    const r = await propagateStale({ companyId: s.company_id, productId: s.product_id, changedKey: key, cause: { kind: 'signal', id: s.id, key, label: s.title } })
    facts += r.facts; artifacts += r.artifacts
    const self = (await db.execute(sql`
      UPDATE strategy_facts SET stale_since=COALESCE(stale_since, now()), stale_reason=${'Neues Signal: ' + s.title},
             stale_cause=${JSON.stringify({ kind: 'signal', id: s.id, key })}::jsonb, updated_at=now()
      WHERE company_id=${s.company_id} AND key=${key} AND is_current AND stale_since IS NULL
        AND (product_id IS NOT DISTINCT FROM ${s.product_id}::uuid OR ${s.product_id}::uuid IS NULL)
      RETURNING id`)) as unknown as { id: string }[]
    facts += self.length
  }
  await db.execute(sql`UPDATE strategy_signals SET status='applied', applied_at=now(), triaged_by=${userId ?? null} WHERE id=${signalId}`)
  return { facts, artifacts }
}

/** Was ist überholt? Für Baum, Schritt-Ansicht und Coach. */
export async function listStale(companyId: string, productId?: string | null) {
  await ensureLineageSchema()
  return (await db.execute(sql`
    SELECT 'fact' AS kind, f.id, f.key, f.stale_since, f.stale_reason, k.step_key
    FROM strategy_facts f LEFT JOIN strategy_fact_keys k ON k.key=f.key
    WHERE f.company_id=${companyId} AND f.is_current AND f.stale_since IS NOT NULL
      AND (f.product_id IS NOT DISTINCT FROM ${productId ?? null}::uuid OR f.product_id IS NULL)
    UNION ALL
    SELECT 'artifact', a.id, a.key, a.stale_since, a.stale_reason, s.key
    FROM strategy_artifacts a LEFT JOIN strategy_steps s ON s.id=a.step_id
    WHERE a.company_id=${companyId} AND a.is_current AND a.stale_since IS NOT NULL
      AND (a.product_id IS NOT DISTINCT FROM ${productId ?? null}::uuid)`)) as unknown as
    { kind: 'fact' | 'artifact'; id: string; key: string; stale_since: string; stale_reason: string; step_key: string | null }[]
}
