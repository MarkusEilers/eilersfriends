import { db } from '@/lib/db'
import { trustLogos } from '@/lib/db/schema'
import { eq, asc, sql } from 'drizzle-orm'

/**
 * Trust Logo Strip — admin-editable list of partner / press logos.
 * Self-healing CREATE TABLE on every read; seed defaults if empty.
 */

export interface TrustLogo {
  id: string
  slug: string
  name: string
  domain: string | null
  src: string | null
  srcBw: string | null
  alt: string | null
  order: number
  isVisible: boolean
}

let tableEnsured = false
async function ensureTable() {
  if (tableEnsured) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS trust_logos (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        slug text NOT NULL UNIQUE,
        name text NOT NULL,
        domain text,
        src text,
        alt text,
        "order" integer NOT NULL DEFAULT 0,
        is_visible boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `)
    await db.execute(sql`
      ALTER TABLE trust_logos ADD COLUMN IF NOT EXISTS src_bw text
    `)
    tableEnsured = true
  } catch (err) {
    console.error('[trust-logos] ensureTable failed', err)
  }
}

const SEED_LOGOS = [
  { slug: 'wsj', name: 'Wall Street Journal', domain: 'wsj.com', src: '/logos/wsj.svg', order: 1 },
  { slug: 'forbes', name: 'Forbes', domain: 'forbes.com', src: '/logos/forbes.svg', order: 2 },
  { slug: 'handelsblatt', name: 'Handelsblatt', domain: 'handelsblatt.com', src: '/logos/handelsblatt.svg', order: 3 },
  { slug: 'usa-today', name: 'USA Today', domain: 'usatoday.com', src: '/logos/usa-today.svg', order: 4 },
  { slug: 'microsoft', name: 'Microsoft', domain: 'microsoft.com', src: '/logos/microsoft.svg', order: 5 },
  { slug: 'amazon', name: 'Amazon', domain: 'amazon.com', src: '/logos/amazon.svg', order: 6 },
  { slug: 'sonia-so', name: 'Sonia.so', domain: 'sonia.so', src: '/logos/sonia-so.svg', order: 7 },
  { slug: 'celero-one', name: 'Celero One', domain: 'celero.io', src: '/logos/celero-one.svg', order: 8 },
]

export async function getAllTrustLogos(): Promise<TrustLogo[]> {
  await ensureTable()
  try {
    const rows = await db.select().from(trustLogos).orderBy(asc(trustLogos.order))
    if (rows.length === 0) {
      // Seed defaults on first read
      await db.insert(trustLogos).values(SEED_LOGOS).onConflictDoNothing()
      const seeded = await db.select().from(trustLogos).orderBy(asc(trustLogos.order))
      return seeded as TrustLogo[]
    }
    return rows as TrustLogo[]
  } catch (err) {
    console.error('[trust-logos] read failed, returning seed defaults', err)
    return SEED_LOGOS.map((l, i) => ({
      id: `fallback-${i}`,
      slug: l.slug,
      name: l.name,
      domain: l.domain,
      src: l.src,
      srcBw: null,
      alt: l.name,
      order: l.order,
      isVisible: true,
    }))
  }
}

export async function getVisibleTrustLogos(): Promise<TrustLogo[]> {
  const all = await getAllTrustLogos()
  return all.filter((l) => l.isVisible)
}

export async function upsertTrustLogo(input: {
  slug: string
  name: string
  domain?: string | null
  src?: string | null
  srcBw?: string | null
  alt?: string | null
  order?: number
  isVisible?: boolean
}): Promise<void> {
  await ensureTable()
  await db.insert(trustLogos)
    .values({
      slug: input.slug,
      name: input.name,
      domain: input.domain ?? null,
      src: input.src ?? null,
      srcBw: input.srcBw ?? null,
      alt: input.alt ?? input.name,
      order: input.order ?? 0,
      isVisible: input.isVisible ?? true,
    })
    .onConflictDoUpdate({
      target: trustLogos.slug,
      set: {
        name: input.name,
        domain: input.domain ?? null,
        src: input.src ?? null,
        srcBw: input.srcBw ?? null,
        alt: input.alt ?? input.name,
        order: input.order ?? 0,
        isVisible: input.isVisible ?? true,
        updatedAt: new Date(),
      },
    })
}

export async function deleteTrustLogo(slug: string): Promise<void> {
  await ensureTable()
  await db.delete(trustLogos).where(eq(trustLogos.slug, slug))
}

export async function reorderTrustLogos(slugs: string[]): Promise<void> {
  await ensureTable()
  await Promise.all(
    slugs.map((slug, idx) =>
      db.update(trustLogos)
        .set({ order: idx + 1, updatedAt: new Date() })
        .where(eq(trustLogos.slug, slug))
    )
  )
}
