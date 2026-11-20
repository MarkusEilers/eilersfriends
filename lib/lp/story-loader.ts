import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { localize, ensureLpI18n } from '@/lib/lp/i18n'
import { auth } from '@/lib/auth'

type Row = { id: string; type: string; content: Record<string, unknown>; content_i18n: Record<string, unknown>; status: string; page_id: string; title: string; meta_description: string | null }

/** Sektionen einer Landingpage für Seiten mit eigener Adresse (Squeeze, Checkout). */
export async function loadLpSections(slug: string, locale: string, preview = false) {
  await ensureLpI18n()
  const res = await db.execute(sql`
    SELECT s.id, s.type, s.content, s.content_i18n, p.status, p.id AS page_id, p.title, p.meta_description, p.og_image_url
    FROM landing_pages p JOIN landing_page_sections s ON s.landing_page_id = p.id
    WHERE p.slug = ${slug} AND (p.status = 'published' OR ${preview}) AND s.is_visible
    ORDER BY s."order"`)
  const list: Row[] = Array.isArray(res) ? (res as unknown as Row[]) : (((res as unknown as { rows?: Row[] }).rows) ?? [])
  if (!list.length) return null
  const sections = list.map((r) => ({ id: r.id, type: r.type, content: localize(r.content, r.content_i18n as never, locale) as Record<string, any> }))
  return {
    pageId: list[0].page_id, status: list[0].status, title: list[0].title, description: list[0].meta_description,
    ogImage: ((list[0] as Record<string, unknown>).og_image_url as string | null) || heroImage(sections),
    sections: list.map((r) => ({ id: r.id, type: r.type, content: localize(r.content, r.content_i18n as never, locale) as Record<string, any> })),
  }
}

export async function canPreview(flag?: string) {
  if (!flag) return false
  const s = await auth().catch(() => null)
  return s?.user?.role === 'admin' || s?.user?.role === 'coach'
}

/** Bild für die Teilen-Vorschau: das erste große Bild der Seite (Hero), keine Logos oder Porträts aus späteren Abschnitten. */
export function heroImage(sections: { type: unknown; content: Record<string, any> }[]): string | null {
  for (const sec of sections.slice(0, 3)) {
    const c = sec.content ?? {}
    for (const k of ['ogImage', 'heroImage', 'backgroundImage', 'image', 'bgImage', 'photo']) {
      const v = c[k]
      if (typeof v === 'string' && /\.(jpe?g|png|webp)(\?|$)/i.test(v) && !/logo/i.test(v)) return v
    }
    const m = JSON.stringify(c).match(/"(\/(?:[\w.-]+\/)*[\w.-]*hero[\w.-]*\.(?:jpe?g|png|webp))"/i)
    if (m) return m[1]
  }
  return null
}

/** Open-Graph- und Twitter-Angaben mit großem Vorschaubild. */
export function shareMeta(title: string | undefined, description: string | undefined, image: string | null | undefined) {
  const images = image ? [{ url: image, width: 1200, height: 630, alt: title ?? 'Eilers+Friends' }] : undefined
  return {
    openGraph: { type: 'website' as const, siteName: 'Eilers+Friends', title, description, ...(images ? { images } : {}) },
    twitter: { card: 'summary_large_image' as const, title, description, ...(image ? { images: [image] } : {}) },
  }
}
