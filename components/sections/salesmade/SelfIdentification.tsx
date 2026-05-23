import { getTranslations } from 'next-intl/server'
import { AlertTriangle, TrendingDown, MessageSquare, Crown, Hourglass, Target, BookOpen, Trophy } from 'lucide-react'

const ICONS = [AlertTriangle, MessageSquare, TrendingDown, Crown, Hourglass, Target, BookOpen, Trophy] as const

interface Trigger { headline: string; body: string }

export async function SelfIdentification() {
  const t = await getTranslations('salesmadePage.selfId')
  // Pull the 8 trigger statements from i18n
  const triggers: Trigger[] = ((t.raw('triggers') as Trigger[]) ?? []).slice(0, 8)

  if (triggers.length === 0) return null

  return (
    <section className="border-t border-gray-100 px-6 py-24" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            {t('eyebrow')}
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('headline')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600">
            {t('subtext')}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {triggers.map((trigger, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <article
                key={i}
                className="group rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
                >
                  <Icon size={16} />
                </div>
                <h3 className="mt-3 text-base font-bold leading-snug" style={{ color: '#0D0D0B' }}>
                  {trigger.headline}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  {trigger.body}
                </p>
              </article>
            )
          })}
        </div>

        <div className="mx-auto mt-12 max-w-xl rounded-2xl px-6 py-5 text-center"
          style={{ backgroundColor: '#0F1E3A' }}>
          <p className="text-sm leading-relaxed text-white">
            <span className="font-bold" style={{ color: '#5DDBF5' }}>{t('verdictAccent')}</span>{' '}
            {t('verdictRest')}
          </p>
        </div>

        {/* Scorecard CTA */}
        <div className="mx-auto mt-6 max-w-xl text-center">
          <a
            href="/salesmade/scorecard"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold transition-colors hover:bg-gray-50"
            style={{ color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            {t('scorecardCta')} →
          </a>
        </div>
      </div>
    </section>
  )
}
