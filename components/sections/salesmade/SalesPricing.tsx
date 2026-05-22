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

        {/* ─── INTEGRATED Soft-Launch + Pricing Frame ────────────────────
            Dark frame wraps the WHOLE pricing block — banner header on
            top, pricing cards sit inside the frame on a soft inner sheet.
        */}
        <div
          className="relative overflow-hidden rounded-[32px] p-6 sm:p-10"
          style={{
            backgroundColor: '#0F1E3A',
            backgroundImage: "url('/salesmade/firework-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            boxShadow: '0 40px 100px -40px rgba(15,30,58,0.55), 0 8px 24px -12px rgba(15,30,58,0.4)',
          }}
        >
          {/* Subtle vignette overlay to keep readability where the cards land */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 95%, rgba(15,30,58,0.35) 0%, transparent 55%),' +
                'linear-gradient(180deg, transparent 0%, transparent 35%, rgba(15,30,58,0.20) 100%)',
            }}
          />

          {/* Banner Headline */}
          <div className="relative text-center pt-4 sm:pt-6">
            <span
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{
                background: 'linear-gradient(90deg, #F05A1A 0%, #FFC93C 100%)',
                color: '#0F1E3A',
                boxShadow: '0 6px 32px rgba(240,90,26,0.55), 0 0 0 4px rgba(255,201,60,0.12)',
              }}
            >
              <Sparkles size={13} fill="#0F1E3A" /> {t('softLaunchEyebrow')} <Sparkles size={13} fill="#0F1E3A" />
            </span>

            <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">
              {t('softLaunchHeadline')}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: 'rgba(255,255,255,0.82)' }}>
              {t('softLaunchBody')}
            </p>

            {/* Divider — pearl of light fading out */}
            <div className="mx-auto mt-10 h-px max-w-md" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,201,60,0.45) 50%, transparent 100%)' }} />

            <span className="mt-8 inline-block text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: '#FFC93C' }}>
              {t('eyebrow')}
            </span>
            <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              {t('headline1')} {t('headline2')}
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('subtext')}
            </p>
          </div>

          {/* Pricing Cards — inside the dark frame */}
          <div className="relative mt-12 grid gap-6 lg:grid-cols-2">
            {tiers.map((tier, i) => {
              const v = TIER_VISUALS[i] ?? TIER_VISUALS[0]
              return (
                <div key={tier.name} className="relative flex flex-col rounded-3xl bg-white p-8 border"
                  style={{
                    borderColor: v.highlight ? 'rgba(255,201,60,0.6)' : 'rgba(255,255,255,0.5)',
                    boxShadow: v.highlight
                      ? '0 30px 60px -20px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,201,60,0.35) inset'
                      : '0 20px 40px -15px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.12)',
                  }}>
                  {v.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                        style={{ backgroundColor: v.accent, boxShadow: '0 4px 12px rgba(15,30,58,0.5)' }}>
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
                          boxShadow: '0 2px 8px rgba(240,90,26,0.35)',
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

          {/* Guarantee bar — inside the same dark frame, ties everything together */}
          <div className="relative mt-8 rounded-2xl p-5 text-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,201,60,0.25)',
              backdropFilter: 'blur(8px)',
            }}>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.92)' }}>
              <strong style={{ color: '#FFC93C' }}>{t('guarantee1')}</strong>
              <span style={{ color: 'rgba(255,255,255,0.78)' }}>{t('guarantee2')}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
