import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export interface Post {
  id: string
  locale: string
  translation_of: string | null
  slug: string
  title: string
  subtitle: string | null
  excerpt: string | null
  content: string | null
  hero_image: string | null
  og_image: string | null
  author_slug: 'markus' | 'aljona'
  tags: string[]
  reading_minutes: number | null
  status: string
  published_at: string | null
}

let ready = false

/**
 * Der Blog stand als leeres Geruest da: zwei Seiten, eine Tabelle, kein Beitrag
 * und kein Editor. Hier kommen die Felder dazu, ohne die eine Autorenseite
 * nicht geht — wer geschrieben hat, worum es geht, und welches Bild oben steht.
 */
export async function ensureBlogSchema() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(160) UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      og_image TEXT,
      author VARCHAR(64) DEFAULT 'Markus Eilers',
      reading_minutes INTEGER,
      status VARCHAR(16) DEFAULT 'draft' NOT NULL,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    )`)
  for (const col of [
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_slug VARCHAR(24) NOT NULL DEFAULT 'markus'`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS subtitle TEXT`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS hero_image TEXT`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS locale VARCHAR(5) NOT NULL DEFAULT 'de'`,
    sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS translation_of UUID`,
    sql`CREATE INDEX IF NOT EXISTS blog_posts_author_idx ON blog_posts (author_slug, published_at DESC)`,
    sql`CREATE INDEX IF NOT EXISTS blog_posts_locale_idx ON blog_posts (locale, published_at DESC)`,
  ]) {
    await db.execute(col).catch(() => {})
  }
  ready = true
}

/**
 * Beitraege in einer Sprache — mit Rueckfall auf Deutsch.
 *
 * Wer die englische Seite aufruft, soll nicht vor einer leeren Liste stehen,
 * nur weil erst drei von zwoelf Beitraegen uebersetzt sind. Also: was uebersetzt
 * ist, in der gewuenschten Sprache; der Rest im Original.
 */
export async function listPosts(opts?: {
  author?: string | null; limit?: number; includeDrafts?: boolean; exclude?: string
  locale?: string
}): Promise<Post[]> {
  await ensureBlogSchema()
  const locale = opts?.locale ?? 'de'
  const rows = await db.execute(sql`
    SELECT p.id, p.slug, p.title, p.subtitle, p.excerpt, p.hero_image, p.og_image, p.author_slug,
           COALESCE(p.tags, '[]'::jsonb) AS tags, p.reading_minutes, p.status, p.published_at,
           p.locale, p.translation_of
    FROM blog_posts p
    WHERE ${opts?.includeDrafts ? sql`TRUE` : sql`p.status = 'published' AND p.published_at IS NOT NULL`}
      ${opts?.author ? sql`AND p.author_slug = ${opts.author}` : sql``}
      ${opts?.exclude ? sql`AND p.slug <> ${opts.exclude}` : sql``}
      AND (
        p.locale = ${locale}
        OR (p.locale = 'de' AND NOT EXISTS (
              SELECT 1 FROM blog_posts t
              WHERE t.translation_of = p.id AND t.locale = ${locale} AND t.status = 'published'))
      )
    ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
    LIMIT ${opts?.limit ?? 30}`)
  return rows as unknown as Post[]
}

/** Die Geschwister eines Beitrags — fuer die Sprachumschaltung im Editor. */
export async function translationsOf(id: string) {
  await ensureBlogSchema()
  const rows = await db.execute(sql`
    SELECT id, locale, slug, status, title FROM blog_posts
    WHERE id = ${id} OR translation_of = ${id}
       OR translation_of = (SELECT translation_of FROM blog_posts WHERE id = ${id})
    ORDER BY (locale = 'de') DESC, locale`)
  return (rows as unknown as Array<{ id: string; locale: string; slug: string; status: string; title: string }>)
    .filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i)
}

export async function getPost(slug: string, includeDrafts = false): Promise<Post | null> {
  await ensureBlogSchema()
  const rows = await db.execute(sql`
    SELECT *, COALESCE(tags, '[]'::jsonb) AS tags FROM blog_posts
    WHERE slug = ${slug} ${includeDrafts ? sql`` : sql`AND status = 'published'`} LIMIT 1`)
  return (rows as unknown as Post[])[0] ?? null
}

/**
 * Verwandte Beitraege: erst gemeinsame Schlagworte, dann derselbe Autor, dann
 * das Neueste. Ohne die Reihenfolge waere es eine zufaellige Liste, und eine
 * zufaellige Liste liest niemand.
 */
export async function relatedPosts(post: Post, limit = 3): Promise<Post[]> {
  await ensureBlogSchema()
  const rows = await db.execute(sql`
    SELECT id, slug, title, subtitle, excerpt, hero_image, og_image, author_slug,
           COALESCE(tags,'[]'::jsonb) AS tags, reading_minutes, status, published_at,
           (SELECT COUNT(*) FROM jsonb_array_elements_text(COALESCE(tags,'[]'::jsonb)) t
              WHERE t IN (SELECT jsonb_array_elements_text(${JSON.stringify(post.tags ?? [])}::jsonb))) AS shared
    FROM blog_posts
    WHERE status = 'published' AND slug <> ${post.slug}
    ORDER BY shared DESC, (author_slug = ${post.author_slug}) DESC, published_at DESC NULLS LAST
    LIMIT ${limit}`)
  return rows as unknown as Post[]
}

export async function countsByAuthor(): Promise<Record<string, number>> {
  await ensureBlogSchema()
  const rows = await db.execute(sql`
    SELECT author_slug, COUNT(*)::int AS n FROM blog_posts
    WHERE status = 'published' GROUP BY author_slug`)
  const out: Record<string, number> = {}
  for (const r of rows as unknown as { author_slug: string; n: number }[]) out[r.author_slug] = r.n
  return out
}
