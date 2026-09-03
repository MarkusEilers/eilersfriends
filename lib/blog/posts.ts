import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export interface Post {
  id: string
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
    sql`CREATE INDEX IF NOT EXISTS blog_posts_author_idx ON blog_posts (author_slug, published_at DESC)`,
  ]) {
    await db.execute(col).catch(() => {})
  }
  ready = true
}

export async function listPosts(opts?: {
  author?: string | null; limit?: number; includeDrafts?: boolean; exclude?: string
}): Promise<Post[]> {
  await ensureBlogSchema()
  const rows = await db.execute(sql`
    SELECT id, slug, title, subtitle, excerpt, hero_image, og_image, author_slug,
           COALESCE(tags, '[]'::jsonb) AS tags, reading_minutes, status, published_at
    FROM blog_posts
    WHERE ${opts?.includeDrafts ? sql`TRUE` : sql`status = 'published' AND published_at IS NOT NULL`}
      ${opts?.author ? sql`AND author_slug = ${opts.author}` : sql``}
      ${opts?.exclude ? sql`AND slug <> ${opts.exclude}` : sql``}
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${opts?.limit ?? 30}`)
  return rows as unknown as Post[]
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
