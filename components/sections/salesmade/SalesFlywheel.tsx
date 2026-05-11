/**
 * Sales Performance Flywheel — die Mechanik unter den Outcomes.
 * Assessment → Skill-Aufbau → Confidence & Ergebnisse → Mehr Aktivität → zurück.
 */
import { ClipboardCheck, GraduationCap, TrendingUp, Activity, ArrowRight } from 'lucide-react'

const STAGES = [
  {
    n: '01',
    title: 'Assessment',
    tagline: 'Individuelle Diagnose',
    body:
      'Jede:r Seller tritt in einem realistischen, kniffligen Kundenszenario an. Wir sehen sofort: wo sind die echten Lücken?',
    icon: ClipboardCheck,
  },
  {
    n: '02',
    title: 'Skill-Aufbau',
    tagline: 'Maßgeschneidert',
    body:
      'Gezieltes Training genau dort, wo es fehlt. Live-Sessions, Simulationen, Coaching. Keine Zeit für Irrelevantes.',
    icon: GraduationCap,
  },
  {
    n: '03',
    title: 'Confidence & Ergebnisse',
    tagline: 'Messbare Wirkung',
    body:
      'Wer besser wird, merkt es sofort in echten Gesprächen. Höhere Conversion, bessere Deals, weniger Stress.',
    icon: TrendingUp,
  },
  {
    n: '04',
    title: 'Mehr Aktivität',
    tagline: 'Aufwärtsspirale',
    body:
      'Wer Erfolge erlebt, wird aktiver. Mehr Gespräche, mehr Pipeline, mehr Momentum. Das Flywheel dreht sich schneller.',
    icon: Activity,
  },
]

export function SalesFlywheel() {
  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Das Sales Performance Flywheel
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Kein Kurs. Ein sich selbst
            <br className="hidden sm:block" /> verstärkendes System.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            Jede Runde macht Dein Team besser. Monat für Monat. Messbar.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {STAGES.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="relative rounded-2xl border bg-white p-6"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-mono text-xs font-bold" style={{ color: '#1A5FD4' }}>
                    {s.n}
                  </span>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
                  >
                    <Icon size={18} />
                  </div>
                </div>
                <h3 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>
                  {s.title}
                </h3>
                <div className="mt-1 text-xs font-semibold" style={{ color: '#1A5FD4' }}>
                  {s.tagline}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{s.body}</p>

                {/* Forward arrow on desktop */}
                {i < STAGES.length - 1 && (
                  <div
                    className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full bg-white"
                    style={{ border: '1.5px solid #BBCFF5', color: '#1A5FD4' }}
                    aria-hidden="true"
                  >
                    <ArrowRight size={12} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pull quote */}
        <div className="mt-10 rounded-2xl border p-6 text-center" style={{ backgroundColor: '#0F1E3A', borderColor: '#0F1E3A' }}>
          <p className="text-base leading-relaxed text-white sm:text-lg">
            „Professionell ausgebildete Seller erzielen{' '}
            <strong style={{ color: '#FFD37A' }}>48 % bis 280 %</strong> höhere Umsätze —
            nicht weil sie mehr arbeiten, sondern weil sie besser sind."
          </p>
        </div>
      </div>
    </section>
  )
}
