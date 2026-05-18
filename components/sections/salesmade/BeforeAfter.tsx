/**
 * Vorher / Nachher — Pair-Cards.
 *
 * Jede Zeile = EINE klare Transformation auf einer Karte. Links rot (Pain),
 * Pfeil in der Mitte, rechts blau (Outcome). Keine separaten Schriftgrößen
 * für "Hero-Metriken" — die Metrik (z.B. 28 → 73 %) wird als kleiner Chip
 * in einer Eckecke der Karte gezeigt, damit die Hierarchie konsistent bleibt.
 */
'use client'

import { useTranslations } from 'next-intl'
import { ArrowRight, X, Check } from 'lucide-react'

interface Row {
  before: string
  after: string
  metricLabel?: string
  beforeValue?: string
  afterValue?: string
}

const RED = '#EB0028'
const BLUE = '#1A5FD4'
const NAVY = '#0F1E3A'

export function BeforeAfter() {
  const t = useTranslations('salesmadeExt.beforeAfter')
  const rows = (t.raw('rows') as Row[]) ?? []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: BLUE, border: `1px solid #BBCFF5` }}
          >
            {t('eyebrow')}
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('headline1')}
            <br className="hidden sm:block" /> {t('headline2')}
          </h2>
        </div>

        {/* Column header labels (visible on desktop only) */}
        <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-0 items-center mb-4 px-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: RED, color: '#fff' }}>
              <X size={12} strokeWidth={3} />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: RED }}>{t('beforeLabel')}</span>
          </div>
          <div aria-hidden className="w-10" />
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: BLUE, color: '#fff' }}>
              <Check size={12} strokeWidth={3} />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BLUE }}>{t('afterLabel')}</span>
          </div>
        </div>

        {/* Pair rows — one consistent design, no metric jumbo */}
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 items-stretch overflow-hidden rounded-2xl"
              style={{
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
              }}
            >
              {/* Before */}
              <div
                className="p-5 sm:p-6 flex items-start gap-3"
                style={{ backgroundColor: '#FFF4F5' }}
              >
                <X size={16} className="mt-1 flex-shrink-0" style={{ color: RED }} strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed" style={{ color: NAVY }}>{r.before}</p>
                  {r.beforeValue && (
                    <span
                      className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold"
                      style={{ backgroundColor: '#FFE2E5', color: RED }}
                    >
                      {r.beforeValue}{r.metricLabel ? ' · ' + r.metricLabel : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow column (desktop) / horizontal divider (mobile) */}
              <div
                className="hidden md:flex items-center justify-center px-2"
                aria-hidden="true"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
                  style={{ border: '1px solid #E5E7EB', color: NAVY }}
                >
                  <ArrowRight size={14} />
                </span>
              </div>
              <div
                className="md:hidden h-px"
                aria-hidden="true"
                style={{ background: `linear-gradient(90deg, ${RED}30 0%, ${NAVY} 50%, ${BLUE}30 100%)` }}
              />

              {/* After */}
              <div
                className="p-5 sm:p-6 flex items-start gap-3"
                style={{ backgroundColor: '#F4F7FE' }}
              >
                <Check size={16} className="mt-1 flex-shrink-0" style={{ color: BLUE }} strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed" style={{ color: NAVY }}>{r.after}</p>
                  {r.afterValue && (
                    <span
                      className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold"
                      style={{ backgroundColor: '#DDE7FB', color: BLUE }}
                    >
                      {r.afterValue}{r.metricLabel ? ' · ' + r.metricLabel : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
