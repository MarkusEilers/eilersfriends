'use client'

import { useTranslations } from 'next-intl'

interface CardData { headline: string; body: string; source: string }

const TONES = [
  { ringFg: '#EB0028', ringBg: '#FFE5E8', cardBorder: '#FFD0D4', numberColor: '#EB0028' },
  { ringFg: '#F59E0B', ringBg: '#FEF3CE', cardBorder: '#FEE3A0', numberColor: '#B45309' },
  { ringFg: '#1A5FD4', ringBg: '#EBF1FF', cardBorder: '#BBCFF5', numberColor: '#1A5FD4' },
]
const VALUES = [84, 87, 3]

function DonutGauge({ value, fg, bg }: { value: number; fg: string; bg: string }) {
  const size = 160
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fg} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize="32" fontWeight="700" fill="#0F1E3A">
        {value}<tspan fontSize="20" fill="#9CA3AF" dx="2"> %</tspan>
      </text>
    </svg>
  )
}

export function MarketRealityStats() {
  const t = useTranslations('salesmadeExt.marketStats')
  const cards = (t.raw('cards') as CardData[]) ?? []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
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

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((c, i) => {
            const tone = TONES[i]
            return (
              <div key={i} className="relative rounded-3xl p-8 overflow-hidden flex flex-col items-center text-center"
                style={{ backgroundColor: '#FFFFFF', border: `1px solid ${tone.cardBorder}`, boxShadow: '0 4px 20px rgba(15,30,58,0.05)' }}>
                <div className="relative mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ backgroundColor: `${tone.ringFg}15`, color: tone.ringFg, border: `1px solid ${tone.ringFg}40` }}>
                  {t('badgeProblem')}
                  <span style={{ opacity: 0.65 }}>·</span>
                  {String(i + 1).padStart(2, '0')} / 03
                </div>
                <div className="relative mb-6">
                  <DonutGauge value={VALUES[i]} fg={tone.ringFg} bg={tone.ringBg} />
                </div>
                <h3 className="relative text-lg font-bold leading-snug mb-3" style={{ color: '#0D0D0B' }}>{c.headline}</h3>
                <p className="relative text-sm leading-relaxed max-w-xs" style={{ color: '#6B7280' }}>{c.body}</p>
                <p className="relative mt-5 text-[10px] uppercase tracking-[0.18em]" style={{ color: '#9CA3AF' }}>
                  {t('sourceLabel')}: {c.source}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-8 rounded-2xl p-5 text-center" style={{ backgroundColor: '#0F1E3A', color: '#FFFFFF' }}>
          <p className="text-sm leading-relaxed">
            <strong style={{ color: '#5DDBF5' }}>{t('footer1')}</strong>{t('footer2')}<strong>{t('footer3')}</strong>{t('footer4')}
          </p>
        </div>
      </div>
    </section>
  )
}
