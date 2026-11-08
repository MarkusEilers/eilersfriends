import { SITE } from '@/lib/seo/site'

/**
 * Strukturdaten für ein Personen-Suchergebnis: ProfilePage mit Person als Hauptentität.
 * Eine Person hat eine feste @id (…/slug#person), damit Google alle Sprachversionen derselben Person zuordnet.
 */
export interface PersonProfile {
  slug: string
  name: string
  givenName: string
  familyName: string
  image: string
  jobTitle: string
  description: string
  title: string
  award?: string[]
  knowsAbout?: string[]
  knowsLanguage?: string[]
  sameAs?: string[]
  videos?: { name: string; url: string }[]
}

export function PersonJsonLd({ locale, p }: { locale: string; p: PersonProfile }) {
  const url = `${SITE}${locale === 'de' ? '' : `/${locale}`}/${p.slug}`
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#profile`,
    url,
    name: p.title,
    inLanguage: locale,
    isPartOf: { '@id': `${SITE}/#website` },
    mainEntity: {
      '@type': 'Person',
      '@id': `${SITE}/${p.slug}#person`,
      name: p.name,
      givenName: p.givenName,
      familyName: p.familyName,
      url: `${SITE}/${p.slug}`,
      image: p.image,
      jobTitle: p.jobTitle,
      description: p.description,
      worksFor: { '@id': `${SITE}/#organization` },
      ...(p.award?.length ? { award: p.award } : {}),
      ...(p.knowsAbout?.length ? { knowsAbout: p.knowsAbout } : {}),
      ...(p.knowsLanguage?.length ? { knowsLanguage: p.knowsLanguage } : {}),
      ...(p.sameAs?.length ? { sameAs: p.sameAs } : {}),
      ...(p.videos?.length ? { subjectOf: p.videos.map((v) => ({ '@type': 'VideoObject', name: v.name, url: v.url, embedUrl: v.url.replace('watch?v=', 'embed/') })) } : {}),
    },
  }
  // eslint-disable-next-line react/no-danger
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
