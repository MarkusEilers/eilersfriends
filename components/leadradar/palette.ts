/**
 * Die Farbtabelle der Bewertung.
 *
 * Vier Stufen, vier klar unterscheidbare Farben — und zwar auch fuer jemanden,
 * der Rot und Gruen nicht auseinanderhalten kann. Deshalb keine Ampel: die
 * Stufen unterscheiden sich zusaetzlich in Helligkeit und Punktgroesse, nicht
 * nur im Farbton.
 */
export const RATING = {
  A: { color: '#00E5A0', glow: 'rgba(0,229,160,0.55)', label: 'Sofort anrufen', radius: 8 },
  B: { color: '#FFC247', glow: 'rgba(255,194,71,0.45)', label: 'Ansprechpartner suchen', radius: 6.5 },
  C: { color: '#7AA7FF', glow: 'rgba(122,167,255,0.35)', label: 'Beobachten', radius: 5 },
  D: { color: '#6B7280', glow: 'rgba(107,114,128,0.25)', label: 'Liegen lassen', radius: 3.5 },
} as const

export type Rating = keyof typeof RATING
export const RATINGS: Rating[] = ['A', 'B', 'C', 'D']

export const RADAR = {
  sweep: '#00E5A0',
  grid: 'rgba(0,229,160,0.16)',
  gridStrong: 'rgba(0,229,160,0.28)',
  bg: '#050B10',
}
