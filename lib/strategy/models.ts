/**
 * Modell-Rollen statt fest verdrahteter Modellnamen.
 *
 * Eine Rolle beschreibt die Absicht und bleibt stabil, während Modelle wechseln.
 * Ein Modellwechsel ist damit eine Änderung an einer Stelle statt an fünfzehn.
 * Für Ausnahmen gibt es den Override je Prompt.
 */

export type ModelRole =
  | 'strategie'      // Analyse, Struktur, Urteil — ICP, Beef Radar, Funnel-Mathematik
  | 'copy'           // stimmkritische Texte — Angebot, Landingpage, Outreach
  | 'recherche'      // mit Web-Zugriff — Website, Wettbewerb, Dream 100
  | 'sounding_board' // Gegenüber zum Durchdenken: stellt Fragen, statt Antworten zu liefern
  | 'kritik'         // greift ein Ergebnis an — was hält nicht, wo steigt der Leser aus
  | 'voice_check'    // prüft Stimm-Konsistenz gegen Charta und Verbotsliste

/**
 * Welches Modell hinter welcher Rolle steht.
 *
 * Der Aufrufer erkennt den Anbieter am Namen: Was mit „claude" anfaengt, geht
 * zu Anthropic, alles andere zu OpenAI. Ein Wechsel ist deshalb eine Zeile
 * hier und keine Aenderung im Lauf.
 *
 * Warum jetzt Claude: Das OpenAI-Konto erlaubt 30.000 Token je Minute. Ein
 * Langform-Lauf macht zwoelf bis achtzehn Aufrufe, einzelne davon
 * siebzehntausend Token gross — drei Laeufe sind daran gestorben, bevor ein
 * Text fertig war. Ueber die Umgebungsvariablen laesst sich jede Rolle
 * einzeln zurueckdrehen, ohne Deploy.
 */
export const ROLE_MODEL: Record<ModelRole, string> = {
  strategie: process.env.MODEL_STRATEGIE ?? 'claude-sonnet-5',
  copy: process.env.MODEL_COPY ?? 'claude-sonnet-5',
  // Recherche bekommt das Material vorbereitet übergeben — der Agent sammelt
  // und belegt, er sucht nicht selbst. Deshalb reicht dasselbe Modell.
  recherche: process.env.MODEL_RECHERCHE ?? 'claude-sonnet-5',
  sounding_board: process.env.MODEL_SOUNDING ?? 'claude-sonnet-5',
  // Prüfen ist Fleißarbeit gegen eine Liste, kein Urteil über Substanz.
  kritik: process.env.MODEL_KRITIK ?? 'claude-sonnet-5',
  voice_check: process.env.MODEL_VOICE ?? 'claude-haiku-4-5-20251001',
}

export const ROLE_LABEL: Record<ModelRole, string> = {
  strategie: 'Strategie — Analyse, Struktur, Urteil',
  copy: 'Copy — stimmkritische Texte',
  recherche: 'Recherche — mit Web-Zugriff',
  sounding_board: 'Sounding Board — denkt mit, stellt Fragen',
  kritik: 'Kritik — greift das Ergebnis an',
  voice_check: 'Voice-Check — Stimm-Konsistenz',
}

/**
 * Was ein Prompt produziert. Fakten füttern das Datenmodell, Urteile nicht.
 *   facts  — strukturierte Fakten über den Kunden (füllen strategy_facts)
 *   review — Befunde zu einem vorgelegten Ergebnis (Kritik, Voice-Check)
 *   dialog — Fragen und Denkanstöße (Sounding Board), nichts wird gespeichert
 */
export type PromptKind = 'facts' | 'review' | 'dialog'

export const ROLE_DEFAULT_KIND: Record<ModelRole, PromptKind> = {
  strategie: 'facts',
  copy: 'facts',
  recherche: 'facts',
  sounding_board: 'dialog',
  kritik: 'review',
  voice_check: 'review',
}

export function resolveModel(role: ModelRole, override?: string | null): string {
  return override?.trim() || ROLE_MODEL[role] || ROLE_MODEL.strategie
}

/** Ab dieser Konfidenz gilt ein Agent-Fakt ohne Rückfrage als bestätigt. */
export const AUTO_CONFIRM_THRESHOLD = 0.75
