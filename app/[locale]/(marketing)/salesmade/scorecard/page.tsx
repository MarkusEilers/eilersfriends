import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ScorecardClient } from './ScorecardClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('scorecard.meta')
  return { title: t('title'), description: t('description') }
}

export default async function ScorecardPage() {
  const t = await getTranslations('scorecard')
  const questions = (t.raw('questions') as string[]) ?? []
  const tiers = (t.raw('tiers') as Array<{ from: number; label: string; body: string; cta: string }>) ?? []
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <section className="border-b border-gray-100 px-6 py-16" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: '#1A5FD4', border: '1px solid #BBCFF5' }}>
            {t('eyebrow')}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: '#0D0D0B' }}>
            {t('headline')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-700">
            {t('subtext')}
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-3xl">
          <ScorecardClient
            questions={questions}
            tiers={tiers}
            labels={{
              scaleLow: t('scaleLow'),
              scaleHigh: t('scaleHigh'),
              progress: t('progress'),
              submit: t('submit'),
              yourScore: t('yourScore'),
              maxScore: t('maxScore'),
              startOver: t('startOver'),
              wantReport: t('wantReport'),
              wantReportBody: t('wantReportBody'),
              emailLabel: t('emailLabel'),
              firstNameLabel: t('firstNameLabel'),
              sendReport: t('sendReport'),
              reportSent: t('reportSent'),
            }}
          />
        </div>
      </section>
    </div>
  )
}
