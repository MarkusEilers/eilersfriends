/**
 * Vorher / Nachher — taktischer Kontrast.
 * Ergänzend zur strategischen „Zwei Wege"-Sektion.
 */
import { Fragment } from 'react'
import { X, Check } from 'lucide-react'

interface Row {
  before: string
  after: string
}

const ROWS: Row[] = [
  {
    before: 'Gespräche verlaufen nach Schema F — der Seller redet, der Kunde hört zu (oder nicht)',
    after: 'Seller führen das Gespräch — mit Struktur, Empathie und klarem Ziel',
  },
  {
    before: 'Discovery-Call-Conversion: ø 28 % — 72 % der Chancen verpuffen',
    after: 'Discovery-Call-Conversion auf bis zu 73 % — mehr als doppelt so hoch',
  },
  {
    before: 'Keine Struktur — jede:r im Team macht es anders, Ergebnisse nicht planbar',
    after: 'Klare Playbooks — jede:r weiß, was wann wie funktioniert',
  },
  {
    before: 'Einwände werden gefürchtet statt genutzt',
    after: 'Einwände werden antizipiert und entwaffnet — bevor sie kommen',
  },
  {
    before: 'Angebote werden verschickt — und man wartet. Und wartet.',
    after: 'Unwiderstehliche Angebote: Der Kunde fühlt sich dumm, wenn er nicht zuschlägt.',
  },
  {
    before: 'Verkaufszyklen dauern 30–50 % länger als nötig',
    after: 'Verkaufszyklen um bis zu 50 % kürzer',
  },
  {
    before: 'Demotivation frisst die Aktivität — Abwärtsspirale',
    after: 'Confidence erzeugt Aktivität — das Flywheel dreht aufwärts',
  },
]

export function BeforeAfter() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Vorher / Nachher
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Der Unterschied ist
            <br className="hidden sm:block" /> im nächsten Gespräch spürbar.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Vorher header */}
          <div
            className="rounded-2xl px-6 py-5 hidden md:block"
            style={{ backgroundColor: '#FFEBEC', border: '1px solid #F5BBBC' }}
          >
            <div className="flex items-center gap-2.5">
              <X size={18} style={{ color: '#D4192B' }} strokeWidth={3} />
              <h3 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>
                Ohne Academy <span className="text-sm font-normal text-gray-600">— Freestyle-Vertrieb</span>
              </h3>
            </div>
          </div>
          {/* Nachher header */}
          <div
            className="rounded-2xl px-6 py-5 hidden md:block"
            style={{ backgroundColor: '#EBF1FF', border: '1px solid #BBCFF5' }}
          >
            <div className="flex items-center gap-2.5">
              <Check size={18} style={{ color: '#1A5FD4' }} strokeWidth={3} />
              <h3 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>
                Mit der Academy <span className="text-sm font-normal text-gray-600">— Methodik</span>
              </h3>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((r, i) => (
            <Fragment key={i}>
              <div
                className="rounded-2xl bg-white p-5 border flex gap-3"
                style={{ borderColor: '#F5BBBC' }}
              >
                <X size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#D4192B' }} strokeWidth={3} />
                <span className="text-sm leading-relaxed" style={{ color: '#374151' }}>
                  {r.before}
                </span>
              </div>
              <div
                className="rounded-2xl bg-white p-5 border flex gap-3"
                style={{ borderColor: '#BBCFF5' }}
              >
                <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#1A5FD4' }} strokeWidth={3} />
                <span className="text-sm leading-relaxed" style={{ color: '#0D0D0B' }}>
                  {r.after}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
