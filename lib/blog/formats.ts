/** Reine Daten — auch im Browser nutzbar (Editor). */

/** Formate im Hub. Die Reihenfolge ist die der Tabs. */
export const FORMATS = [
  { key: 'kundenstory', label: 'Kundenstories' },
  { key: 'serie', label: 'Gekippt bei Minute …' },
  { key: 'framework', label: 'Frameworks' },
  { key: 'podcast', label: 'Podcast' },
  { key: 'sparring', label: 'Sparring-Notizen' },
  { key: 'video', label: 'Videos' },
  { key: 'artikel', label: 'Artikel' },
] as const
export type FormatKey = (typeof FORMATS)[number]['key']
export const FORMAT_LABEL: Record<string, string> = {
  kundenstory: 'Kundenstory', serie: 'Serie', framework: 'Framework', podcast: 'Podcast',
  sparring: 'Sparring-Notiz', video: 'Video', artikel: 'Artikel',
}

/** Die Bausteine einer Kundenstory — alle optional. */
export interface StoryData {
  facts?: { company?: string; phase?: string; program?: string; coach?: string }
  metrics?: Array<{ value: string; label: string }>
  before?: string; after?: string
  quote?: string; quote_by?: string
  /** Kasten „Für Dich, wenn …“ in der Seitenleiste */
  for_whom?: string
  /** Framework, das hinter der Story steht (Slug der Framework-Seite) */
  framework_slug?: string
  /** Audiofassung zum Anhören */
  audio_url?: string
  /** Serie: Kasten unter dem Kopf (Teile mit Label, Titel, optional Link) */
  series?: { name: string; parts: Array<{ label: string; title: string; href?: string; current?: boolean }> }
  /** Datenschicht: Firmen, Personen, Kennzahlen, Zitate, Kernaussagen, Themen, Frameworks, Quellen (siehe lib/blog/data.ts) */
  data?: PostData
  /** Eigener Abschluss-Aufruf statt „Gemeinsam: Gewinner-Teams“ */
  cta?: { eyebrow?: string; title?: string; button?: string; href?: string }
}

/** Datenschicht eines Beitrags (gespiegelt in blog_entities, siehe lib/blog/data.ts) */
export interface PostData {
  companies?: Array<{ name: string; role?: string; domain?: string }>
  people?: Array<{ name: string; role?: string; kind?: 'real' | 'figur' }>
  metrics?: Array<{ value: string; label: string; source?: string }>
  quotes?: Array<{ text: string; by?: string; own?: boolean }>
  insights?: string[]
  topics?: string[]
  frameworks?: string[]
  sources?: Array<{ name: string; url?: string }>
}
