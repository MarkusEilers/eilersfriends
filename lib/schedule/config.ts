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

/**
 * Teams: mehrere Menschen, ein Termin — buchbar ist nur, wo ALLE frei sind.
 *
 * Die Schnittmenge rechnet der Verfuegbarkeits-Teil schon laenger; sie war nur
 * an ein einziges, fest verdrahtetes Team gebunden. Jetzt ist es eine Liste.
 *
 * Die Reihenfolge der Mitglieder ist nicht kosmetisch: Der erste mit einem
 * verbundenen Kalender legt den Termin an und ist damit der Organisator, die
 * uebrigen werden eingeladen (siehe graph.ts).
 */
export type Team = { slug: string; name: string; members: string[]; sub?: string }

export const TEAMS: Team[] = [
  { slug: 'team', name: 'Aljona & Markus', members: ['markus', 'aljona'] },
  { slug: 'daniel-markus', name: 'Daniel & Markus', members: ['markus', 'daniel'] },
]

/** Bleibt als Name fuer das erste Team — aeltere Aufrufer erwarten ihn. */
export const TEAM = TEAMS[0]

export function teamBySlug(slug: string): Team | undefined { return TEAMS.find(t => t.slug === slug) }

export const TYPES: SchedType[] = [
  { slug: 'kennenlernen-45', name: 'Kennenlernen', durationMin: 45, description: 'Erstes Gespräch — wo steht Ihr, was wäre ein gutes Ergebnis.' },
  { slug: 'strategie-60', name: 'Strategiegespräch', durationMin: 60, description: 'Tiefer: konkreter Plan für planbares Wachstum.' },
]

// Arbeitszeiten (lokale Zeit der Mailbox / CET). Mo–Fr.
export const WORK = { tz: 'Europe/Berlin', startHour: 9, endHour: 17, days: [1, 2, 3, 4, 5], bufferMin: 15, leadHours: 12, horizonDays: 35, granularityMin: 15 }

export function personBySlug(slug: string): Person | undefined { return PERSONS.find(p => p.slug === slug) }
export function typeBySlug(slug: string): SchedType | undefined { return TYPES.find(t => t.slug === slug) }
export function membersFor(slug: string): Person[] {
  const team = teamBySlug(slug)
  // Nach der Reihenfolge im Team, nicht nach der in PERSONS: Der erste ist der
  // Organisator.
  if (team) return team.members.map(m => personBySlug(m)).filter(Boolean) as Person[]
  const p = personBySlug(slug); return p ? [p] : []
}

export function entityFor(slug: string): { slug: string; name: string; sub?: string } | undefined {
  const team = teamBySlug(slug)
  if (team) return { slug: team.slug, name: team.name, sub: team.sub ?? 'Beide frei' }
  const p = personBySlug(slug); return p ? { slug: p.slug, name: p.name, sub: p.role } : undefined
}
