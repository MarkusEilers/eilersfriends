/**
 * Globale JSON-LD-Strukturdaten für Google:
 *  - Organization (Marke, Logo, Profile)
 *  - WebSite (Publisher-Verknüpfung)
 *  - SiteNavigationElement / ItemList = das "Inhaltsverzeichnis", das Google
 *    als Sitelinks unter dem Hauptergebnis rendern kann.
 * Server-Komponente, rendert ein <script type="application/ld+json">.
 */
import { SITE as BASE } from '@/lib/seo/site'

const NAV: { name: string; path: string }[] = [
  { name: 'SalesMade Academy', path: '/academy' },
  { name: 'Kostenlose Frameworks', path: '/frameworks' },
  { name: 'Mystery Shopping', path: '/mystery-shopping' },
  { name: 'Gesprächs-Check', path: '/gespraechs-check' },
  { name: 'Markus Eilers', path: '/markus' },
  { name: 'Aljona Eilers', path: '/aljona' },
  { name: 'Winning Team Stories', path: '/blog' },
  { name: 'Kontakt', path: '/kontakt' },
]

export function StructuredData() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE}/#organization`,
        name: 'Eilers+Friends',
        alternateName: 'EilersFriends',
        url: BASE,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE}/ef-logo.png`,
          width: 961,
          height: 472,
        },
        image: `${BASE}/ef-logo.png`,
        description:
          'Sales- und Leadership-Training für B2B-Teams: die SalesMade Academy, kostenlose Vertriebs-Frameworks, Mystery Shopping für Vertriebsteams und Leadership-Coaching mit Aljona Eilers.',
        sameAs: [
          'https://linkedin.com/in/markuseilers',
          'https://linkedin.com/in/aljonaeilers',
          'https://youtube.com/@markuseilers',
          'https://www.youtube.com/@liquid.leadership',
          'https://instagram.com/aljonaeilers',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE}/#website`,
        url: BASE,
        name: 'Eilers+Friends',
        inLanguage: ['de', 'en', 'es'],
        publisher: { '@id': `${BASE}/#organization` },
      },
      {
        '@type': 'SiteNavigationElement',
        '@id': `${BASE}/#navigation`,
        name: NAV.map((n) => n.name),
        url: NAV.map((n) => `${BASE}${n.path}`),
      },
      {
        '@type': 'ItemList',
        '@id': `${BASE}/#sitelinks`,
        name: 'Eilers+Friends — Übersicht',
        itemListElement: NAV.map((n, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: n.name,
          url: `${BASE}${n.path}`,
        })),
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  )
}
