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

export const ROLE_MODEL: Record<ModelRole, string> = {
  strategie: 'gpt-5.5',
  copy: 'gpt-5.5',
  recherche: 'gpt-5.5',
  sounding_board: 'gpt-5.5',
  kritik: 'gpt-5.5',
  voice_check: 'gpt-5.5',
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
