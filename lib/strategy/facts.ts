import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureFactSchema } from './schema'
import { AUTO_CONFIRM_THRESHOLD } from './models'

export interface FactKey {
  key: string; label: string; scope: 'company' | 'product'
  value_type: string; produced_by: string | null; description: string | null
}

export interface Fact {
  id: string; company_id: string; product_id: string | null
  key: string; value: unknown; source: string; evidence: string | null
  confidence: number; status: 'draft' | 'confirmed' | 'rejected'
  version: number; created_at: string
}

export interface FactInput {
  key: string
  value: unknown
  evidence?: string | null
  confidence?: number
  source?: 'user' | 'agent' | 'research' | 'import'
}

export async function listFactKeys(stepKey?: string): Promise<FactKey[]> {
  await ensureFactSchema()
  const res = stepKey
    ? await db.execute(sql`SELECT * FROM strategy_fact_keys WHERE is_active AND produced_by = ${stepKey} ORDER BY sort_order, key`)
    : await db.execute(sql`SELECT * FROM strategy_fact_keys WHERE is_active ORDER BY sort_order, key`)
  return res as unknown as FactKey[]
}

export async function upsertFactKey(k: {
  key: string; label: string; scope?: 'company' | 'product'
  valueType?: string; producedBy?: string | null; description?: string | null; sortOrder?: number
}) {
  await ensureFactSchema()
  await db.execute(sql`
    INSERT INTO strategy_fact_keys (key, label, scope, value_type, produced_by, description, sort_order)
    VALUES (${k.key}, ${k.label}, ${k.scope ?? 'product'}, ${k.valueType ?? 'text'},
            ${k.producedBy ?? null}, ${k.description ?? null}, ${k.sortOrder ?? 0})
    ON CONFLICT (key) DO UPDATE SET
      label = EXCLUDED.label, scope = EXCLUDED.scope, value_type = EXCLUDED.value_type,
      produced_by = EXCLUDED.produced_by, description = EXCLUDED.description,
      sort_order = EXCLUDED.sort_order, updated_at = now()`)
}

/** Aktuelle Fakten lesen. Firmen-Fakten (product_id IS NULL) kommen immer mit. */
export async function getFacts(companyId: string, productId?: string | null, keys?: string[]): Promise<Fact[]> {
  await ensureFactSchema()
  const res = await db.execute(sql`
    SELECT * FROM strategy_facts
    WHERE company_id = ${companyId}
      AND is_current AND status <> 'rejected'
      AND (product_id IS NULL OR product_id IS NOT DISTINCT FROM ${productId ?? null}::uuid)
      ${keys && keys.length ? sql`AND key = ANY(${keys}::text[])` : sql``}
    ORDER BY key`)
  return res as unknown as Fact[]
}

/** Fakten als Map key → value, für die Prompt-Zusammenstellung. */
export async function factMap(companyId: string, productId?: string | null, keys?: string[]): Promise<Record<string, unknown>> {
  const rows = await getFacts(companyId, productId, keys)
  const out: Record<string, unknown> = {}
  for (const r of rows) out[r.key] = r.value
  return out
}

/**
 * Fakten schreiben. Eine bestehende aktuelle Version wird geschlossen und die
 * neue verweist über supersedes_id darauf — die Historie bleibt vollständig.
 * Agent-Fakten unterhalb der Schwelle landen als 'draft' und warten auf Bestätigung.
 */
export async function putFacts(input: {
  companyId: string; productId?: string | null
  facts: FactInput[]
  source?: 'user' | 'agent' | 'research' | 'import'
  stepId?: string | null; blockId?: string | null; aiRunId?: string | null; userId?: string | null
}): Promise<{ written: number; drafts: number }> {
  await ensureFactSchema()
  let written = 0, drafts = 0
  for (const f of input.facts) {
    if (f.value === undefined || f.value === null || f.value === '') continue
    const source = f.source ?? input.source ?? 'agent'
    const confidence = f.confidence ?? (source === 'user' ? 1 : 0.6)
    const status = source === 'user' || confidence >= AUTO_CONFIRM_THRESHOLD ? 'confirmed' : 'draft'
    if (status === 'draft') drafts++

    const prevRes = await db.execute(sql`
      SELECT id, version FROM strategy_facts
      WHERE company_id = ${input.companyId} AND key = ${f.key}
        AND product_id IS NOT DISTINCT FROM ${input.productId ?? null}::uuid
        AND is_current LIMIT 1`)
    const prev = (prevRes as unknown as { id: string; version: number }[])[0]

    if (prev) {
      await db.execute(sql`UPDATE strategy_facts SET is_current = false, updated_at = now() WHERE id = ${prev.id}`)
    }
    await db.execute(sql`
      INSERT INTO strategy_facts (company_id, product_id, key, value, source, source_step_id, source_block_id,
                                  ai_run_id, evidence, confidence, status, version, supersedes_id, created_by)
      VALUES (${input.companyId}, ${input.productId ?? null}, ${f.key}, ${JSON.stringify(f.value)}::jsonb,
              ${source}, ${input.stepId ?? null}, ${input.blockId ?? null}, ${input.aiRunId ?? null},
              ${f.evidence ?? null}, ${confidence}, ${status}, ${(prev?.version ?? 0) + 1},
              ${prev?.id ?? null}, ${input.userId ?? null})`)
    written++
  }
  return { written, drafts }
}

export async function confirmFact(id: string, userId?: string | null) {
  await ensureFactSchema()
  await db.execute(sql`
    UPDATE strategy_facts SET status='confirmed', confidence=1.0, created_by=COALESCE(${userId ?? null}, created_by), updated_at=now()
    WHERE id=${id}`)
}

export async function rejectFact(id: string) {
  await ensureFactSchema()
  await db.execute(sql`UPDATE strategy_facts SET status='rejected', is_current=false, updated_at=now() WHERE id=${id}`)
}

/** Welche Eingangs-Fakten fehlen, damit ein Agent laufen kann? */
export async function missingFor(consumes: string[], companyId: string, productId?: string | null): Promise<string[]> {
  if (!consumes.length) return []
  const have = await factMap(companyId, productId, consumes)
  return consumes.filter((k) => have[k] === undefined)
}

/** Offene Vorschläge, die auf Bestätigung warten. */
export async function pendingFacts(companyId: string, productId?: string | null): Promise<Fact[]> {
  await ensureFactSchema()
  const res = await db.execute(sql`
    SELECT * FROM strategy_facts
    WHERE company_id = ${companyId} AND is_current AND status = 'draft'
      AND (product_id IS NULL OR product_id IS NOT DISTINCT FROM ${productId ?? null}::uuid)
    ORDER BY created_at DESC`)
  return res as unknown as Fact[]
}

/** Historie eines Schlüssels — wer hat wann was geändert. */
export async function factHistory(companyId: string, key: string, productId?: string | null): Promise<Fact[]> {
  await ensureFactSchema()
  const res = await db.execute(sql`
    SELECT * FROM strategy_facts
    WHERE company_id = ${companyId} AND key = ${key}
      AND product_id IS NOT DISTINCT FROM ${productId ?? null}::uuid
    ORDER BY version DESC`)
  return res as unknown as Fact[]
}
