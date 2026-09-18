import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureAgentSchema } from './schema'

/**
 * Wissenspakete.
 *
 * Ein Paket gehoert entweder allen (org_id NULL) oder einem Mandanten. Gibt es
 * beides unter demselben Schluessel, gewinnt der Mandant — sonst koennte ein
 * Kunde seine Voice-Charta nie gegen unsere setzen, und genau das ist der Punkt.
 */

export interface KnowledgeItem {
  key: string | null; title: string | null; body: string
  tags: string[]; weight: number; is_gold: boolean
}
export interface Pack {
  key: string; kind: string; name: string; description: string | null
  items: KnowledgeItem[]
}

export async function loadPacks(keys: string[], orgId?: string | null): Promise<Pack[]> {
  await ensureAgentSchema()
  if (!keys.length) return []
  const rows = (await db.execute(sql`
    SELECT DISTINCT ON (p.key) p.key, p.kind, p.name, p.description, p.id
    FROM knowledge_packs p
    WHERE p.is_active
      AND p.key IN (SELECT jsonb_array_elements_text(${JSON.stringify(keys)}::jsonb))
      AND (p.org_id IS NULL OR p.org_id = ${orgId ?? null}::uuid)
    ORDER BY p.key, (p.org_id IS NOT NULL) DESC`)) as unknown as
    Array<{ id: string; key: string; kind: string; name: string; description: string | null }>

  const out: Pack[] = []
  for (const p of rows) {
    const items = (await db.execute(sql`
      SELECT key, title, body, COALESCE(tags,'[]'::jsonb) AS tags, weight, is_gold
      FROM knowledge_items WHERE pack_id = ${p.id}
      ORDER BY is_gold DESC, weight DESC, sort`)) as unknown as KnowledgeItem[]
    out.push({ key: p.key, kind: p.kind, name: p.name, description: p.description, items })
  }
  return out
}

/**
 * Die Pakete als Prompt-Block.
 *
 * Reihenfolge ist Absicht: Haltung zuerst, Verbote danach, Beispiele zuletzt.
 * Wer die Beispiele nach oben stellt, bekommt Nachahmung statt Anwendung.
 */
export function renderPacks(packs: Pack[]): string {
  const order = ['methode', 'voice', 'verbote', 'kanal', 'beispiele']
  const sorted = [...packs].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
  const blocks: string[] = []
  for (const p of sorted) {
    if (!p.items.length) continue
    const head = p.kind === 'beispiele'
      ? `### ${p.name}\nUebernimm Klang, Satzbau und Rhythmus. Nie den Wortlaut — was hier steht, ist schon draussen.`
      : `### ${p.name}${p.description ? `\n${p.description}` : ''}`
    const body = p.items
      .map((i) => (i.title ? `**${i.title}**\n${i.body}` : i.body))
      .join('\n\n')
    blocks.push(`${head}\n\n${body}`)
  }
  return blocks.join('\n\n---\n\n')
}

/** Die Verbotsliste als Wortliste — der Linter braucht sie ohne Prosa. */
export function bannedWords(packs: Pack[]): string[] {
  const pack = packs.find((p) => p.kind === 'verbote')
  if (!pack) return []
  return pack.items
    .filter((i) => i.key === 'wort' || i.tags.includes('wort'))
    .map((i) => i.body.trim())
    .filter(Boolean)
}

