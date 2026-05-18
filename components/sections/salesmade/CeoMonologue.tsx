'use client'

import { useTranslations } from 'next-intl'
import { Flag } from 'lucide-react'

export function CeoMonologue() {
  const t = useTranslations('salesmadeExt.ceoMonologue')
  const pains = (t.raw('pains') as string[]) ?? []

  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 rounded-3xl p-10 text-center" style={{ backgroundColor: '#0F1E3A' }}>
          <div className="mx-auto max-w-3xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#93B8F5' }}>
              {t('eyebrow')}
            </span>
            <p className="mt-5 font-serif text-2xl leading-relaxed text-white sm:text-3xl" style={{ fontFamily: '"DM Serif Display", serif' }}>
              {t('quote1')}
              <br className="hidden sm:block" />
              {t('quote2')}{' '}
              <span style={{ color: '#93B8F5' }}>{t('quoteAccent')}</span>
            </p>
            <div className="mt-6 text-xs uppercase tracking-widest" style={{ color: '#93B8F5' }}>
              {t('note')}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {pains.map((p, i) => (
            <div key={i} className="flex gap-4 rounded-2xl bg-white p-5 border" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#FFEBEC', color: '#EB0028' }}>
                <Flag size={16} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
