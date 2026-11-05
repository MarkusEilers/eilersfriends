import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { localize, ensureLpI18n } from '@/lib/lp/i18n'
import { auth } from '@/lib/auth'

type Row = { id: string; type: string; content: Record<string, unknown>; content_i18n: Record<string, unknown>; status: string; page_id: string; title: string; meta_description: string | null }

/** Sektionen einer Landingpage für Seiten mit eigener Adresse (Squeeze, Checkout). */
export async function loadLpSections(slug: string, locale: string, preview = false) {
  await ensureLpI18n()
  const res = await db.execute(sql`
    SELECT s.id, s.type, s.content, s.content_i18n, p.status, p.id AS page_id, p.title, p.meta_description
    FROM landing_pages p JOIN landing_page_sections s ON s.landing_page_id = p.id
    WHERE p.slug = ${slug} AND (p.status = 'published' OR ${preview}) AND s.is_visible
    ORDER BY s."order"`)
  const list: Row[] = Array.isArray(res) ? (res as unknown as Row[]) : (((res as unknown as { rows?: Row[] }).rows) ?? [])
  if (!list.length) return null
  return {
    pageId: list[0].page_id, status: list[0].status, title: list[0].title, description: list[0].meta_description,
    sections: list.map((r) => ({ id: r.id, type: r.type, content: localize(r.content, r.content_i18n as never, locale) as Record<string, any> })),
  }
}

export async function canPreview(flag?: string) {
  if (!flag) return false
  const s = await auth().catch(() => null)
  return s?.user?.role === 'admin' || s?.user?.role === 'coach'
}
