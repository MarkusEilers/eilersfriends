/**
 * Wissen / Können / Machen — die drei Ebenen, die wir schließen.
 * Aus dem alten Draft: jede Ebene mit eigenem Inhalts-Set.
 */
import { Lightbulb, Target, Zap } from 'lucide-react'

const LEVELS = [
  {
    n: '01',
    title: 'Wissen',
    subtitle: 'Die richtigen Modelle.',
    icon: Lightbulb,
    accent: '#1A5FD4',
    accentBg: '#EBF1FF',
    intro:
      'Die richtigen Modelle, Frameworks und Erkenntnisse — verständlich, praxisnah, sofort anwendbar. Nicht Theorie um der Theorie willen.',
    points: [
      'Warum Kunden heute anders entscheiden',
      'Wie limbische Kommunikation wirklich funktioniert',
      'Was unwiderstehliche Angebote ausmacht',
      'Wie man Vertrauen in Minuten aufbaut',
      'Die 5 Mythen, die Seller ausbremsen',
    ],
  },
  {
    n: '02',
    title: 'Können',
    subtitle: 'Das Muskelgedächtnis.',
    icon: Target,
    accent: '#0F1E3A',
    accentBg: '#E5E9F0',
    intro:
      'Wissen reicht nicht. Erst durch Simulation, Feedback und Wiederholung entsteht echtes Können — das in schwierigen Gesprächen abrufbar ist.',
    points: [
      'Simulationen in 5 Schwierigkeitsstufen',
      'Echtzeit-Feedback durch erfahrene Coaches',
      'Group-Coaching mit echten Kundenfällen',
      'Einwandbehandlung bis sie sitzt',
      'Individuelle Lernpfade nach Assessment',
    ],
  },
  {
    n: '03',
    title: 'Machen',
    subtitle: 'Der tägliche Vollzug.',
    icon: Zap,
    accent: '#EB0028',
    accentBg: '#FFEBEC',
    intro:
      'Wir inspirieren Execution. Wer weiß und kann, aber nicht macht, hat nichts gewonnen. Deswegen bauen wir Struktur, Rituale und Momentum.',
    points: [
      '3 wöchentliche Rituale für Sales-Teams',
      'Die 10 Gebote erfolgreicher B2B-Seller',
      'Playbooks, die am Tag danach genutzt werden',
      'Community für Accountability & Energie',
      'GPT-Tools für schnelle Execution',
    ],
  },
]

export function MethodologyTriptych() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Unser Ansatz
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Wir schließen alle drei Lücken.
            <br className="hidden sm:block" /> Gleichzeitig.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            Die meisten Trainings vermitteln nur Wissen. Wir gehen weiter —
            bis zur echten Veränderung im Gespräch.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {LEVELS.map((L) => {
            const Icon = L.icon
            return (
              <div
                key={L.title}
                className="rounded-3xl bg-white p-7 border"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div className="flex items-start gap-3 mb-5">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: L.accentBg, color: L.accent }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold" style={{ color: L.accent }}>
                      Ebene {L.n}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: '#0D0D0B' }}>
                      {L.title}
                    </div>
                    <div className="text-xs" style={{ color: L.accent }}>{L.subtitle}</div>
                  </div>
                </div>

                <p className="mb-5 text-sm leading-relaxed text-gray-600">{L.intro}</p>

                <ul className="space-y-2.5">
                  {L.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm" style={{ color: '#374151' }}>
                      <span
                        className="mt-2 flex h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: L.accent }}
                      />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