export async function upsertPack(input: {
  key: string; kind: string; name: string; description?: string | null
  orgId?: string | null
  items: Array<{ key?: string | null; title?: string | null; body: string; tags?: string[]; weight?: number; isGold?: boolean }>
  replace?: boolean
}) {
  await ensureAgentSchema()
  const rows = (await db.execute(sql`
    INSERT INTO knowledge_packs (org_id, key, kind, name, description)
    VALUES (${input.orgId ?? null}, ${input.key}, ${input.kind}, ${input.name}, ${input.description ?? null})
    ON CONFLICT (key, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET name = EXCLUDED.name, kind = EXCLUDED.kind,
                  description = EXCLUDED.description, updated_at = now()
    RETURNING id`)) as unknown as { id: string }[]
  const packId = rows[0].id

  if (input.replace) await db.execute(sql`DELETE FROM knowledge_items WHERE pack_id = ${packId}`)
  let sort = 0
  for (const it of input.items) {
    await db.execute(sql`
      INSERT INTO knowledge_items (pack_id, key, title, body, tags, weight, is_gold, sort)
      VALUES (${packId}, ${it.key ?? null}, ${it.title ?? null}, ${it.body},
              ${JSON.stringify(it.tags ?? [])}::jsonb, ${it.weight ?? 50},
              ${Boolean(it.isGold)}, ${sort++})`)
  }
  return packId
}

/* ─────────────────────────── Auswahl aus dem Katalog ─────────────────────────── */

export interface IndexRow {
  pack: string; kind: string; key: string | null; title: string | null; tags: string[]
}

/**
 * Das Verzeichnis: nur Titel und Schlagworte, keine Rümpfe.
 *
 * 514 Bausteine im Prompt wären ein halbes Buch und würden jede Aufmerksamkeit
 * ersticken. Ausgewählt wird auf dem Verzeichnis, geladen wird erst danach —
 * dasselbe Verfahren, mit dem ein Mensch in ein Regal greift.
 */
export async function catalogIndex(input: {
  kinds?: string[]; tags?: string[]; orgId?: string | null; limit?: number
}): Promise<IndexRow[]> {
  await ensureAgentSchema()
  const rows = await db.execute(sql`
    SELECT p.key AS pack, p.kind, i.key, i.title, COALESCE(i.tags,'[]'::jsonb) AS tags
    FROM knowledge_items i JOIN knowledge_packs p ON p.id = i.pack_id
    WHERE p.is_active
      AND (p.org_id IS NULL OR p.org_id = ${input.orgId ?? null}::uuid)
      ${input.kinds?.length
        ? sql`AND p.kind IN (SELECT jsonb_array_elements_text(${JSON.stringify(input.kinds)}::jsonb))`
        : sql``}
      ${input.tags?.length
        ? sql`AND i.tags ?| ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(input.tags)}::jsonb))`
        : sql``}
    ORDER BY p.kind, p.key, i.sort
    LIMIT ${input.limit ?? 400}`)
  return rows as unknown as IndexRow[]
}

/** Die Rümpfe der ausgewählten Bausteine. */
export async function loadItems(refs: Array<{ pack: string; key: string }>, orgId?: string | null) {
  await ensureAgentSchema()
  if (!refs.length) return []
  const rows = await db.execute(sql`
    SELECT p.key AS pack, p.kind, p.name AS pack_name, i.key, i.title, i.body
    FROM knowledge_items i JOIN knowledge_packs p ON p.id = i.pack_id
    WHERE p.is_active AND (p.org_id IS NULL OR p.org_id = ${orgId ?? null}::uuid)
      AND (p.key || '/' || COALESCE(i.key,'')) IN (
        SELECT jsonb_array_elements_text(${JSON.stringify(refs.map((r) => `${r.pack}/${r.key}`))}::jsonb))
    LIMIT 12`)
  return rows as unknown as Array<{
    pack: string; kind: string; pack_name: string; key: string; title: string; body: string
  }>
}

export function renderIndex(rows: IndexRow[]): string {
  const byPack = new Map<string, IndexRow[]>()
  for (const r of rows) {
    const list = byPack.get(r.pack) ?? []
    list.push(r); byPack.set(r.pack, list)
  }
  return [...byPack.entries()]
    .map(([pack, list]) =>
      `**${pack}**\n${list.map((r) => `- ${r.key} · ${r.title ?? ''}`).join('\n')}`)
    .join('\n\n')
}
