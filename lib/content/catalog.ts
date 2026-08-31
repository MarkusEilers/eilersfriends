import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureContentSchema } from './schema'

/**
 * Der kuratierte Katalog.
 *
 * Er enthaelt Bausteine — Headlines, Subheadlines, Botschaften, Hooks, CTAs —
 * je Segment, Kanal, Format und Ueberzeugungsstufe. Jeder Baustein traegt zwei
 * Bewertungen, die man nicht verwechseln darf:
 *
 *   Ueberzeugungsimpact  1 bis 10, ein Urteil. Wie stark wirkt dieser Satz?
 *   Konfidenz            0 bis 1, gerechnet. Wie sicher wissen wir das?
 *
 * Ein Satz kann mit 9 bewertet sein und trotzdem eine Konfidenz von 0,1 haben —
 * dann hat ihn jemand fuer gut befunden, und die Welt hat noch nicht geantwortet.
 * Beides in eine Zahl zu ruehren, waere der bequeme Fehler.
 */

export type SnippetKind =
  | 'headline' | 'subheadline' | 'botschaft' | 'hook' | 'cta' | 'bullet' | 'opener' | 'analogie'
export type EvidenceKind = 'freigabe' | 'gepostet' | 'wirkung' | 'gespraech'
export type SnippetStatus = 'kandidat' | 'freigegeben' | 'gesperrt' | 'ausgemustert'

export interface ScoringSettings {
  weight_freigabe: number; weight_gepostet: number; weight_wirkung: number; weight_gespraech: number
  saturation: number; promote_at: number; min_persuasion: number
}

const DEFAULTS: ScoringSettings = {
  // Die Gewichte steigen mit der Naehe zum Ergebnis. Eine Freigabe sagt, dass
  // jemand den Satz mochte. Ein Gespraech sagt, dass er gewirkt hat.
  weight_freigabe: 1, weight_gepostet: 2, weight_wirkung: 3, weight_gespraech: 5,
  saturation: 12, promote_at: 0.6, min_persuasion: 6,
}

export async function scoringSettings(companyId: string): Promise<ScoringSettings> {
  await ensureContentSchema()
  const rows = await db.execute(sql`SELECT * FROM content_scoring_settings WHERE company_id = ${companyId}`)
  const row = (rows as unknown as ScoringSettings[])[0]
  if (!row) return DEFAULTS
  return {
    weight_freigabe: Number(row.weight_freigabe), weight_gepostet: Number(row.weight_gepostet),
    weight_wirkung: Number(row.weight_wirkung), weight_gespraech: Number(row.weight_gespraech),
    saturation: Number(row.saturation), promote_at: Number(row.promote_at),
    min_persuasion: Number(row.min_persuasion),
  }
}

export async function setScoringSettings(companyId: string, s: Partial<ScoringSettings>) {
  await ensureContentSchema()
  const cur = await scoringSettings(companyId)
  const n = { ...cur, ...s }
  await db.execute(sql`
    INSERT INTO content_scoring_settings (company_id, weight_freigabe, weight_gepostet, weight_wirkung,
      weight_gespraech, saturation, promote_at, min_persuasion)
    VALUES (${companyId}, ${n.weight_freigabe}, ${n.weight_gepostet}, ${n.weight_wirkung},
            ${n.weight_gespraech}, ${n.saturation}, ${n.promote_at}, ${n.min_persuasion})
    ON CONFLICT (company_id) DO UPDATE SET
      weight_freigabe = EXCLUDED.weight_freigabe, weight_gepostet = EXCLUDED.weight_gepostet,
      weight_wirkung = EXCLUDED.weight_wirkung, weight_gespraech = EXCLUDED.weight_gespraech,
      saturation = EXCLUDED.saturation, promote_at = EXCLUDED.promote_at,
      min_persuasion = EXCLUDED.min_persuasion, updated_at = now()`)
  return n
}

/**
 * Konfidenz neu rechnen.
 *
 * Die gewichtete Summe der Belege, gedaempft: der erste Beleg bewegt viel, der
 * zwoelfte kaum noch. Ohne Daempfung gewinnt, was am oeftesten benutzt wurde —
 * genau der Fehler des Vorlaeufers, dessen Sortierung faktisch der
 * Nutzungszaehler war.
 */
export async function recomputeConfidence(snippetId: string): Promise<number> {
  await ensureContentSchema()
  const rows = await db.execute(sql`
    SELECT e.kind, COALESCE(e.value, 1) AS value, c.company_id
    FROM content_catalog_evidence e JOIN content_catalog c ON c.id = e.snippet_id
    WHERE e.snippet_id = ${snippetId}`)
  const list = rows as unknown as { kind: EvidenceKind; value: number; company_id: string }[]
  if (!list.length) {
    await db.execute(sql`UPDATE content_catalog SET confidence = 0, updated_at = now() WHERE id = ${snippetId}`)
    return 0
  }
  const s = await scoringSettings(list[0].company_id)
  const w: Record<EvidenceKind, number> = {
    freigabe: s.weight_freigabe, gepostet: s.weight_gepostet,
    wirkung: s.weight_wirkung, gespraech: s.weight_gespraech,
  }
  const total = list.reduce((sum, e) => sum + (w[e.kind] ?? 0) * Number(e.value || 1), 0)
  const confidence = Math.min(1, total / (total + s.saturation))

  // Aufsteigen darf nur, was beides hat: genug Belege und ein gutes Urteil.
  // Eine Zahl allein befoerdert sonst den harmlosen Satz, der oft lief.
  await db.execute(sql`
    UPDATE content_catalog SET confidence = ${confidence},
      status = CASE
        WHEN status = 'kandidat'
             AND ${confidence} >= ${s.promote_at}
             AND COALESCE(persuasion_score, 0) >= ${s.min_persuasion}
             AND claims_status <> 'unzulaessig'
        THEN 'freigegeben' ELSE status END,
      updated_at = now()
    WHERE id = ${snippetId}`)
  return confidence
}

