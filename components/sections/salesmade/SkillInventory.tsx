'use client'

import { useTranslations } from 'next-intl'
import { Compass, Eye, MessageSquare, Handshake, Magnet } from 'lucide-react'

interface Skill { name: string; tagline: string }
interface Discipline { name: string; description: string; skills: Skill[] }

const DISCIPLINE_ICONS = [Magnet, Compass, Eye, MessageSquare, Handshake]
const ACCENT = '#1A5FD4'
const ACCENT_LIGHT = '#EBF1FF'

export function SkillInventory() {
  const t = useTranslations('salesmadeExt.skillInventory')
  const disciplines = (t.raw('disciplines') as Discipline[]) ?? []
  const totalSkills = disciplines.reduce((sum, d) => sum + d.skills.length, 0)

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT, border: '1px solid #BBCFF5' }}>
            {t('eyebrowPre')}{totalSkills}{t('eyebrowPost')}
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('headline')}
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            {t('subtextPre')}{totalSkills}{t('subtextPost')}
          </p>
        </div>

        <div className="space-y-10">
          {disciplines.map((d, i) => {
            const Icon = DISCIPLINE_ICONS[i] ?? Compass
            return (
              <div key={d.name}>
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs font-mono font-bold" style={{ color: ACCENT }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-xl font-bold sm:text-2xl" style={{ color: '#0D0D0B' }}>{d.name}</h3>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600">{d.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {d.skills.map((s) => (
                    <div key={s.name} className="rounded-2xl bg-white p-5 border transition-all hover:-translate-y-0.5"
                      style={{ borderColor: '#E5E7EB' }}>
                      <h4 className="text-sm font-bold leading-snug" style={{ color: '#0D0D0B' }}>{s.name}</h4>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">{s.tagline}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {t('footer1')}<strong style={{ color: '#0D0D0B' }}>{t('footer2')}</strong>{t('footer3')}
          </p>
        </div>
      </div>
    </section>
  )
}
