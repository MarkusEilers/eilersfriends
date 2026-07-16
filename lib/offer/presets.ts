// Angebots-Vorlagen (Presets) — bewährte Beispieltexte in Markus' Voice.
// Adaptiert aus Referenz-Angeboten + evergreen Copy. Keine Verbots-Wörter.

export interface UnderstandingPreset { label: string; title: string; goals: string[]; challenges: string[] }
export interface EmpathyPreset { label: string; statement: string; successMessage: string }
export interface GuaranteePreset { label: string; text: string }

export const UNDERSTANDING_PRESETS: UnderstandingPreset[] = [
  {
    label: 'SDR · planbare Pipeline',
    title: 'Das haben wir verstanden.',
    goals: [
      'Planbarer Zufluss qualifizierter Gespräche für Euer Team',
      'Ein vorgewärmter, validierter Markt als Ausgangspunkt',
      'Ein Forecast, auf den Ihr Euch verlassen könnt',
    ],
    challenges: [
      'Die Erstansprache ist wenig strukturiert und marktnah',
      'Gespräche schwanken in Qualität und Vorhersehbarkeit',
    ],
  },
  {
    label: 'Onboarding · Bindung',
    title: 'Das haben wir verstanden.',
    goals: [
      'Neue Kunden gewinnen in den ersten Wochen früh sichtbar',
      'Weniger Abbrüche, weil früh Momentum entsteht',
      'Ein wiederholbarer Ablauf, der Euch wenig Zeit kostet',
    ],
    challenges: [
      'Der Start ist dem Zufall überlassen',
      'Ergebnisse kommen zu spät, Kunden verlieren den Schwung',
    ],
  },
]

export const EMPATHY_PRESETS: EmpathyPreset[] = [
  {
    label: 'Perspektive · Vertrauensspiel',
    statement: 'Vertrieb ist ein Vertrauens- und Beziehungsspiel. Wer den Markt vorher versteht und die Gespräche bewusst führt, gewinnt planbarer als der, der auf gutes Timing hofft.',
    successMessage: 'Andere Teams haben mit diesem Vorgehen ihre Sales-Cycles verkürzt und ihre Abschlussquote spürbar erhöht.',
  },
  {
    label: 'Perspektive · Marathon',
    statement: 'Das hier ist ein Marathon, kein Sprint. Die Abhängigkeit von einzelnen Beziehungen und gutem Timing macht jeden Abschluss unsicher — ein systematisches Vorgehen nimmt genau diese Unsicherheit heraus, ohne die Authentizität zu verlieren.',
    successMessage: 'Genau dieses Vorgehen hat bei vergleichbaren Teams die Pipeline berechenbar gemacht.',
  },
]

export const GUARANTEE_PRESETS: GuaranteePreset[] = [
  {
    label: 'Ergebnis-Garantie (KPI)',
    text: 'Ergebnisse erreicht — oder Ihr nehmt Euer Geld zurück. Erreichen wir innerhalb der vereinbarten Laufzeit die zugesagten, messbaren Fortschritte nicht, könnt Ihr jederzeit kündigen und erhaltet die bis dahin geleisteten Zahlungen vollständig zurück.',
  },
  {
    label: 'Monatlich kündbar',
    text: 'Monatlich kündbar, wenn die vereinbarten Ziele nicht erreicht werden — und Geld zurück bei unter 50 % Zielerreichung im Monat.',
  },
]
