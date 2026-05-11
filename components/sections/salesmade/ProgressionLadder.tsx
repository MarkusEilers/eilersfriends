/**
 * SalesMade Werkstatt-Progression — 6 Stufen.
 *
 * Apprentice → Junior → Professional → Senior → Master → Principal
 *
 * Jede Stufe ist messbar an konkreten Anforderungen (Module + Sparring-Level +
 * dokumentierte Deal-Outcomes). Belohnt mit weiteren Zugängen statt nur Status.
 */
import { Check } from 'lucide-react'

interface Tier {
  rank: string
  title: string
  duration: string
  pin: string
  pinBg: string
  requirements: string[]
  unlocks: string[]
}

const TIERS: Tier[] = [
  {
    rank: 'I',
    title: 'Apprentice',
    duration: '0 – 3 Monate',
    pin: '#D1D5DB',
    pinBg: '#F3F4F6',
    requirements: [
      'Onboarding abgeschlossen',
      'Disziplin „Strategie & Vorbereitung" durchlaufen',
      'Sparring Level 1 + 2 bestanden',
    ],
    unlocks: ['Alle Module', 'Group-Coaching', 'Community-Zugang'],
  },
  {
    rank: 'II',
    title: 'Junior',
    duration: '3 – 6 Monate',
    pin: '#93B8F5',
    pinBg: '#EBF1FF',
    requirements: [
      'Disziplinen 1 + 2 + 3 durchlaufen',
      'Sparring Level 3 bestanden',
      'Erste Discovery-Call-Auswertung im Coaching',
    ],
    unlocks: ['Erweiterte Playbook-Bibliothek', 'Peer-Sparring-Rechte'],
  },
  {
    rank: 'III',
    title: 'Professional',
    duration: '6 – 12 Monate',
    pin: '#1A5FD4',
    pinBg: '#EBF1FF',
    requirements: [
      'Alle 5 Disziplinen durchlaufen',
      'Sparring Level 4 bestanden',
      '3 echte Discovery Calls im Group-Coaching ausgewertet',
      'Erste eigene Playbook-Variante gebaut',
    ],
    unlocks: ['1:1-Quartalsgespräch', 'Eigene Templates', 'LinkedIn-Badge'],
  },
  {
    rank: 'IV',
    title: 'Senior',
    duration: '12 – 18 Monate',
    pin: '#0F1E3A',
    pinBg: '#E5E9F0',
    requirements: [
      'Sparring Level 5 bestanden',
      '5 dokumentierte Deals mit Performance über Branchenschnitt',
      'Spezialthema entwickelt + intern präsentiert',
    ],
    unlocks: ['Direkter Coach-Slack', 'Faculty-Lectures-Zugang'],
  },
  {
    rank: 'V',
    title: 'Master',
    duration: '18+ Monate',
    pin: '#C8A67A',
    pinBg: '#FAF4E8',
    requirements: [
      'Coacht aktiv andere Apprentices & Juniors',
      'Beitrag zur Academy-Bibliothek (Playbook · Case · Mini-Modul)',
      'Eigener Case-Track mit reproduzierbaren Ergebnissen',
    ],
    unlocks: ['Curriculum-Roadmap-Mitsprache', 'Master-Badge (öffentlich)'],
  },
  {
    rank: 'VI',
    title: 'Principal',
    duration: 'auf Einladung',
    pin: '#D4192B',
    pinBg: '#FFEBEC',
    requirements: [
      'Mehrere Kohorten gecoacht',
      'Aktiv vortragendes Faculty-Member',
      'Mitwirkung am Curriculum',
    ],
    unlocks: ['Faculty-Berechtigung', 'IP-Mitaufbau'],
  },
]

export function ProgressionLadder() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Skill-Level
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Sechs Stufen. Eine Karriere im Verkauf.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            Jede Stufe ist <strong style={{ color: '#0D0D0B' }}>messbar</strong> — an absolvierten
            Modulen, bestandenen Sparring-Stufen und dokumentierten Deal-Outcomes. Kein
            Selbstetikettieren. Wer schnell wird, ist schneller. Wer gründlich ist, geht gründlicher.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid gap-4 lg:grid-cols-2">
          {TIERS.map((t, idx) => (
            <div
              key={t.title}
              className="relative rounded-2xl border bg-white p-6 transition-all"
              style={{ borderColor: '#E5E7EB' }}
            >
              {/* Rank + Pin */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-gray-400">
                      Stufe {t.rank}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{t.duration}</span>
                  </div>
                  <h3 className="mt-1 text-2xl font-bold" style={{ color: '#0D0D0B' }}>
                    {t.title}
                  </h3>
                </div>
                {/* Pin */}
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: t.pinBg }}
                  aria-hidden="true"
                >
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{
                      backgroundColor: t.pin,
                      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.10)',
                    }}
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="mb-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Anforderungen
                </p>
                <ul className="space-y-1.5">
                  {t.requirements.map((r) => (
                    <li key={r} className="flex gap-2 text-sm text-gray-700">
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: t.pin }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Unlocks */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Schaltet frei
                </p>
                <div className="flex flex-wrap gap-2">
                  {t.unlocks.map((u) => (
                    <span
                      key={u}
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: t.pinBg, color: t.pin }}
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-sm text-gray-500">
          Sparring-Schwierigkeitsstufen: I — V. Pro Modul ein eigener Szenario-Katalog.
        </div>
      </div>
    </section>
  )
}
