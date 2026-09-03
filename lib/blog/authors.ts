/**
 * Die Autoren des Blogs.
 *
 * Zwei Menschen, zwei Handschriften, zwei Farbwelten. Das Blau gehoert Markus
 * seit der ersten Seite, das Rot mit dem Burgunder dahinter gehoert Aljona —
 * beides steht schon auf ihren Personenseiten. Der Blog erbt es, statt sich
 * etwas Eigenes auszudenken: eine dritte Farbwelt fuer denselben Absender waere
 * genau die Art von Inkonsequenz, die man einer Marke ansieht.
 */

export interface Author {
  slug: 'markus' | 'aljona'
  name: string
  role: string
  tagline: string
  bio: string
  avatar: string
  page: string
  booking: string
  /** Akzent, dunkler Grund, heller Grund fuer Flaechen */
  accent: string
  deep: string
  tint: string
  onDeep: string
  topics: string[]
}

export const AUTHORS: Record<Author['slug'], Author> = {
  markus: {
    slug: 'markus',
    name: 'Markus Eilers',
    role: 'Vertriebs- und Business-Coach',
    tagline: 'Revenue Systems',
    bio: '15+ Jahre B2B-Vertrieb. Hat über 500 Gründer und Führungskräfte dabei begleitet, reproduzierbaren Umsatz systematisch aufzubauen. Schreibt donnerstags auf, was er in der Woche im Coaching gelernt hat.',
    avatar: '/markus-photo.jpg',
    page: '/markus',
    booking: '/schedule/markus',
    accent: '#1A5FD4',
    deep: '#0F1E3A',
    tint: '#EBF1FF',
    onDeep: '#5DDBF5',
    topics: ['Angebot', 'Beef Radar', 'Garantien', 'Pipeline', 'Positionierung'],
  },
  aljona: {
    slug: 'aljona',
    name: 'Aljona Eilers',
    role: 'Leadership- und Culture-Coach',
    tagline: 'Transformational Leadership',
    bio: 'TEDx-Speakerin, Bestseller-Autorin, ehemalige Bolshoi-Ballerina. Begleitet Führungskräfte in Technologie-Unternehmen dabei, ein Team zu führen, dem andere gerne folgen.',
    avatar: '/aljona-photo.jpg',
    page: '/aljona',
    booking: '/schedule/aljona',
    accent: '#EB0028',
    deep: '#7A1019',
    tint: '#FFF1F2',
    onDeep: '#FFC9CE',
    topics: ['Leadership', 'Selbstführung', 'Kultur', 'Emotionale Intelligenz', 'Bühne'],
  },
}

export const AUTHOR_LIST = [AUTHORS.markus, AUTHORS.aljona]

/** Faellt auf Markus zurueck — der Blog begann als sein Donnerstag-Briefing. */
export function authorOf(slug?: string | null): Author {
  return AUTHORS[(slug ?? '') as Author['slug']] ?? AUTHORS.markus
}
