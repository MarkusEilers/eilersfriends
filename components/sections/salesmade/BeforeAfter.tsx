/**
 * Vorher / Nachher — taktischer Kontrast als Transformation.
 *
 * Statt zwei paralleler Spalten zeigt jede Zeile EINE horizontale
 * Transformation: links rot (Pain), Pfeil mittig, rechts blau (Outcome).
 * Die zwei Hero-Metriken (Conversion + Zyklen) bekommen Extra-Display
 * mit großen Zahlen, weil das die zwei stärksten quantitativen Versprechen sind.
 */
import { X, Check } from 'lucide-react'

interface Row {
  before: string
  after: string
  /** Optional metric to display prominently */
  metric?: {
    beforeValue: string
    afterValue: string
    label: string
  }
}

const ROWS: Row[] = [
  {
    before: 'Gespräche verlaufen nach Schema F — der Seller redet, der Kunde hört zu (oder nicht)',
    after: 'Seller führen das Gespräch — mit Struktur, Empathie und klarem Ziel',
  },
  {
    before: '72 % der Chancen verpuffen schon im ersten Gespräch',
    after: 'Discovery-Call-Conversion mehr als doppelt so hoch',
    metric: { beforeValue: '28 %', afterValue: '73 %', label: 'Discovery-Call-Conversion' },
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
    after: 'Unwiderstehliche Angebote: Der Kunde fühlt sich dumm, wenn er nicht zuschlägt',
  },
  {
    before: 'Verkaufszyklen dauern 30–50 % länger als nötig',
    after: 'Verkaufszyklen um bis zu 50 % kürzer',
    metric: { beforeValue: '+30–50 %', afterValue: '−50 %', label: 'Dauer Verkaufszyklus' },
  },
  {
    before: 'Demotivation frisst die Aktivität — Abwärtsspirale',
    after: 'Confidence erzeugt Aktivität — das Flywheel dreht aufwärts',
  },
]

const RED = '#EB0028'
const RED_BG = '#FFEBEC'
const RED_BG_SOFT = '#FFF4F5'
const BLUE = '#1A5FD4'
const BLUE_BG = '#EBF1FF'
const BLUE_BG_SOFT = '#F4F7FE'
const NAVY = '#0F1E3A'

export function BeforeAfter() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: BLUE_BG, color: BLUE, border: `1px solid ${BLUE_BG}` }}
          >
            Vorher / Nachher
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Der Unterschied ist
            <br className="hidden sm:block" /> im nächsten Gespräch spürbar.
          </h2>
        </div>

        {/* Column labels */}
        <div className="hidden md:grid grid-cols-2 gap-3 mb-3 px-2">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: RED, color: '#FFFFFF' }}
            >
              <X size={14} strokeWidth={3} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: RED }}>
                Ohne Academy
              </div>
              <div className="text-[11px] text-gray-500">Freestyle-Vertrieb</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: BLUE, color: '#FFFFFF' }}
            >
              <Check size={14} strokeWidth={3} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>
                Mit der Academy
              </div>
              <div className="text-[11px] text-gray-500">Methodik</div>
            </div>
          </div>
        </div>

        {/* Pair rows */}
        <div className="space-y-3">
          {ROWS.map((r, i) => {
            const isHero = !!r.metric
            return (
              <div
                key={i}
                className="rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative isolate"
                style={{
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  boxShadow: isHero
                    ? '0 6px 24px rgba(15,30,58,0.06)'
                    : '0 1px 2px rgba(15,30,58,0.03)',
                }}
              >
                {/* Vertical hairline divider (desktop only) */}
                <div
                  className="hidden md:block absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 pointer-events-none"
                  aria-hidden="true"
                  style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(15,30,58,0.10) 25%, rgba(15,30,58,0.10) 75%, transparent 100%)' }}
                />

                {/* Before (left) */}
                <div
                  className="p-5 sm:p-6 flex gap-3 items-start"
                  style={{ backgroundColor: isHero ? RED_BG : RED_BG_SOFT }}
                >
                  <X size={16} className="mt-0.5 flex-shrink-0" style={{ color: RED }} strokeWidth={3} />
                  <div className="flex-1 min-w-0">
                    {r.metric && (
                      <div
                        className="font-bold leading-none mb-1.5"
                        style={{ color: RED, fontSize: '2rem' }}
                      >
                        {r.metric.beforeValue}
                      </div>
                    )}
                    <div className={`leading-relaxed ${isHero ? 'text-sm font-medium' : 'text-sm'}`} style={{ color: NAVY }}>
                      {r.before}
                    </div>
                  </div>
                </div>

                {/* Mobile divider strip */}
                <div
                  className="md:hidden h-px"
                  style={{ background: `linear-gradient(90deg, ${RED}40 0%, ${NAVY} 50%, ${BLUE}40 100%)` }}
                />

                {/* After (right) */}
                <div
                  className="p-5 sm:p-6 flex gap-3 items-start"
                  style={{ backgroundColor: isHero ? BLUE_BG : BLUE_BG_SOFT }}
                >
                  <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: BLUE }} strokeWidth={3} />
                  <div className="flex-1 min-w-0">
                    {r.metric && (
                      <div
                        className="font-bold leading-none mb-1.5"
                        style={{ color: BLUE, fontSize: '2rem' }}
                      >
                        {r.metric.afterValue}
                      </div>
                    )}
                    <div className={`leading-relaxed ${isHero ? 'text-sm font-medium' : 'text-sm'}`} style={{ color: NAVY }}>
                      {r.after}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
