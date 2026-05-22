'use client'

import { useTranslations } from 'next-intl'

interface ClusterData { count: string; of: string; label: string; body: string; source: string }

export function MarketRealityStats() {
  const t = useTranslations('salesmadeExt.marketStats')
  const clusters = (t.raw('clusters') as ClusterData[]) ?? []

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
              className="rounded-3xl p-3 sm:p-4 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F6F8 100%)',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 24px rgba(15,30,58,0.05)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/salesmade/crowd-33-isometric.jpg"
                alt="33 typische B2B-Verkäufer:innen — 1 voll ausgebildet, 3 ausgebildet aber ohne Sparring, 29 ohne Ausbildung"
                className="w-full h-auto rounded-2xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* Cluster annotations */}
          <div className="space-y-4">
            {clusters.map((c, i) => {
              const tone =
                i === 0
                  ? { dot: '#1A5FD4', bg: '#EBF1FF', border: '#BBCFF5', count: '#1A5FD4' }
                  : i === 1
                  ? { dot: '#93B8F5', bg: '#F0F5FF', border: '#D8E4F8', count: '#5076B8' }
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
