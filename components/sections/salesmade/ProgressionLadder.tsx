'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

interface Tier { title: string; duration: string; requirements: string[]; unlocks: string[] }

const TIER_VISUALS = [
  { rank: 'I', pin: '#D1D5DB', pinBg: '#F3F4F6' },
  { rank: 'II', pin: '#93B8F5', pinBg: '#EBF1FF' },
  { rank: 'III', pin: '#1A5FD4', pinBg: '#EBF1FF' },
  { rank: 'IV', pin: '#0F1E3A', pinBg: '#E5E9F0' },
  { rank: 'V', pin: '#C8A67A', pinBg: '#FAF4E8' },
  { rank: 'VI', pin: '#EB0028', pinBg: '#FFEBEC' },
]

export function ProgressionLadder() {
  const t = useTranslations('salesmadeExt.progressionLadder')
  const tiers = (t.raw('tiers') as Tier[]) ?? []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}>
            {t('eyebrow')}
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>{t('headline')}</h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            {t('subtext1')}<strong style={{ color: '#0D0D0B' }}>{t('subtext2')}</strong>{t('subtext3')}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {tiers.map((tier, i) => {
            const v = TIER_VISUALS[i] ?? TIER_VISUALS[0]
            return (
              <div key={tier.title} className="relative rounded-2xl border bg-white p-6 transition-all" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-gray-400">
                        {t('tierLabel')} {v.rank}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{tier.duration}</span>
                    </div>
                    <h3 className="mt-1 text-2xl font-bold" style={{ color: '#0D0D0B' }}>{tier.title}</h3>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: v.pinBg }} aria-hidden="true">
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: v.pin, boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.10)' }} />
                  </div>
                </div>

                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">{t('requirementsLabel')}</p>
                  <ul className="space-y-1.5">
                    {tier.requirements.map((r) => (
                      <li key={r} className="flex gap-2 text-sm text-gray-700">
                        <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: v.pin }} />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">{t('unlocksLabel')}</p>
                  <div className="flex flex-wrap gap-2">
                    {tier.unlocks.map((u) => (
                      <span key={u} className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ backgroundColor: v.pinBg, color: v.pin }}>
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 text-center text-sm text-gray-500">{t('footer')}</div>
      </div>
    </section>
  )
}
