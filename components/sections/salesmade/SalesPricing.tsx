'use client'

import { useTranslations } from 'next-intl'
import { Check, Star, Sparkles } from 'lucide-react'

interface TierData { name: string; features: string[]; cta: string; note: string }

const TIER_VISUALS = [
  // Anchor 397 → Launch 247 (Cohort-1 Founding discount). Anchor is the regular post-launch listing.
  { monthly: 247, anchor: 397, yearly: 2470, monthlyEffective: 205, accent: '#1A5FD4', accentBg: '#EBF1FF', highlight: false },
  // Anchor 880 → Launch 580 (1:1 capacity discount). Anchor reflects the unbundled value.
  { monthly: 580, anchor: 880, yearly: 5800, monthlyEffective: 483, accent: '#0F1E3A', accentBg: '#E5E9F0', highlight: true },
]

// Confetti pieces — colored, sized, positioned, with custom animation delays.
const CONFETTI = [
  { left: '6%',  top: '14%', size: 10, color: '#FFC93C', shape: 'circle', delay: '0s' },
  { left: '11%', top: '38%', size: 8,  color: '#F05A1A', shape: 'square', delay: '0.4s' },
  { left: '16%', top: '70%', size: 12, color: '#FFC93C', shape: 'circle', delay: '0.9s' },
  { left: '22%', top: '20%', size: 7,  color: '#93B8F5', shape: 'square', delay: '1.3s' },
  { left: '30%', top: '55%', size: 9,  color: '#FF5C8A', shape: 'circle', delay: '0.2s' },
  { left: '38%', top: '12%', size: 11, color: '#FFC93C', shape: 'square', delay: '1.0s' },
  { left: '46%', top: '42%', size: 6,  color: '#93B8F5', shape: 'circle', delay: '0.6s' },
  { left: '55%', top: '78%', size: 10, color: '#F05A1A', shape: 'square', delay: '0.0s' },
  { left: '63%', top: '18%', size: 8,  color: '#FF5C8A', shape: 'circle', delay: '1.4s' },
  { left: '71%', top: '50%', size: 12, color: '#FFC93C', shape: 'square', delay: '0.7s' },
  { left: '79%', top: '24%', size: 7,  color: '#93B8F5', shape: 'circle', delay: '1.1s' },
  { left: '85%', top: '64%', size: 11, color: '#F05A1A', shape: 'square', delay: '0.3s' },
  { left: '92%', top: '32%', size: 9,  color: '#FFC93C', shape: 'circle', delay: '0.8s' },
  { left: '95%', top: '76%', size: 8,  color: '#FF5C8A', shape: 'square', delay: '0.5s' },
]

