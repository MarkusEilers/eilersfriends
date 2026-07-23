import type { MetadataRoute } from 'next'
import { routing } from '@/lib/i18n/routing'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eilersfriends.com'

// path -> priority. de = no prefix (default), en/es get /<locale> prefix.
const ROUTES: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1.0, freq: 'weekly' },
  { path: 'salesmade', priority: 0.9, freq: 'weekly' },
  { path: 'frameworks', priority: 0.9, freq: 'weekly' },
  { path: 'academy', priority: 0.8, freq: 'monthly' },
  { path: 'markus', priority: 0.6, freq: 'monthly' },
  { path: 'aljona', priority: 0.6, freq: 'monthly' },
  { path: 'blog', priority: 0.7, freq: 'weekly' },
  { path: 'kontakt', priority: 0.7, freq: 'monthly' },
  { path: 'schedule', priority: 0.6, freq: 'monthly' },
  { path: 'impressum', priority: 0.2, freq: 'yearly' },
  { path: 'datenschutz', priority: 0.2, freq: 'yearly' },
  { path: 'agb', priority: 0.2, freq: 'yearly' },
]

function url(locale: string, path: string) {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  const seg = path ? `/${path}` : ''
  return `${BASE}${prefix}${seg}` || BASE
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return ROUTES.flatMap((r) =>
    routing.locales.map((locale) => ({
      url: url(locale, r.path),
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, url(l, r.path)]),
        ),
      },
    })),
  )
}
