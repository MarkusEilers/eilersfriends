'use client'

import { useTranslations } from 'next-intl'
import { Lightbulb, Target, Zap } from 'lucide-react'

interface Level { title: string; subtitle: string; intro: string; points: string[] }

const LEVEL_VISUALS = [
  { icon: Lightbulb, accent: '#1A5FD4', accentBg: '#EBF1FF' },
  { icon: Target, accent: '#0F1E3A', accentBg: '#E5E9F0' },
  { icon: Zap, accent: '#EB0028', accentBg: '#FFEBEC' },
]

export function MethodologyTriptych() {
  const t = useTranslations('salesmadeExt.triptych')
  const levels = (t.raw('levels') as Level[]) ?? []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
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

        <div className="grid gap-6 lg:grid-cols-3">
          {levels.map((L, i) => {
            const v = LEVEL_VISUALS[i] ?? LEVEL_VISUALS[0]
            const Icon = v.icon
            return (
              <div key={L.title} className="rounded-3xl bg-white p-7 border" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start gap-3 mb-5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: v.accentBg, color: v.accent }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold" style={{ color: v.accent }}>
                      {t('levelLabel')} {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: '#0D0D0B' }}>{L.title}</div>
                    <div className="text-xs" style={{ color: v.accent }}>{L.subtitle}</div>
                  </div>
                </div>

                <p className="mb-5 text-sm leading-relaxed text-gray-600">{L.intro}</p>

                <ul className="space-y-2.5">
                  {L.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm" style={{ color: '#374151' }}>
                      <span className="mt-2 flex h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: v.accent }} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
