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

export function SalesPricing() {
  const t = useTranslations('salesmadeExt.pricing')
  const tiers = (t.raw('tiers') as TierData[]) ?? []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        {/* ─── Soft Launch Feuerwerk Banner ─────────────────────────── */}
        <div className="mb-10">
          <div
            className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-[2px]"
            style={{
              background: 'linear-gradient(135deg, #1A5FD4 0%, #6B5CE7 35%, #F05A1A 70%, #FFC93C 100%)',
              boxShadow: '0 20px 60px -20px rgba(26,95,212,0.45), 0 8px 20px -10px rgba(240,90,26,0.35)',
            }}
          >
            <div className="relative rounded-[22px] px-6 py-7 sm:px-10 sm:py-8" style={{ backgroundColor: '#0F1E3A' }}>
              {/* Confetti dots — pure CSS */}
              <span aria-hidden className="pointer-events-none absolute left-4 top-3 text-yellow-300 opacity-80 animate-pulse">
                <Sparkles size={18} />
              </span>
              <span aria-hidden className="pointer-events-none absolute right-4 top-3 text-orange-300 opacity-80 animate-pulse" style={{ animationDelay: '0.4s' }}>
                <Sparkles size={18} />
              </span>
              <span aria-hidden className="pointer-events-none absolute left-8 bottom-3 text-blue-300 opacity-70 animate-pulse" style={{ animationDelay: '0.8s' }}>
                <Sparkles size={14} />
              </span>
              <span aria-hidden className="pointer-events-none absolute right-8 bottom-3 text-pink-300 opacity-70 animate-pulse" style={{ animationDelay: '1.2s' }}>
                <Sparkles size={14} />
              </span>

              <div className="relative text-center">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
                  style={{
                    background: 'linear-gradient(90deg, #F05A1A 0%, #FFC93C 100%)',
                    color: '#0F1E3A',
                    boxShadow: '0 4px 16px rgba(240,90,26,0.5)',
                  }}
                >
                  <Sparkles size={12} fill="#0F1E3A" /> {t('softLaunchEyebrow')} <Sparkles size={12} fill="#0F1E3A" />
                </span>
                <h3 className="mt-4 text-xl font-bold text-white sm:text-2xl">
                  {t('softLaunchHeadline')}
                </h3>
                <p className="mt-3 mx-auto max-w-xl text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  {t('softLaunchBody')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-14 text-center">
          <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}>
            {t('eyebrow')}
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('headline1')}<br className="hidden sm:block" /> {t('headline2')}
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            {t('subtext')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {tiers.map((tier, i) => {
            const v = TIER_VISUALS[i] ?? TIER_VISUALS[0]
            return (
              <div key={tier.name} className="relative flex flex-col rounded-3xl bg-white p-8 border-2"
                style={{
                  borderColor: v.highlight ? v.accent : '#E5E7EB',
                  boxShadow: v.highlight
                    ? '0 10px 30px rgba(15,30,58,0.08), 0 2px 6px rgba(15,30,58,0.05)'
                    : '0 1px 2px rgba(15,30,58,0.04)',
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
                  <h3 className="text-2xl font-bold uppercase tracking-wide" style={{ color: v.accent }}>{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-bold line-through opacity-60" style={{ color: '#9CA3AF' }}>€{v.anchor}</span>
                    <span className="text-5xl font-bold" style={{ color: '#0D0D0B' }}>€{v.monthly}</span>
                    <span className="text-sm text-gray-500">{t('priceMonth')}</span>
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: v.accentBg, color: v.accent }}>
                      Cohort 1
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
