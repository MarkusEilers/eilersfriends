// Team-Roster für den AboutUs-Block im Angebot. key = stabiler Identifier.
export interface TeamMember {
  key: string; name: string; role: string; bio: string
  photo?: string; accent: string; calendly: string
}

export const TEAM: TeamMember[] = [
  { key: 'markus', name: 'Markus Eilers', role: 'Revenue Systems · B2B-Vertrieb',
    bio: 'Kundengewinnungs-Profi mit 25 Jahren Erfahrung im B2B-Vertrieb. Hat über 500 Gründer:innen geholfen, planbares Umsatzwachstum aufzubauen.',
    photo: '/markus-photo.jpg', accent: '#1A5FD4', calendly: '/schedule/markus/kennenlernen-30' },
  { key: 'aljona', name: 'Aljona Eilers', role: 'Liquid Leadership',
    bio: 'TEDx Speaker, WSJ Bestseller-Autorin und ehemalige Bolshoi-Ballerina. Hat 500+ Führungskräfte als Leadership & Culture Coach begleitet — Transformational Leadership für Gründer:innen, die ihre nächste Stufe erreichen wollen.',
    photo: '/aljona-photo.jpg', accent: '#D4192B', calendly: '/schedule/aljona' },
  { key: 'cosima', name: 'Cosima Bär', role: 'Customer Success',
    bio: 'Begleitet Kunden durch Onboarding und Umsetzung — damit aus Plänen messbare Ergebnisse im Alltag werden.',
    accent: '#0E9DDD', calendly: '/schedule/cosima' },
  { key: 'daniel', name: 'Daniel', role: 'Sales Development',
    bio: 'Verantwortet die systematische Erstansprache und Qualifizierung — der Motor für eine planbare Pipeline.',
    accent: '#7C3AED', calendly: '/schedule/daniel' },
]

export function membersFromKeys(keys?: string[] | null): TeamMember[] {
  const list = Array.isArray(keys) && keys.length ? keys : ['markus', 'aljona']
  const picked = list.map((k) => TEAM.find((m) => m.key === k)).filter(Boolean) as TeamMember[]
  return picked.length ? picked : TEAM.filter((m) => m.key === 'markus' || m.key === 'aljona')
}
