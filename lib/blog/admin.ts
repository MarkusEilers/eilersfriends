import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureBlogSchema, type Post } from './posts'

/**
 * Der Redaktionsbereich.
 *
 * Vier Zustaende: Entwurf, in Pruefung, geplant, veroeffentlicht. Der dritte ist
 * der, den man spaeter am meisten braucht — ein Beitrag, der am Donnerstag um
 * sieben von selbst erscheint, ohne dass jemand wach sein muss.
 */

export type PostStatus = 'draft' | 'review' | 'scheduled' | 'published'

export async function ensureAdminColumns() {
  await ensureBlogSchema()
  for (const s of [
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS hero_alt TEXT`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image_prompt TEXT`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS comments_open BOOLEAN NOT NULL DEFAULT true`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS updated_by UUID`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS locale VARCHAR(5) NOT NULL DEFAULT 'de'`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS translation_of UUID`,
  ]) await db.execute(s).catch(() => {})
}

export const LOCALES = ['de', 'en', 'es'] as const
export const LOCALE_LABEL: Record<string, string> = { de: 'Deutsch', en: 'English', es: 'Español' }

export interface AdminPost extends Post {
  hero_alt: string | null
  image_prompt: string | null
  comments_open: boolean
  updated_at: string
  comment_count?: number
  open_comments?: number
}

export async function listAll(filter?: { author?: string | null; status?: string | null }) {
  await ensureAdminColumns()
  const rows = await db.execute(sql`
    SELECT p.*, COALESCE(p.tags,'[]'::jsonb) AS tags,
           (SELECT COUNT(*)::int FROM blog_comments c WHERE c.post_id = p.id AND c.status = 'freigegeben') AS comment_count,
           (SELECT COUNT(*)::int FROM blog_comments c WHERE c.post_id = p.id AND c.status IN ('neu','zurueckgehalten')) AS open_comments
    FROM blog_posts p
    WHERE TRUE
      ${filter?.author ? sql`AND p.author_slug = ${filter.author}` : sql``}
      ${filter?.status ? sql`AND p.status = ${filter.status}` : sql``}
    ORDER BY COALESCE(p.published_at, p.updated_at) DESC
    LIMIT 200`)
  return rows as unknown as AdminPost[]
}

export async function getById(id: string): Promise<AdminPost | null> {
  await ensureAdminColumns()
  const rows = await db.execute(sql`
    SELECT *, COALESCE(tags,'[]'::jsonb) AS tags FROM blog_posts WHERE id = ${id} LIMIT 1`)
  return (rows as unknown as AdminPost[])[0] ?? null
}

