/**
 * Arbeitsfragen je Schritt — Fallback, solange für einen Schritt noch keine
 * Bausteine (strategy_step_blocks) hinterlegt sind. Ansprache: „Ihr".
 */
export interface StepField { key: string; label: string; help?: string; type?: 'short' | 'long'; placeholder?: string }

export const STEP_FIELDS: Record<string, StepField[]> = {
  'foundation': [
    { key: 'origin', label: 'Eure Origin Story', help: 'Warum gibt es Euch? Was war der Auslöser?' },
    { key: 'culture', label: 'Wofür Ihr steht', help: 'Woran erkennt man Euch — auch ohne Logo?' },
    { key: 'unfair', label: 'Euer unfairer Vorteil', help: 'Was könnt Ihr, das andere so nicht können?', type: 'short' },
  ],
  'success-goals': [
    { key: 'objective', label: 'Das übergeordnete Ziel', help: 'Ein Satz. Was soll in 12 Monaten wahr sein?', type: 'short' },
    { key: 'key_results', label: 'Woran Ihr es messt', help: 'Je Zeile eine Kennzahl mit Ausgangswert und Zielwert.' },
    { key: 'obstacles', label: 'Was Euch bisher aufhält', help: 'Die ehrliche Version.' },
  ],
  'product-goals': [
    { key: 'goal', label: 'Ziel für dieses Produkt', help: 'Umsatz, Kunden, Marktanteil — konkret.', type: 'short' },
    { key: 'timeframe', label: 'Bis wann', type: 'short' },
    { key: 'why_now', label: 'Warum gerade jetzt', help: 'Was macht diesen Zeitpunkt richtig?' },
  ],
  'icp': [
    { key: 'who', label: 'Wer genau kauft', help: 'Rolle, Firmengröße, Branche — je präziser, desto besser.' },
    { key: 'pains', label: 'Woran sie leiden', help: 'In deren Worten, nicht in Euren.' },
    { key: 'gains', label: 'Was sie gewinnen wollen', help: 'Das Ergebnis, nicht die Funktion.' },
    { key: 'trigger', label: 'Was den Kauf auslöst', help: 'Welches Ereignis macht aus „interessant" ein „jetzt"?' },
    { key: 'anti', label: 'Für wen Ihr NICHT seid', help: 'Klare Abgrenzung spart allen Zeit.', type: 'short' },
  ],
  'compete': [
    { key: 'alternatives', label: 'Die echten Alternativen', help: 'Auch „nichts tun" und „selbst bauen" zählen.' },
    { key: 'their_story', label: 'Wie die anderen sich erzählen', help: 'Deren Versprechen in einem Satz je Anbieter.' },
    { key: 'gap', label: 'Was keiner besetzt', help: 'Die Lücke, in die Ihr hineinpasst.' },
  ],
  'beef-radar': [
    { key: 'what', label: 'WAS Ihr tut', help: 'Nüchtern: die Leistung.' },
    { key: 'how', label: 'WIE Ihr es tut', help: 'Der Unterschied im Vorgehen.' },
    { key: 'why', label: 'WARUM das zählt', help: 'Der Nutzen aus Kundensicht — der eigentliche Beef.' },
  ],
  'conviction-path': [
    { key: 'unaware', label: 'Noch ahnungslos', help: 'Was müssen sie zuerst begreifen?' },
    { key: 'problem_aware', label: 'Problem erkannt', help: 'Welche Überzeugung fehlt noch?' },
    { key: 'solution_aware', label: 'Lösungswege bekannt', help: 'Warum Euer Weg und nicht der andere?' },
    { key: 'product_aware', label: 'Euch bekannt', help: 'Welcher Zweifel bleibt?' },
    { key: 'most_aware', label: 'Entscheidungsreif', help: 'Was gibt den letzten Anstoß?' },
  ],
  'signature-solution': [
    { key: 'from', label: 'Der schmerzhafte IST-Zustand', type: 'short' },
    { key: 'to', label: 'Der gewünschte SOLL-Zustand', type: 'short' },
    { key: 'phases', label: 'Die Phasen dazwischen', help: 'Je Phase: Name, was sich verändert (von X → zu Y).' },
  ],
  'irresistible-offer': [
    { key: 'core', label: 'Das Kernangebot', help: 'Was genau bekommt der Kunde?' },
    { key: 'value_stack', label: 'Was noch dazugehört', help: 'Alles, was den Wert erhöht.' },
    { key: 'risk', label: 'Wie Ihr das Risiko nehmt', help: 'Garantie, Probe, Etappenzahlung.' },
    { key: 'why_not', label: 'Warum jemand ablehnt', help: 'Die drei häufigsten Einwände — und Eure Antwort.' },
  ],
  'soft-launch': [
    { key: 'audience', label: 'Wer zuerst erfährt davon', type: 'short' },
    { key: 'sequence', label: 'Die Etappen', help: 'Was passiert wann, über welchen Kanal?' },
    { key: 'proof', label: 'Welcher Beweis Euch fehlt', help: 'Was wollt Ihr im Soft Launch lernen?' },
  ],
  'funnel-math': [
    { key: 'target', label: 'Umsatzziel', type: 'short' },
    { key: 'deal', label: 'Durchschnittlicher Auftragswert', type: 'short' },
    { key: 'rates', label: 'Eure Conversion-Raten', help: 'Besucher → Lead → Gespräch → Abschluss.' },
    { key: 'gap', label: 'Was daraus folgt', help: 'Wie viel Zufluss braucht Ihr oben wirklich?' },
  ],
  'high-value-content': [
    { key: 'asset', label: 'Das zentrale Asset', help: 'Was gebt Ihr weg, das echte Arbeit spart?' },
    { key: 'promise', label: 'Das Versprechen', type: 'short' },
    { key: 'distribution', label: 'Wie es Reichweite bekommt' },
  ],
  'ads-lab': [
    { key: 'angle', label: 'Der Winkel', help: 'Welche Überzeugung greift die Anzeige an?' },
    { key: 'hooks', label: 'Drei Hooks zum Testen' },
    { key: 'audience', label: 'Zielgruppen-Einstellung', type: 'short' },
  ],
  'landing-page': [
    { key: 'headline', label: 'Die Headline', help: 'Wer, was, warum — in einem Satz.', type: 'short' },
    { key: 'proof', label: 'Der Beweis', help: 'Zahlen, Referenzen, Logos.' },
    { key: 'cta', label: 'Der nächste Schritt', type: 'short' },
  ],
  'outreach': [
    { key: 'trigger', label: 'Der Anlass der Ansprache', help: 'Warum schreibt Ihr genau diese Person genau jetzt?' },
    { key: 'beats', label: 'Die Beats', help: 'Je Zeile: Tag, Kanal, Kernbotschaft.' },
    { key: 'objection', label: 'Der häufigste Abbruchgrund', type: 'short' },
  ],
}

export const DEFAULT_FIELDS: StepField[] = [
  { key: 'notes', label: 'Euer Arbeitsstand', help: 'Haltet hier fest, was Ihr zu diesem Schritt erarbeitet habt.' },
]

export function fieldsForStep(key: string): StepField[] {
  return STEP_FIELDS[key] ?? DEFAULT_FIELDS
}
