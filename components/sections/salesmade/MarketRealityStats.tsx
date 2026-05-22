'use client'

import { useTranslations } from 'next-intl'

interface ClusterData { count: string; of: string; label: string; body: string; source: string }

// Distribute 33 figures across 3 rows × 11 cols (= 33). Roles by position:
//   role 0 → grey  (29 figures = "no training")
//   role 1 → amber (3 figures = "trained, no sparring")
//   role 2 → blue  (1 figure = "perfect")
//
// Hand-placed so the highlighted figures form a small focal cluster at the
// horizontal center — visual storytelling, not pseudo-random.
const ROLES: number[] = (() => {
  const r: number[] = new Array(33).fill(0)
  // The blue figure sits in the dead center (row 1, col 5 → index 16)
  r[16] = 2
  // Three amber figures cluster around the blue one in a small triangle:
  //   front-left of blue (row 2, col 5 → 27)
  //   front-right of blue (row 2, col 6 → 28)
  //   directly above-right of blue (row 0, col 6 → 6)
  r[6]  = 1
  r[27] = 1
  r[28] = 1
  return r
})()

const TONES = {
  blue:  { head: '#1A5FD4', body: '#1A5FD4', glow: 'rgba(26,95,212,0.35)' },
  amber: { head: '#B07C0A', body: '#B07C0A', glow: 'rgba(176,124,10,0.30)' },
  grey:  { head: '#C7CAD1', body: '#C7CAD1', glow: 'transparent' },
}

function Figure({ role, x, y }: { role: number; x: number; y: number }) {
  const tone = role === 2 ? TONES.blue : role === 1 ? TONES.amber : TONES.grey
  return (
    <g transform={`translate(${x} ${y})`}>
      {role > 0 && (
        <circle cx="0" cy="6" r="13" fill={tone.glow} />
      )}
      {/* head */}
      <circle cx="0" cy="-4" r="3.4" fill={tone.head} />
      {/* shoulders / body trapezoid */}
      <path d="M -5 4 Q 0 1.5 5 4 L 6.5 14 L -6.5 14 Z" fill={tone.body} />
    </g>
  )
}

export function MarketRealityStats() {
  const t = useTranslations('salesmadeExt.marketStats')
  const clusters = (t.raw('clusters') as ClusterData[]) ?? []

  const cols = 11
  const rows = 3
  const cellX = 32
  const cellY = 30
  const padX = 16
  const padY = 14
  const width = padX * 2 + (cols - 1) * cellX
  const height = padY * 2 + (rows - 1) * cellY + 20

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#FFEBEC', color: '#EB0028', border: '1px solid #F5BBBC' }}>
            {t('eyebrow')}
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('headline1')}<br className="hidden sm:block" /> {t('headline2')}
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            {t('subtext')}
          </p>
        </div>

        {/* ── Compact integrated layout: crowd left, annotations right ─── */}
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] items-center">
          {/* Crowd visualization */}
          <div className="relative">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#6B7280' }}>
              {t('crowdLabel')}
            </p>
            <div
              className="rounded-3xl p-5 sm:p-7"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F6F8 100%)',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 24px rgba(15,30,58,0.05)',
              }}
            >
              <svg
                viewBox={`0 0 ${width} ${height}`}
                width="100%"
                role="img"
                aria-label="33 typische B2B-Verkäufer:innen — 1 voll ausgebildet, 3 ausgebildet aber ohne Sparring, 29 ohne Ausbildung"
                style={{ transform: 'skewX(-8deg)' }}
              >
                {Array.from({ length: rows * cols }).map((_, i) => {
                  const row = Math.floor(i / cols)
                  const col = i % cols
                  const x = padX + col * cellX
                  const y = padY + row * cellY
                  return <Figure key={i} role={ROLES[i] ?? 0} x={x} y={y} />
                })}
              </svg>
            </div>
          </div>

          {/* Cluster annotations */}
          <div className="space-y-4">
            {clusters.map((c, i) => {
              const tone =
                i === 0
                  ? { dot: '#1A5FD4', bg: '#EBF1FF', border: '#BBCFF5', count: '#1A5FD4' }
                  : i === 1
                  ? { dot: '#B07C0A', bg: '#FFF8E6', border: '#FEE3A0', count: '#B07C0A' }
                  : { dot: '#C7CAD1', bg: '#F5F6F8', border: '#E5E7EB', count: '#6B7280' }
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-2xl p-5"
                  style={{ backgroundColor: tone.bg, border: `1px solid ${tone.border}` }}
                >
                  <div className="flex-shrink-0">
                    <div className="text-3xl font-bold leading-none" style={{ color: tone.count }}>
                      {c.count}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: tone.count, opacity: 0.7 }}>
                      {c.of}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tone.dot }} />
                      <span className="text-sm font-bold" style={{ color: '#0D0D0B' }}>
                        {c.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>{c.body}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.16em]" style={{ color: '#9CA3AF' }}>
                      {t('sourceLabel')}: {c.source}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer summary */}
        <div className="mt-10 rounded-2xl p-5 text-center" style={{ backgroundColor: '#0F1E3A', color: '#FFFFFF' }}>
          <p className="text-sm leading-relaxed">
            <strong style={{ color: '#5DDBF5' }}>{t('footer1')}</strong>{t('footer2')}<strong>{t('footer3')}</strong>{t('footer4')}
          </p>
        </div>
      </div>
    </section>
  )
}
