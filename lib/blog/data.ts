import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Datenschicht der Beiträge.
 *
 * Neben dem Text hält jeder Beitrag strukturiert fest, worüber er spricht: Firmen, Personen,
 * Kennzahlen, Zitate, Kernaussagen, Themen, Frameworks, Quellen. Gepflegt im Editor (story.data),
 * gespiegelt in die Tabelle blog_entities — damit Startseite, Übersicht, Suche und künftige
 * Beiträge darauf zugreifen können („alle Beiträge mit smapOne“, „alle Kennzahlen zu Discovery“).
 */
import type { PostData } from './formats'
export type { PostData }

export const DATA_KINDS = ['company', 'person', 'metric', 'quote', 'insight', 'topic', 'framework', 'source'] as const

let ready = false
export async function ensureDataSchema() {
  if (ready) return
  for (const q of [
    sql`CREATE TABLE IF NOT EXISTS blog_entities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL,
      kind VARCHAR(16) NOT NULL,
      name TEXT NOT NULL,
      value TEXT,
      detail TEXT,
      sort INTEGER NOT NULL DEFAULT 0
    )`,
    sql`CREATE INDEX IF NOT EXISTS blog_entities_post_idx ON blog_entities (post_id)`,
    sql`CREATE INDEX IF NOT EXISTS blog_entities_kind_name_idx ON blog_entities (kind, lower(name))`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS search_text TEXT`,
    sql`CREATE INDEX IF NOT EXISTS blog_posts_search_idx ON blog_posts USING gin (to_tsvector('german', coalesce(search_text, '')))`,
  ]) await db.execute(q).catch(() => {})
  ready = true
}

/** Text ohne Baustein-Zeichen — für Suche und Auszüge */
export function plainText(content: string | null) {
  return (content ?? '')
    .replace(/^:::\w*\s*/gm, '').replace(/^:::$/gm, '')
    .replace(/^#{2,3} /gm, '').replace(/^[-*>~^=] /gm, '').replace(/^\d+[.)] /gm, '')
    .replace(/^@([^:]+):/gm, '$1:').replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|==|\|/g, ' ').replace(/[ \t]+/g, ' ').trim()
}

/** Datenschicht eines Beitrags speichern: Einträge spiegeln + Suchtext aktualisieren */
export async function syncPostData(post: { id: string; title: string; subtitle?: string | null; excerpt?: string | null; content?: string | null; tags?: unknown; story?: { data?: PostData } | null }) {
  await ensureDataSchema()
  const d: PostData = post.story?.data ?? {}
  const rows: Array<[string, string, string | null, string | null]> = [
    ...(d.companies ?? []).map((c) => ['company', c.name, c.domain ?? null, c.role ?? null] as [string, string, string | null, string | null]),
    ...(d.people ?? []).map((p) => ['person', p.name, p.kind ?? null, p.role ?? null] as [string, string, string | null, string | null]),
    ...(d.metrics ?? []).map((m) => ['metric', m.label, m.value, m.source ?? null] as [string, string, string | null, string | null]),
    ...(d.quotes ?? []).map((q) => ['quote', q.text, q.own ? 'own' : null, q.by ?? null] as [string, string, string | null, string | null]),
    ...(d.insights ?? []).map((t) => ['insight', t, null, null] as [string, string, string | null, string | null]),
    ...(d.topics ?? []).map((t) => ['topic', t, null, null] as [string, string, string | null, string | null]),
    ...(d.frameworks ?? []).map((t) => ['framework', t, null, null] as [string, string, string | null, string | null]),
    ...(d.sources ?? []).map((s) => ['source', s.name, s.url ?? null, null] as [string, string, string | null, string | null]),
  ].filter((r) => r[1]?.trim())
  await db.execute(sql`DELETE FROM blog_entities WHERE post_id = ${post.id}`)
  for (const [i, r] of rows.entries()) {
    await db.execute(sql`INSERT INTO blog_entities (post_id, kind, name, value, detail, sort) VALUES (${post.id}, ${r[0]}, ${r[1].trim()}, ${r[2]}, ${r[3]}, ${i})`)
  }
  const tags = Array.isArray(post.tags) ? (post.tags as string[]).join(' ') : ''
  const search = [post.title, post.subtitle, post.excerpt, tags, rows.map((r) => [r[1], r[2], r[3]].filter(Boolean).join(' ')).join(' '), plainText(post.content ?? '')].filter(Boolean).join('\n')
  await db.execute(sql`UPDATE blog_posts SET search_text = ${search} WHERE id = ${post.id}`)
}

/** Alle Einträge einer Art über alle veröffentlichten Beiträge — z. B. alle Firmen oder Kennzahlen */
export async function entitiesOf(kind: (typeof DATA_KINDS)[number], opts?: { name?: string; limit?: number }) {
  await ensureDataSchema()
  const rows = await db.execute(sql`
    SELECT e.name, e.value, e.detail, p.slug, p.title, p.published_at
    FROM blog_entities e JOIN blog_posts p ON p.id = e.post_id
    WHERE e.kind = ${kind} AND p.status = 'published'
      ${opts?.name ? sql`AND lower(e.name) = lower(${opts.name})` : sql``}
    ORDER BY p.published_at DESC NULLS LAST, e.sort
    LIMIT ${opts?.limit ?? 100}`)
  return rows as unknown as Array<{ name: string; value: string | null; detail: string | null; slug: string; title: string; published_at: string | null }>
}

/** Datenschicht aus dem Text vorschlagen (wird im Editor geprüft und gespeichert) */
export async function extractPostData(input: { title: string; subtitle?: string; content: string }): Promise<PostData> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY fehlt')
  const system = `Du baust die Datenschicht eines Blogbeitrags von Eilers+Friends (B2B-Vertrieb, Leadership).
Lies den Beitrag und gib strukturiert zurück, worüber er spricht. Nur was wörtlich im Text steht — nichts erfinden, keine Zahl ergänzen.
- companies: echte Firmen, die vorkommen (name, role: in welcher Rolle, z. B. „Kunde“, „Beispiel“, „eigene Firma von Markus“, domain wenn sicher bekannt)
- people: Personen und Figuren (name, role, kind: "real" für echte Menschen, "figur" für erfundene Typen wie „Winfried Windt“)
- metrics: Zahlen mit Bedeutung (value wörtlich, label: wofür, source wenn genannt)
- quotes: markante wörtliche Sätze (text, by: wer, own: true wenn vom Autor selbst)
- insights: 3–6 Kernaussagen als kurze, eigenständige Sätze
- topics: 3–8 Themen-Schlagworte
- frameworks: genannte Methoden/Frameworks (z. B. „Instant Influence“, „Neugier-Formel“)
- sources: genannte Studien/Quellen (name, url wenn genannt)`
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1', temperature: 0.1, max_tokens: 3000,
      messages: [{ role: 'system', content: system }, { role: 'user', content: `Titel: ${input.title}\nUntertitel: ${input.subtitle ?? ''}\n\n${plainText(input.content).slice(0, 24000)}` }],
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`Modell ${res.status}`)
  const j = await res.json()
  const d = JSON.parse(j.choices?.[0]?.message?.content ?? '{}') as PostData
  return {
    companies: d.companies ?? [], people: d.people ?? [], metrics: d.metrics ?? [], quotes: d.quotes ?? [],
    insights: d.insights ?? [], topics: d.topics ?? [], frameworks: d.frameworks ?? [], sources: d.sources ?? [],
  }
}
