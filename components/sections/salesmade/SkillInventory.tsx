/**
 * SalesMade Skill-Inventar — 16 Skills über 5 Disziplinen.
 *
 * Reihenfolge folgt der Logik eines echten Deals:
 * Pipeline → Strategie → Discovery → Botschaft → Closing.
 */
import { Compass, Eye, MessageSquare, Handshake, Magnet } from 'lucide-react'

interface Skill {
  name: string
  tagline: string
}

interface Discipline {
  id: string
  number: string
  name: string
  description: string
  icon: typeof Compass
  accent: string
  accentLight: string
  skills: Skill[]
}

const DISCIPLINES: Discipline[] = [
  {
    id: 'pipeline',
    number: '01',
    name: 'Pipeline & Hebel',
    description: 'Systematisch, planbar, skalierbar — bevor das erste Gespräch beginnt.',
    icon: Magnet,
    accent: '#1A5FD4',
    accentLight: '#EBF1FF',
    skills: [
      { name: 'Social Media Rockstar', tagline: 'Der 9-Schritte-AI-Content-Prozess für magnetische Inbound-Leads' },
      { name: 'The Magnetic Outreach Framework', tagline: 'Intriguing Cold Call + Godfather Letters — Outbound, das nicht nervt' },
    ],
  },
  {
    id: 'strategy',
    number: '02',
    name: 'Strategie & Vorbereitung',
    description: 'Was wir tun, bevor wir den Mund aufmachen.',
    icon: Compass,
    accent: '#1A5FD4',
    accentLight: '#EBF1FF',
    skills: [
      { name: 'Customer Intelligence & Account Research', tagline: 'Wer sitzt da, was zählt für sie' },
      { name: 'The Identity Switch', tagline: 'Wer wird mein ICP gerade — und positioniere ich uns dafür?' },
      { name: 'Funnel Math', tagline: 'Die Zahlen hinter dem System' },
      { name: 'Strategische Vorbereitung', tagline: '18-Min AI-Worksheet vor jedem wichtigen Gespräch' },
    ],
  },
  {
    id: 'discovery',
    number: '03',
    name: 'Discovery & Erstgespräch',
    description: 'Die ersten 60 Sekunden bis zum ersten Value-Hit.',
    icon: Eye,
    accent: '#1A5FD4',
    accentLight: '#EBF1FF',
    skills: [
      { name: 'Instant Influence', tagline: 'Die 3 Zutaten, die Kunden im ersten Gespräch gewinnen' },
      { name: 'Limbische Kommunikation & Körpersprache', tagline: 'Was Kunden lesen, bevor wir reden' },
      { name: 'Taktische Empathie & Vertrauensaufbau', tagline: '90 Sekunden zur Resonanz, Voss-Style' },
    ],
  },
  {
    id: 'persuasion',
    number: '04',
    name: 'Botschaft & Überzeugung',
    description: 'Wir tragen Sinn, nicht Features.',
    icon: MessageSquare,
    accent: '#1A5FD4',
    accentLight: '#EBF1FF',
    skills: [
      { name: 'Core Messages', tagline: 'Die 11 Botschaften, die jede:r Unternehmer:in im Schlaf können sollte' },
      { name: 'Belief Bridge / Überzeugungspfad', tagline: 'Die Brücke vom alten ins neue Glaubenssystem bauen' },
      { name: 'Bulletproof Delivery / Optimum Path', tagline: 'Der gezielte Weg zum ersten erlebten Value' },
    ],
  },
  {
    id: 'closing',
    number: '05',
    name: 'Angebot · Verhandlung · Closing',
    description: 'Vom Vorschlag zum verbindlichen Ja.',
    icon: Handshake,
    accent: '#1A5FD4',
    accentLight: '#EBF1FF',
    skills: [
      { name: 'Unwiderstehliche B2B-Angebote', tagline: 'Der 8-Schritte-Bauplan' },
      { name: 'Beef Radar', tagline: 'Value-Kommunikation passend zu den echten Needs' },
      { name: 'Einwände gezielt vorwegnehmen', tagline: 'Bevor sie ausgesprochen werden, sind sie schon entwaffnet' },
      { name: 'Bombensichere Verhandlungen', tagline: 'Die 9 Prinzipien für mehrwertige Abschlüsse' },
      { name: 'Recommendation Pitch', tagline: 'Verkaufen, indem man empfiehlt — Käufer:in im Driver-Seat' },
    ],
  },
]

export function SkillInventory() {
  const totalSkills = DISCIPLINES.reduce((sum, d) => sum + d.skills.length, 0)

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Skills · {totalSkills} Module
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Was Deine Verkäufer:innen wirklich beherrschen werden.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            {totalSkills} Skills in fünf Disziplinen. Jeder Skill kommt als eigenständiges Modul mit
            Bauplan, AI-Werkzeugen und einem Sparring-Szenario, in dem er live geübt wird.
          </p>
        </div>

        <div className="space-y-10">
          {DISCIPLINES.map((d) => {
            const Icon = d.icon
            return (
              <div key={d.id}>
                {/* Discipline header */}
                <div className="mb-5 flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: d.accentLight, color: d.accent, border: `1px solid ${d.accent}30` }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs font-mono font-bold" style={{ color: d.accent }}>{d.number}</span>
                      <h3 className="text-xl font-bold sm:text-2xl" style={{ color: '#0D0D0B' }}>
                        {d.name}
                      </h3>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600">{d.description}</p>
                  </div>
                </div>

                {/* Skill cards grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {d.skills.map((s) => (
                    <div
                      key={s.name}
                      className="rounded-2xl bg-white p-5 border transition-all hover:-translate-y-0.5"
                      style={{ borderColor: '#E5E7EB' }}
                    >
                      <h4 className="text-sm font-bold leading-snug" style={{ color: '#0D0D0B' }}>
                        {s.name}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">{s.tagline}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Jedes Modul wird gemessen — nicht nur „besucht". Über alle 16 Skills hinweg gibt es{' '}
            <strong style={{ color: '#0D0D0B' }}>fünf Schwierigkeitsstufen im Sparring</strong>,{' '}
            in denen Deine Verkäufer:innen ihr Können live unter Beweis stellen.
          </p>
        </div>
      </div>
    </section>
  )
}
