import type { Author } from './authors'
import { FORMATS, FORMAT_LABEL } from './formats'

/** Übersetzungen der Blog-Stammdaten (Format-Namen, Autoren-Texte). Deutsch steht in formats.ts / authors.ts. */
type L = 'en' | 'es'
const TABS: Record<L, Record<string, string>> = {
  en: { kundenstory: 'Customer stories', serie: 'Tipped at minute …', framework: 'Frameworks', podcast: 'Podcast', sparring: 'Sparring notes', video: 'Videos', artikel: 'Articles', newsletter: 'GrowthLetter' },
  es: { kundenstory: 'Historias de clientes', serie: 'Se torció en el minuto …', framework: 'Frameworks', podcast: 'Podcast', sparring: 'Notas de sparring', video: 'Vídeos', artikel: 'Artículos', newsletter: 'GrowthLetter' },
}
const SINGULAR: Record<L, Record<string, string>> = {
  en: { kundenstory: 'Customer story', serie: 'Series', framework: 'Framework', podcast: 'Podcast', sparring: 'Sparring note', video: 'Video', artikel: 'Article', newsletter: 'Newsletter' },
  es: { kundenstory: 'Historia de cliente', serie: 'Serie', framework: 'Framework', podcast: 'Podcast', sparring: 'Nota de sparring', video: 'Vídeo', artikel: 'Artículo', newsletter: 'Newsletter' },
}
const AUTHOR: Record<L, Record<string, Pick<Author, 'role' | 'tagline' | 'bio'>>> = {
  en: {
    markus: { role: 'Sales and business coach', tagline: 'Revenue Systems', bio: '15+ years in B2B sales. Has helped more than 500 founders and leaders build repeatable revenue systematically. Every Thursday he writes down what he learned in coaching that week.' },
    aljona: { role: 'Leadership and culture coach', tagline: 'Transformational Leadership', bio: 'TEDx speaker, bestselling author, former Bolshoi ballerina. Helps leaders in technology companies lead a team that people want to follow.' },
    team: { role: 'Revenue Systems + Transformational Leadership', tagline: 'Winning Team Stories', bio: 'Markus and Aljona Eilers with team. What we learn about sales and leadership in more than 500 founder sparrings, with frameworks to take away.' },
  },
  es: {
    markus: { role: 'Coach de ventas y negocio', tagline: 'Revenue Systems', bio: 'Más de 15 años en ventas B2B. Ha acompañado a más de 500 fundadores y líderes a construir ingresos repetibles de forma sistemática. Cada jueves escribe lo que aprendió esa semana en el coaching.' },
    aljona: { role: 'Coach de liderazgo y cultura', tagline: 'Transformational Leadership', bio: 'Speaker TEDx, autora superventas, exbailarina del Bolshói. Acompaña a líderes de empresas tecnológicas a dirigir un equipo al que la gente quiere seguir.' },
    team: { role: 'Revenue Systems + Transformational Leadership', tagline: 'Winning Team Stories', bio: 'Markus y Aljona Eilers con su equipo. Lo que aprendemos sobre ventas y liderazgo en más de 500 sparrings con fundadores, con frameworks para llevarte.' },
  },
}
const lang = (l?: string | null): L | null => (l === 'en' || l === 'es' ? l : null)

export function formatTabs(locale?: string | null) {
  const l = lang(locale)
  return FORMATS.map((f) => ({ ...f, label: l ? TABS[l][f.key] ?? f.label : f.label }))
}
export function formatLabel(key: string | null | undefined, locale?: string | null): string | undefined {
  if (!key) return undefined
  const l = lang(locale)
  return l ? SINGULAR[l][key] ?? FORMAT_LABEL[key] : FORMAT_LABEL[key]
}
export function localizeAuthor<A extends Author>(a: A, locale?: string | null): A {
  const l = lang(locale)
  const tr = l ? AUTHOR[l][a.slug] : null
  return tr ? { ...a, ...tr } : a
}
