/**
 * Wo eine Landingpage öffentlich liegt, und wie man sie vorab ansieht.
 * Gesprächs-Check und Frameworks haben eigene Adressen, alles andere /lp/.
 * Deutsch ohne Präfix, andere Sprachen mit /en, /es.
 */
export function publicPath(slug: string, templateKey?: string | null): string {
  if (slug === 'gespraechs-check') return '/gespraechs-check'
  if (templateKey === 'framework-leadmagnet') return `/frameworks/${slug}`
  return `/lp/${slug}`
}

export function pageUrl(slug: string, templateKey: string | null | undefined, status: string, locale = 'de'): string {
  const base = (locale && locale !== 'de' ? `/${locale}` : '') + publicPath(slug, templateKey)
  return status === 'published' ? base : `${base}?preview=1`
}