export function SalesPricing() {
  const t = useTranslations('salesmadeExt.pricing')
  const tiers = (t.raw('tiers') as TierData[]) ?? []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">

        {/* ─── INTEGRATED Soft-Launch + Pricing Header ──────────────── */}
        <div
          className="relative overflow-hidden rounded-[28px] px-6 pb-44 pt-12 sm:px-12 sm:pb-48"
          style={{
            background:
              'radial-gradient(circle at 20% 0%, rgba(240,90,26,0.35) 0%, transparent 55%),' +
              'radial-gradient(circle at 85% 5%, rgba(255,201,60,0.30) 0%, transparent 50%),' +
              'radial-gradient(circle at 50% 100%, rgba(26,95,212,0.45) 0%, transparent 60%),' +
              'linear-gradient(180deg, #0F1E3A 0%, #122A52 100%)',
            boxShadow: '0 30px 80px -40px rgba(15,30,58,0.6)',
          }}
        >
          {/* Confetti layer */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="sm-confetti absolute"
                style={{
                  left: c.left,
                  top: c.top,
                  width: c.size,
                  height: c.size,
                  backgroundColor: c.color,
                  borderRadius: c.shape === 'circle' ? '50%' : '2px',
                  animationDelay: c.delay,
                  boxShadow: `0 0 12px ${c.color}`,
                }}
              />
            ))}
            {/* Big pulse ring behind the badge */}
            <span
              className="sm-ring absolute"
              style={{
                left: '50%',
                top: '46px',
                width: '160px',
                height: '160px',
                marginLeft: '-80px',
                borderRadius: '50%',
                border: '2px solid rgba(255,201,60,0.55)',
              }}
            />
          </div>

          {/* Content */}
          <div className="relative text-center">
            <span
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{
                background: 'linear-gradient(90deg, #F05A1A 0%, #FFC93C 100%)',
                color: '#0F1E3A',
                boxShadow: '0 6px 24px rgba(240,90,26,0.55)',
              }}
            >
              <Sparkles size={13} fill="#0F1E3A" /> {t('softLaunchEyebrow')} <Sparkles size={13} fill="#0F1E3A" />
            </span>

            <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">
              {t('softLaunchHeadline')}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: 'rgba(255,255,255,0.78)' }}>
              {t('softLaunchBody')}
            </p>

            {/* Connector divider — visually ties banner to pricing */}
            <div className="mx-auto mt-10 h-px max-w-md" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)' }} />

            {/* Pricing intro inside the same dark frame */}
            <span className="mt-8 inline-block text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: '#93B8F5' }}>
              {t('eyebrow')}
            </span>
            <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              {t('headline1')} {t('headline2')}
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {t('subtext')}
            </p>
          </div>
        </div>

        {/* ─── Pricing Cards — overlap into the banner ───────────────── */}
        <div className="-mt-36 grid gap-6 px-1 sm:-mt-40 lg:grid-cols-2 relative">
          {tiers.map((tier, i) => {
            const v = TIER_VISUALS[i] ?? TIER_VISUALS[0]
            return (
              <div key={tier.name} className="relative flex flex-col rounded-3xl bg-white p-8 border-2"
                style={{
                  borderColor: v.highlight ? v.accent : '#E5E7EB',
                  boxShadow: v.highlight
                    ? '0 20px 50px -20px rgba(15,30,58,0.35), 0 4px 10px rgba(15,30,58,0.08)'
                    : '0 12px 30px -15px rgba(15,30,58,0.18), 0 2px 6px rgba(15,30,58,0.05)',
                }}>
                {v.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                      style={{ backgroundColor: v.accent }}>
                      <Star size={10} fill="#fff" stroke="#fff" /> {t('recommendedBadge')}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-2xl font-bold uppercase tracking-wide" style={{ color: v.accent }}>{tier.name}</h4>
                  <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-bold line-through opacity-60" style={{ color: '#9CA3AF' }}>€{v.anchor}</span>
                    <span className="text-5xl font-bold" style={{ color: '#0D0D0B' }}>€{v.monthly}</span>
                    <span className="text-sm text-gray-500">{t('priceMonth')}</span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        background: 'linear-gradient(90deg, #F05A1A 0%, #FFC93C 100%)',
                        color: '#0F1E3A',
                      }}
                    >
                      <Sparkles size={9} fill="#0F1E3A" /> Cohort 1
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {t('priceYearPre')}<strong style={{ color: '#0D0D0B' }}>€{v.yearly.toLocaleString('de-DE')}</strong>{t('priceYearMid')}{v.monthlyEffective}{t('priceYearPost')}
                  </p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: v.accentBg }}>
                        <Check size={12} style={{ color: v.accent }} strokeWidth={3} />
                      </div>
                      <span style={{ color: '#374151' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <a href="#kontakt" className="inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: v.accent }}>
                  {tier.cta} →
                </a>

                <p className="mt-3 text-center text-xs text-gray-500">
                  {v.highlight && <span style={{ color: v.accent }}>⚠ </span>}
                  {tier.note}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-8 rounded-2xl border p-6 text-center" style={{ backgroundColor: '#FFF9F5', borderColor: '#BBCFF5' }}>
          <p className="text-sm" style={{ color: '#0D0D0B' }}>
            <strong>{t('guarantee1')}</strong>{t('guarantee2')}
          </p>
        </div>
      </div>
    </section>
  )
}
