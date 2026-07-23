/**
 * Globale JSON-LD-Strukturdaten für Google:
 *  - Organization (Marke, Logo, Profile)
 *  - WebSite (Publisher-Verknüpfung)
 *  - SiteNavigationElement / ItemList = das "Inhaltsverzeichnis", das Google
 *    als Sitelinks unter dem Hauptergebnis rendern kann.
 * Server-Komponente, rendert ein <script type="application/ld+json">.
 */
const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eilersfriends.com'

const NAV: { name: string; path: string }[] = [
  { name: 'SalesMade', path: '/salesmade' },
  { name: 'Frameworks', path: '/frameworks' },
  { name: 'Academy', path: '/academy' },
  { name: 'Blog', path: '/blog' },
  { name: 'Markus Eilers', path: '/markus' },
  { name: 'Aljona Eilers', path: '/aljona' },
  { name: 'Kontakt', path: '/kontakt' },
  { name: 'Termin buchen', path: '/schedule' },
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
          'Systematisches Wachstum für Gründer und Vertriebsteams — Revenue Systems & Leadership Training für planbares, reproduzierbares Wachstum.',
        sameAs: [
          'https://linkedin.com/in/markuseilers',
          'https://linkedin.com/in/aljonaeilers',
          'https://youtube.com/@markuseilers',
          'https://youtube.com/@aljonaeilers',
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
