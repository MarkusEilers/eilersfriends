import type { MetadataRoute } from 'next'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { routing } from '@/lib/i18n/routing'
import { SITE } from '@/lib/seo/site'

export const revalidate = 3600

// Pfad -> Priorität. DE ohne Präfix, EN/ES mit /<locale>.
const ROUTES: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1.0, freq: 'weekly' },
  { path: 'academy', priority: 0.95, freq: 'weekly' },
  { path: 'frameworks', priority: 0.9, freq: 'weekly' },
  { path: 'mystery-shopping', priority: 0.85, freq: 'weekly' },
  { path: 'gespraechs-check', priority: 0.8, freq: 'monthly' },
  { path: 'blog', priority: 0.7, freq: 'weekly' },
  { path: 'liquidleadership', priority: 0.85, freq: 'monthly' },
  { path: 'markus', priority: 0.6, freq: 'monthly' },
  { path: 'aljona', priority: 0.6, freq: 'monthly' },
  { path: 'kontakt', priority: 0.6, freq: 'monthly' },
  { path: 'schedule', priority: 0.5, freq: 'monthly' },
  { path: 'impressum', priority: 0.1, freq: 'yearly' },
  { path: 'datenschutz', priority: 0.1, freq: 'yearly' },
  { path: 'agb', priority: 0.1, freq: 'yearly' },
]

function url(locale: string, path: string) {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  return `${SITE}${prefix}${path ? `/${path}` : ''}`
}
const entry = (path: string, priority: number, freq: MetadataRoute.Sitemap[number]['changeFrequency'], last: Date) =>
  routing.locales.map((locale) => ({
    url: url(locale, path), lastModified: last, changeFrequency: freq, priority,
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, url(l, path)])) },
  }))

type Row = Record<string, unknown>
const rows = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const out: MetadataRoute.Sitemap = ROUTES.flatMap((r) => entry(r.path, r.priority, r.freq, now))
  // Kostenlose Frameworks (veröffentlichte Framework-Seiten)
  const fw = rows(await db.execute(sql`SELECT slug, updated_at FROM landing_pages WHERE status = 'published' AND template_key = 'framework-leadmagnet'`).catch(() => []))
  for (const f of fw) out.push(...entry(`frameworks/${f.slug}`, 0.75, 'monthly', new Date(String(f.updated_at))))
  // Blog-Beiträge (nur veröffentlichte, je Sprache wie angelegt)
  const posts = rows(await db.execute(sql`SELECT slug, locale, updated_at FROM blog_posts WHERE status = 'published'`).catch(() => []))
  for (const p of posts) {
    out.push({ url: url(String(p.locale || 'de'), `blog/${p.slug}`), lastModified: new Date(String(p.updated_at)), changeFrequency: 'monthly', priority: 0.6 })
  }
  return out
}
