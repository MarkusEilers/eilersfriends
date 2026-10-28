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
}
