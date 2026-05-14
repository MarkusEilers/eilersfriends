/**
 * 94 / 87 / 3 % — drei Zahlen, die den Markt-Status zeigen.
 *
 * Visualisierung als Donut-Ring-Gauge — jede Karte zeigt die Prozentzahl
 * als angefüllten Ring, plus Severity-Farb-Coding:
 *   94% → rot (alarming)
 *   87% → amber (warning)
 *    3% → navy + cyan-Accent, kontextualisiert mit „nur 3% sind ok"
 */

interface Stat {
  value: number
  label: string
  headline: string
  body: string
  source: string
  /** Tone palette for this stat */
  ringFg: string
  ringBg: string
  cardBg: string
  cardBorder: string
  numberColor: string
  /** Direction: true = the percentage represents a NEGATIVE situation (bigger = worse)
   *  false = represents a POSITIVE situation (smaller = worse) */
  direction: 'negative' | 'positive-tiny'
}

const STATS: Stat[] = [
  {
    value: 84,
    label: '84 %',
    headline: 'haben keine professionelle Ausbildung',
    body: 'der B2B-Seller in Europa für den Job, den sie täglich machen sollen.',
    source: 'SalesMade Academy · DACH Industry Snapshot 2024',
    ringFg: '#EB0028',
    ringBg: '#FFE5E8',
    cardBg: '#FFFFFF',
    cardBorder: '#FFD0D4',
    numberColor: '#EB0028',
    direction: 'negative',
  },
  {
    value: 87,
    label: '87 %',
    headline: 'haben kein wirksames Sparring',
    body: 'in modernen Gesprächstechniken, Social Selling oder überzeugender Präsentation.',
    source: 'Sales Enablement Society · State of Coaching 2024',
    ringFg: '#F59E0B',
    ringBg: '#FEF3CE',
    cardBg: '#FFFFFF',
    cardBorder: '#FEE3A0',
    numberColor: '#B45309',
    direction: 'negative',
  },
  {
    value: 3,
    label: '3 %',
    headline: 'arbeiten ohne vermeidbare Fehler',
    body: 'die wichtige Deals verzögern oder verhindern. Drei Prozent. Mehr nicht.',
    source: 'RAIN Group · Top Performers Benchmark 2024',
    ringFg: '#1A5FD4',
    ringBg: '#EBF1FF',
    cardBg: '#FFFFFF',
    cardBorder: '#BBCFF5',
    numberColor: '#1A5FD4',
    direction: 'negative',
  },
]

// Donut ring component — SVG-only, no JS needed.
function DonutGauge({ value, fg, bg, isDark }: { value: number; fg: string; bg: string; isDark?: boolean }) {
  const size = 160
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={bg}
        strokeWidth={stroke}
      />
      {/* Foreground arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={fg}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Center percentage text */}
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="32"
        fontWeight="700"
        fill={isDark ? '#FFFFFF' : '#0F1E3A'}
      >
        {value}
        <tspan fontSize="20" fill={isDark ? 'rgba(255,255,255,0.6)' : '#9CA3AF'} dx="2"> %</tspan>
      </text>
    </svg>
  )
}

export function MarketRealityStats() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#FFEBEC', color: '#EB0028', border: '1px solid #F5BBBC' }}
          >
            Die unbequeme Wahrheit
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            In Europa gibt es keine echte
            <br className="hidden sm:block" /> Sales-Ausbildung.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            Vertrieb ist einer der anspruchsvollsten Jobs überhaupt — Menschen lesen,
            Vertrauen aufbauen, Einwände entwaffnen, alles unter Druck. Aber dafür
            bildet niemand aus. Keine Berufsschule. Kein Studium. Keine anerkannte Zertifizierung.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STATS.map((s, i) => {
            const isDark = s.direction === 'positive-tiny'
            return (
              <div
                key={i}
                className="relative rounded-3xl p-8 overflow-hidden flex flex-col items-center text-center"
                style={{
                  backgroundColor: s.cardBg,
                  border: `1px solid ${s.cardBorder}`,
                  boxShadow: '0 4px 20px rgba(15,30,58,0.05)',
                }}
              >
                {/* Subtle background pattern */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.04]"
                  aria-hidden="true"
                  style={{
                    backgroundImage: `radial-gradient(${isDark ? '#FFFFFF' : s.ringFg} 1px, transparent 1px)`,
                    backgroundSize: '18px 18px',
                  }}
                />

                {/* Severity label */}
                <div
                  className="relative mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    backgroundColor: isDark ? 'rgba(93,219,245,0.14)' : `${s.ringFg}15`,
                    color: isDark ? '#5DDBF5' : s.ringFg,
                    border: `1px solid ${isDark ? 'rgba(93,219,245,0.30)' : s.ringFg + '40'}`,
                  }}
                >
                  {s.direction === 'negative' ? '⚠ Problem' : '★ Nur'}
                  <span style={{ opacity: 0.65 }}>·</span>
                  {String(i + 1).padStart(2, '0')} / 03
                </div>

                {/* Donut gauge */}
                <div className="relative mb-6">
                  <DonutGauge value={s.value} fg={s.ringFg} bg={s.ringBg} isDark={isDark} />
                </div>

                {/* Headline */}
                <h3
                  className="relative text-lg font-bold leading-snug mb-3"
                  style={{ color: isDark ? '#FFFFFF' : '#0D0D0B' }}
                >
                  {s.headline}
                </h3>

                {/* Body */}
                <p
                  className="relative text-sm leading-relaxed max-w-xs"
                  style={{ color: isDark ? 'rgba(255,255,255,0.75)' : '#6B7280' }}
                >
                  {s.body}
                </p>

                {/* Source attribution */}
                <p
                  className="relative mt-5 text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#9CA3AF' }}
                >
                  Quelle: {s.source}
                </p>
              </div>
            )
          })}
        </div>

        {/* Closing emphasis bar */}
        <div
          className="mt-8 rounded-2xl p-5 text-center"
          style={{
            backgroundColor: '#0F1E3A',
            color: '#FFFFFF',
          }}
        >
          <p className="text-sm leading-relaxed">
            <strong style={{ color: '#5DDBF5' }}>Drei Prozent</strong> arbeiten so, wie ein professionell ausgebildetes
            Sales-Team arbeiten würde.{' '}
            <strong>Siebenundneunzig Prozent</strong> haben Hebel, die noch nicht aktiviert sind.
          </p>
        </div>
      </div>
    </section>
  )
}