export async function addEvidence(input: {
  snippetId: string; kind: EvidenceKind; value?: number
  note?: string | null; sourceRef?: string | null; userId?: string | null
}) {
  await ensureContentSchema()
  await db.execute(sql`
    INSERT INTO content_catalog_evidence (snippet_id, kind, value, note, source_ref, created_by)
    VALUES (${input.snippetId}, ${input.kind}, ${input.value ?? 1}, ${input.note ?? null},
            ${input.sourceRef ?? null}, ${input.userId ?? null})`)
  if (input.kind === 'gepostet') {
    await db.execute(sql`
      UPDATE content_catalog SET usage_count = usage_count + 1, last_used_at = now() WHERE id = ${input.snippetId}`)
  }
  return recomputeConfidence(input.snippetId)
}

/** Alle Bausteine eines Kunden neu bewerten — nach einer Aenderung der Gewichte. */
export async function recomputeAll(companyId: string) {
  await ensureContentSchema()
  const rows = await db.execute(sql`SELECT id FROM content_catalog WHERE company_id = ${companyId}`)
  let n = 0
  for (const r of rows as unknown as { id: string }[]) { await recomputeConfidence(r.id); n++ }
  return n
}

export interface SnippetInput {
  companyId: string; productId?: string | null; segmentKey?: string | null
  kind: SnippetKind; text: string
  channel?: string | null; formatId?: string | null
  convictionStage?: string | null; pillar?: string | null
  persuasionScore?: number | null; persuasionNote?: string | null
  source?: string; sourceRef?: string | null; userId?: string | null
}

/**
 * Baustein aufnehmen. Doppelte werden nicht neu angelegt, sondern bekommen
 * einen weiteren Beleg — derselbe Satz, der zum zweiten Mal auftaucht, ist
 * eine Bestaetigung, kein neuer Eintrag.
 */
export async function addSnippet(input: SnippetInput, evidence?: EvidenceKind) {
  await ensureContentSchema()
  const res = await db.execute(sql`
    INSERT INTO content_catalog (company_id, product_id, segment_key, kind, text, channel, format_id,
      conviction_stage, pillar, persuasion_score, persuasion_note, source, source_ref, created_by)
    VALUES (${input.companyId}, ${input.productId ?? null}, ${input.segmentKey ?? null}, ${input.kind},
            ${input.text}, ${input.channel ?? null}, ${input.formatId ?? null},
            ${input.convictionStage ?? null}, ${input.pillar ?? null},
            ${input.persuasionScore ?? null}, ${input.persuasionNote ?? null},
            ${input.source ?? 'agent'}, ${input.sourceRef ?? null}, ${input.userId ?? null})
    ON CONFLICT (company_id, kind, text_hash, COALESCE(segment_key,'')) DO UPDATE
      SET updated_at = now(),
          persuasion_score = COALESCE(content_catalog.persuasion_score, EXCLUDED.persuasion_score)
    RETURNING id`)
  const id = (res as unknown as { id: string }[])[0]?.id
  if (id && evidence) await addEvidence({ snippetId: id, kind: evidence, sourceRef: input.sourceRef, userId: input.userId })
  return id
}

/**
 * Der Katalog als Orientierung fuer den Schreiber.
 *
 * Passendes Segment, Kanal, Format und Ueberzeugungsstufe zuerst; der Rest
 * bleibt als Klangprobe dabei. Freigegebenes schlaegt Kandidaten.
 */
export async function catalogFor(input: {
  companyId: string; segmentKey?: string | null; channel?: string | null
  formatId?: string | null; convictionStage?: string | null; perKind?: number
}) {
  await ensureContentSchema()
  const rows = await db.execute(sql`
    SELECT id, kind, text, channel, format_id, segment_key, conviction_stage, pillar,
           status, persuasion_score, confidence, claims_status, usage_count
    FROM content_catalog
    WHERE company_id = ${input.companyId} AND status IN ('kandidat','freigegeben')
      AND claims_status <> 'unzulaessig'
    ORDER BY (status = 'freigegeben') DESC,
             (segment_key IS NOT DISTINCT FROM ${input.segmentKey ?? null}) DESC,
             (channel IS NOT DISTINCT FROM ${input.channel ?? null}) DESC,
             (format_id IS NOT DISTINCT FROM ${input.formatId ?? null}) DESC,
             (conviction_stage IS NOT DISTINCT FROM ${input.convictionStage ?? null}) DESC,
             COALESCE(persuasion_score,0) DESC, confidence DESC
    LIMIT 400`)
  const all = rows as unknown as Array<Record<string, unknown> & { kind: string }>
  const perKind = input.perKind ?? 8
  const byKind: Record<string, typeof all> = {}
  for (const r of all) {
    const list = (byKind[r.kind] ??= [])
    if (list.length < perKind) list.push(r)
  }
  return byKind
}

/** Als Prompt-Block. Die Regel dazu ist alt und richtig: Klang uebernehmen, nie den Wortlaut. */
export function renderCatalog(byKind: Record<string, Array<Record<string, unknown>>>): string {
  const parts: string[] = []
  for (const [kind, items] of Object.entries(byKind)) {
    if (!items.length) continue
    parts.push(`**${kind}**\n${items.map((i) => `- ${i.text}`).join('\n')}`)
  }
  if (!parts.length) return ''
  return [
    'Freigegebene Formulierungen dieses Kunden. Uebernimm Klang, Satzbau und Wortwahl.',
    'Nie den Wortlaut — was hier steht, ist schon draussen.',
    '',
    ...parts,
  ].join('\n')
}