/** Aus dem Titel, und bei Kollision mit einer Zahl dahinter. */
export async function uniqueSlug(title: string, ignoreId?: string): Promise<string> {
  const base = title.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'beitrag'
  for (let i = 0; i < 40; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`
    const rows = await db.execute(sql`
      SELECT id FROM blog_posts WHERE slug = ${candidate} ${ignoreId ? sql`AND id <> ${ignoreId}` : sql``} LIMIT 1`)
    if (!(rows as unknown as unknown[]).length) return candidate
  }
  return `${base}-${Date.now()}`
}

/** Ungefaehr 200 Woerter je Minute, mindestens eine. */
export const readingMinutes = (text: string) =>
  Math.max(1, Math.round(text.trim().split(/\s+/).filter(Boolean).length / 200))

export interface SaveInput {
  id?: string | null
  title: string; subtitle?: string | null; excerpt?: string | null; content?: string | null
  authorSlug: 'markus' | 'aljona'
  tags?: string[]
  heroImage?: string | null; heroAlt?: string | null; imagePrompt?: string | null
  status?: PostStatus
  publishedAt?: string | null
  commentsOpen?: boolean
  locale?: string
  translationOf?: string | null
  userId?: string | null
}

export async function savePost(input: SaveInput): Promise<AdminPost> {
  await ensureAdminColumns()
  const minutes = readingMinutes(input.content ?? '')
  const status = input.status ?? 'draft'

  // Ein geplanter Beitrag ohne Zeitpunkt waere ein Beitrag, der nie erscheint.
  const publishedAt =
    status === 'published' ? (input.publishedAt ?? new Date().toISOString())
    : status === 'scheduled' ? input.publishedAt
    : input.publishedAt ?? null

  if (input.id) {
    const rows = await db.execute(sql`
      UPDATE blog_posts SET
        title = ${input.title},
        slug = ${await uniqueSlug(input.title, input.id)},
        subtitle = ${input.subtitle ?? null},
        excerpt = ${input.excerpt ?? null},
        content = ${input.content ?? null},
        author_slug = ${input.authorSlug},
        author = ${input.authorSlug === 'markus' ? 'Markus Eilers' : 'Aljona Eilers'},
        tags = ${JSON.stringify(input.tags ?? [])}::jsonb,
        hero_image = ${input.heroImage ?? null},
        hero_alt = ${input.heroAlt ?? null},
        image_prompt = ${input.imagePrompt ?? null},
        reading_minutes = ${minutes},
        status = ${status},
        published_at = ${publishedAt},
        comments_open = ${input.commentsOpen ?? true},
        locale = ${input.locale ?? 'de'},
        updated_by = ${input.userId ?? null},
        updated_at = now()
      WHERE id = ${input.id}
      RETURNING *, COALESCE(tags,'[]'::jsonb) AS tags`)
    return (rows as unknown as AdminPost[])[0]
  }

  const rows = await db.execute(sql`
    INSERT INTO blog_posts (slug, title, subtitle, excerpt, content, author, author_slug, tags,
      hero_image, hero_alt, image_prompt, reading_minutes, status, published_at, comments_open,
      locale, translation_of, updated_by)
    VALUES (${await uniqueSlug(input.title)}, ${input.title}, ${input.subtitle ?? null},
            ${input.excerpt ?? null}, ${input.content ?? null},
            ${input.authorSlug === 'markus' ? 'Markus Eilers' : 'Aljona Eilers'}, ${input.authorSlug},
            ${JSON.stringify(input.tags ?? [])}::jsonb, ${input.heroImage ?? null}, ${input.heroAlt ?? null},
            ${input.imagePrompt ?? null}, ${minutes}, ${status}, ${publishedAt},
            ${input.commentsOpen ?? true}, ${input.locale ?? 'de'}, ${input.translationOf ?? null},
            ${input.userId ?? null})
    RETURNING *, COALESCE(tags,'[]'::jsonb) AS tags`)
  return (rows as unknown as AdminPost[])[0]
}

export async function deletePost(id: string) {
  await ensureAdminColumns()
  await db.execute(sql`DELETE FROM blog_posts WHERE id = ${id}`)
}

/** Was faellig ist, geht raus. Laeuft aus dem Cron, einmal die Stunde. */
export async function publishDue(): Promise<string[]> {
  await ensureAdminColumns()
  const rows = await db.execute(sql`
    UPDATE blog_posts SET status = 'published', updated_at = now()
    WHERE status = 'scheduled' AND published_at IS NOT NULL AND published_at <= now()
    RETURNING slug`)
  return (rows as unknown as { slug: string }[]).map((r) => r.slug)
}

/** Vorschlaege fuer Schlagworte: erst die des Autors, dann alle uebrigen. */
export async function knownTags(authorSlug?: string | null) {
  await ensureBlogSchema()
  const rows = await db.execute(sql`
    SELECT t AS tag, COUNT(*)::int AS n,
           SUM(CASE WHEN author_slug = ${authorSlug ?? ''} THEN 1 ELSE 0 END)::int AS mine
    FROM blog_posts, jsonb_array_elements_text(COALESCE(tags,'[]'::jsonb)) t
    GROUP BY t ORDER BY mine DESC, n DESC LIMIT 40`)
  return rows as unknown as Array<{ tag: string; n: number; mine: number }>
}
