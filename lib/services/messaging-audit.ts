/**
 * Messaging-Audit — der Dienst.
 *
 * Er faellt in zwei Haelften, und die Trennung ist keine Kosmetik:
 *
 *   Recherche und Urteil  → ein Agentenlauf (diese Datei)
 *   Gesetzte Broschuere   → der Render-Dienst (kommt spaeter)
 *
 * Beide haengen an einem Auftrag. Solange der Renderer fehlt, endet ein
 * Auftrag mit dem fertigen Bericht und dem Vermerk, dass das Dokument noch
 * aussteht — das ist ehrlicher als ein PDF, das es nicht gibt.
 */

/** Was sich je Kunde einstellen laesst. */
export interface AuditSettings extends Record<string, unknown> {
  /** Wie tief die Recherche geht. Mehr Quellen heisst mehr Zeit und mehr Kosten. */
  tiefe: 'knapp' | 'normal' | 'gruendlich'
  /** Welche Quellenklassen geprueft werden. Eine leere Klasse ist selbst ein Befund. */
  quellen: string[]
  /** Suchanfragen je Quellenklasse — die groesste Stellschraube fuer Kosten. */
  suchen_je_quelle: number
  /** Die sieben Dimensionen, oder eine Auswahl davon. */
  dimensionen: string[]
  /** Wird der ICP unabhaengig vom Messaging der Firma recherchiert? */
  icp_soll: boolean
  /** Vergleich gegen die Benchmark-Datenbank. */
  benchmark: boolean
  /** Ton der Kundenfassung. Die interne Fassung ist immer direkt. */
  ton: 'direkt' | 'zurueckhaltend'
  /** Dokumentkuerzel-Serie fuer die Broschuere. */
  doc_serie: string
  /** Wird die Broschuere erzeugt, sobald der Renderer steht? */
  broschuere: boolean
  /** Bilder fuer die Broschuere erzeugen (kostet je Bild). */
  bilder: number
  /** Wer eine Nachricht bekommt, wenn ein Auftrag fertig ist. */
  benachrichtigen: string[]
}

export const AUDIT_DEFAULTS: AuditSettings = {
  tiefe: 'normal',
  quellen: ['website', 'linkedin', 'aussensicht', 'ads', 'community', 'presse'],
  suchen_je_quelle: 3,
  dimensionen: ['beef', 'infotainment', 'instant-influence', 'pmm', 'offer', 'funnel', 'seo'],
  icp_soll: true,
  benchmark: true,
  ton: 'zurueckhaltend',
  doc_serie: 'EFGMA',
  broschuere: true,
  bilder: 4,
  benachrichtigen: ['markus@eilersfriends.com'],
}

/** Die Quellenklassen mit dem, was sie beitragen — fuer die Oberflaeche. */
export const QUELLEN: Array<{ key: string; name: string; was: string }> = [
  { key: 'website', name: 'Website & Landingpages', was: 'Der Kern. Headlines, CTAs, Pricing — hier wird großzügig zitiert.' },
  { key: 'linkedin', name: 'LinkedIn', was: 'Firmenseite und C-Level. Hier entscheidet sich Infotainment und Instant Influence.' },
  { key: 'aussensicht', name: 'Außensicht', was: 'G2, Capterra, Kununu, Presse — wie Kunden den Wert in ihren Worten beschreiben.' },
  { key: 'ads', name: 'Anzeigen', was: 'Meta, Google, LinkedIn Ad Library. Keine Ads ist auch ein Befund.' },
  { key: 'community', name: 'Community & Nachfrage', was: 'Reddit, Quora — welche Fragen der Markt wirklich stellt.' },
  { key: 'presse', name: 'News & PR', was: 'Meldungen, Funding, Interviews der Gründer.' },
  { key: 'crm', name: 'Eigenes CRM', was: 'Lead-Kommentare als Kontext — erscheinen nie in der Kundenfassung.' },
]

export const DIMENSIONEN: Array<{ key: string; name: string }> = [
  { key: 'beef', name: 'Beef Radar (WHAT/HOW/WHY)' },
  { key: 'infotainment', name: 'Infotainment' },
  { key: 'instant-influence', name: 'Instant Influence' },
  { key: 'pmm', name: 'Product-Market-Match' },
  { key: 'offer', name: 'Irresistible Offer' },
  { key: 'funnel', name: 'Funnel & HVCO' },
  { key: 'seo', name: 'SEO / GEO' },
]

/**
 * Was ein Lauf ungefaehr kostet.
 *
 * Grob, aber nicht geraten: Die Suchzahl ist die einzige Groesse, die vor dem
 * Lauf feststeht, und sie ist der teuerste Posten. Der Rest ist Erfahrung aus
 * den bisherigen Laeufen.
 */
export function schaetzung(s: AuditSettings): { suchen: number; bilder: number; hinweis: string } {
  const faktor = s.tiefe === 'knapp' ? 0.6 : s.tiefe === 'gruendlich' ? 1.8 : 1
  const suchen = Math.round(s.quellen.length * s.suchen_je_quelle * faktor)
    + (s.icp_soll ? Math.round(5 * faktor) : 0)
  const bilder = s.broschuere ? s.bilder : 0
  return {
    suchen, bilder,
    hinweis: `${suchen} Suchanfragen, ${bilder} Bilder, ${s.dimensionen.length} Dimensionen`,
  }
}
