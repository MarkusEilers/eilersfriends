/**
 * Die Autoren des Blogs.
 *
 * Zwei Menschen, zwei Handschriften, zwei Farbwelten. Das Blau gehoert Markus
 * seit der ersten Seite, das Rot mit dem Burgunder dahinter gehoert Aljona —
 * beides steht schon auf ihren Personenseiten. Der Blog erbt es, statt sich
 * etwas Eigenes auszudenken: eine dritte Farbwelt fuer denselben Absender waere
 * genau die Art von Inkonsequenz, die man einer Marke ansieht.
 */

export type AuthorSlug = 'markus' | 'aljona' | 'team'

export interface Author {
  slug: AuthorSlug
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
  /** Disziplin fuer den Filter im Hub */
  discipline: 'revenue' | 'leadership' | 'both'
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
    discipline: 'revenue',
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
    discipline: 'leadership',
  },
  /**
   * Die dritte Welt: Eilers+Friends als Absender — der Hub, die Serie
   * „Gekippt bei Minute …", Kundenstorys ohne einzelne Autorin. Navy mit Gold,
   * damit sie neben Blau (SalesMade) und Rot (Aljona) eigenstaendig bleibt.
   */
  team: {
    slug: 'team',
    name: 'Eilers+Friends',
    role: 'Revenue Systems + Transformational Leadership',
    tagline: 'Winning Team Stories',
    bio: 'Markus und Aljona Eilers mit Team. Was wir in über 500 Founder-Sparrings über Vertrieb und Führung lernen, mit Frameworks zum Mitnehmen.',
    avatar: '',
    page: '/team',
    booking: '/schedule',
    accent: '#0F1E3A',
    deep: '#0F1E3A',
    tint: '#FFF8E6',
    onDeep: '#FFD37A',
    topics: ['Kundenstory', 'Revenue Systems', 'Leadership', 'Gesprächsführung'],
    discipline: 'both',
  },
}

/** Die beiden Handschriften — fuer den Autoren-Umschalter. */
export const AUTHOR_LIST = [AUTHORS.markus, AUTHORS.aljona]
/** Alle drei Welten — fuer den Editor. */
export const ALL_AUTHORS = [AUTHORS.markus, AUTHORS.aljona, AUTHORS.team]

/** Faellt auf Markus zurueck — der Blog begann als sein Donnerstag-Briefing. */
export function authorOf(slug?: string | null): Author {
  return AUTHORS[(slug ?? '') as Author['slug']] ?? AUTHORS.markus
}
