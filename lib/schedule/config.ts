// Termin-Buchung — Konfiguration (Personen, Team, Typen, Arbeitszeiten).
// Bewusst im Code (v1); Typen später im Admin editierbar.

export type Person = { slug: string; name: string; email: string; role?: string }
export type SchedType = { slug: string; name: string; durationMin: number; description: string }

export const PERSONS: Person[] = [
  { slug: 'markus', name: 'Markus Eilers', email: 'markus@eilersfriends.com', role: 'Vertrieb & AI im Sales' },
  { slug: 'aljona', name: 'Aljona Eilers', email: 'aljona@eilersfriends.com', role: 'Leadership' },
  { slug: 'cosima', name: 'Cosima Bär', email: 'cosima@eilersfriends.com', role: 'Eilers+Friends' },
  { slug: 'daniel', name: 'Daniel', email: 'daniel@eilersfriends.com', role: 'Sales Development' },
]

// „Team" = beide müssen frei sein (Schnittmenge)
export const TEAM = { slug: 'team', name: 'Markus & Aljona', members: ['markus', 'aljona'] }

export const TYPES: SchedType[] = [
  { slug: 'kennenlernen-45', name: 'Kennenlernen', durationMin: 45, description: 'Erstes Gespräch — wo steht Ihr, was wäre ein gutes Ergebnis.' },
  { slug: 'strategie-60', name: 'Strategiegespräch', durationMin: 60, description: 'Tiefer: konkreter Plan für planbares Wachstum.' },
]

// Arbeitszeiten (lokale Zeit der Mailbox / CET). Mo–Fr.
export const WORK = { tz: 'Europe/Berlin', startHour: 9, endHour: 17, days: [1, 2, 3, 4, 5], bufferMin: 15, leadHours: 12, horizonDays: 35, granularityMin: 15 }

export function personBySlug(slug: string): Person | undefined { return PERSONS.find(p => p.slug === slug) }
export function typeBySlug(slug: string): SchedType | undefined { return TYPES.find(t => t.slug === slug) }
export function membersFor(slug: string): Person[] {
  if (slug === TEAM.slug) return PERSONS.filter(p => TEAM.members.includes(p.slug))
  const p = personBySlug(slug); return p ? [p] : []
}

export function entityFor(slug: string): { slug: string; name: string; sub?: string } | undefined {
  if (slug === TEAM.slug) return { slug: TEAM.slug, name: TEAM.name, sub: 'Beide frei' }
  const p = personBySlug(slug); return p ? { slug: p.slug, name: p.name, sub: p.role } : undefined
}
