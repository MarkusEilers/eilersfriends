import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, MessageCircleQuestion, Target } from 'lucide-react'
import { getCheck } from '@/lib/call-check/store'
import type { CheckResult } from '@/lib/call-check/analyze'
import type { CallMetrics } from '@/lib/call-check/transcript'
import { SKILL_LINK } from '@/lib/call-check/rubric'
import { Radar } from '@/components/call-check/Radar'
import { SkillMap } from '@/components/call-check/SkillMap'
import { AutoRefresh } from './AutoRefresh'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('callCheck.meta')
  // Result pages are personal: keep them out of search engines.
  return { title: t('title'), robots: { index: false, follow: false } }
}

const CATEGORY_STYLE: Record<string, string> = {
  'P/G': 'bg-[#FFEBEC] text-[#B3001F] border-[#F5BBBC]',
  E: 'bg-[#EBF1FF] text-[#1A5FD4] border-[#BBCFF5]',
  I: 'bg-[#FFF8E6] text-[#8A5F00] border-[#F2D79A]',
  H: 'bg-[#F0EEFF] text-[#5A4BD6] border-[#D6D0FA]',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default async function CallCheckResultPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const t = await getTranslations('callCheck')
  const check = await getCheck(id)

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#FAFAF8] px-6 py-24"><div className="mx-auto max-w-2xl text-center text-gray-700">{children}</div></div>
  )
  if (!check) return shell(<p>{t('result.notFound')}</p>)
  if (check.status === 'running') return shell(<><AutoRefresh /><p>{t('result.running')}</p></>)
  if (check.status !== 'done' || !check.result) {
    return shell(<><p>{t('result.failed')}</p>
      <Link href={`/${locale}/gespraechs-check`} className="mt-6 inline-block font-semibold text-[#1A5FD4]">{t('result.again')}</Link></>)
  }

  const r = check.result as CheckResult
  const m = (check.metrics ?? {}) as CallMetrics
  const openQ = r.questions.filter((q) => q.open).length
  const cat = (q: { open: boolean; category: string | null }) => (q.open && q.category ? q.category : 'closed')

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Head: the shape of the call */}
      <section className="bg-[#0F1E3A] px-6 pb-32 pt-16 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#5DDBF5]">
              {t('result.badge')}
            </span>
            <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
              {check.first_name ? t('result.hello', { name: check.first_name }) : t('result.helloAnon')}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/75">{r.summary}</p>

            <dl className="mt-8 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { k: t('result.metrics.share'), v: m.sellerShare != null ? `${m.sellerShare} %` : '—' },
                { k: t('result.metrics.questions'), v: String(r.questions.length) },
                { k: t('result.metrics.open'), v: r.questions.length ? `${Math.round((openQ / r.questions.length) * 100)} %` : '—' },
                { k: t('result.metrics.monologue'), v: m.sellerTurns ? t('result.metrics.words', { n: m.longestSellerMonologue }) : '—' },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">{x.k}</dt>
                  <dd className="mt-1 text-2xl font-bold text-[#FFD37A]">{x.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mx-auto w-full max-w-[400px] rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
            <Radar notAssessed={t('result.notAssessed')}
              axes={r.criteria.map((c) => ({ label: t(`criteria.${c.key}`), value: c.score }))} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-14">
        {/* The answer to the question the page asked: where did it tip? */}
        {r.turning_point ? (
          <section className="-mt-32 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-xl shadow-[#0F1E3A]/10 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#EB0028]">{t('result.turningTitle')}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-[#FAFAF8] p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('result.customerSaid')}</p>
                <p className="mt-2 text-lg font-medium text-gray-900">„{r.turning_point.customer_quote}"</p>
              </div>
              <div className="rounded-2xl border border-[#F5BBBC] bg-[#FFEBEC] p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#B3001F]">{t('result.youSaid')}</p>
                <p className="mt-2 text-lg font-medium text-gray-900">„{r.turning_point.seller_reaction}"</p>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-base text-gray-700">{r.turning_point.effect}</p>
            <div className="mt-5 rounded-2xl bg-[#0F1E3A] p-5 text-white">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5DDBF5]">{t('result.better')}</p>
              <p className="mt-1 text-lg font-medium">„{r.turning_point.better}"</p>
            </div>
          </section>
        ) : null}

        {/* The three sentences — what to take away first */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900">{t('result.tipsTitle')}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {r.tips.map((tip, i) => (
              <article key={i} className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6">
                <span className="text-4xl font-black text-[#EBF1FF]">{i + 1}</span>
                <h3 className="mt-1 text-lg font-bold text-gray-900">{tip.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{tip.why}</p>
                {tip.quote ? <blockquote className="mt-3 border-l-2 border-gray-200 pl-3 text-sm italic text-gray-500">„{tip.quote}"</blockquote> : null}
                <div className="mt-auto pt-5">
                  <div className="rounded-2xl bg-[#0F1E3A] p-4 text-white">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#5DDBF5]">{t('result.tipSay')}</p>
                    <p className="mt-1 text-sm font-medium">„{tip.try_next}"</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Five criteria in detail */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900">{t('result.criteriaTitle')}</h2>
          <ul className="mt-6 divide-y divide-gray-100">
            {r.criteria.map((c) => (
              <li key={c.key} className="grid gap-3 py-5 sm:grid-cols-[220px_1fr]">
                <div>
                  <p className="font-bold text-gray-900">{t(`criteria.${c.key}`)}</p>
                  <p className={c.score == null ? 'mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400' : 'mt-1 text-2xl font-bold text-[#1A5FD4]'}>
                    {c.score == null ? t('result.notAssessed') : c.score}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">{c.finding}</p>
                  {c.evidence.map((q, i) => (
                    <blockquote key={i} className="mt-2 border-l-2 border-[#BBCFF5] pl-3 text-sm italic text-gray-500">„{q}"</blockquote>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Question chain */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <MessageCircleQuestion className="text-[#1A5FD4]" size={22} />
            <h2 className="text-2xl font-bold text-gray-900">{t('result.questionsTitle')}</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">{t('result.questionsHint')}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(['P/G', 'E', 'I', 'H', 'closed'] as const).map((k) => (
              <span key={k} className={`rounded-full border px-3 py-1 text-xs font-semibold ${CATEGORY_STYLE[k]}`}>
                {t(`result.category.${k}`)} · {r.questions.filter((q) => cat(q) === k).length}
              </span>
            ))}
          </div>
          <ol className="mt-6 flex flex-wrap gap-1.5">
            {r.questions.map((q, i) => (
              <li key={i} title={q.text}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-bold ${CATEGORY_STYLE[cat(q)]}`}>
                {i + 1}
              </li>
            ))}
          </ol>
          <details className="mt-5 text-sm">
            <summary className="cursor-pointer font-semibold text-[#1A5FD4]">{r.questions.length} ▸</summary>
            <ol className="mt-3 space-y-2">
              {r.questions.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-0.5 shrink-0 rounded-md border px-1.5 text-[11px] font-bold ${CATEGORY_STYLE[cat(q)]}`}>{i + 1}</span>
                  <span className="text-gray-700">{q.text}</span>
                </li>
              ))}
            </ol>
          </details>
        </section>

        {/* Protocol + objections */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('result.protocolTitle')}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {(['pain_gain', 'evidence', 'impact'] as const).map((k) => (
                <div key={k}>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t(`result.protocol.${k}`)}</p>
                  <ul className="mt-2 space-y-2">
                    {r.protocol[k].length ? r.protocol[k].map((x, i) => (
                      <li key={i} className="rounded-xl bg-[#FAFAF8] p-3 text-sm text-gray-700">{x}</li>
                    )) : <li className="text-sm text-gray-400">{t('result.protocolEmpty')}</li>}
                  </ul>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">{t('result.objectionsTitle')}</h2>
            {r.objections.length ? (
              <ul className="mt-5 space-y-3">
                {r.objections.map((o, i) => (
                  <li key={i} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-800">„{o.objection}"</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        o.status === 'addressed' ? 'bg-emerald-50 text-emerald-700'
                          : o.status === 'partially_addressed' ? 'bg-amber-50 text-amber-700' : 'bg-[#FFEBEC] text-[#B3001F]'}`}>
                        {t(`result.status.${o.status}`)}
                      </span>
                    </div>
                    {o.response ? <p className="mt-2 text-xs text-gray-500">{o.response}</p> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-5 text-sm text-gray-400">{t('result.objectionsEmpty')}</p>}
          </section>
        </div>

        {/* Skill map — draft */}
        <SkillMap skills={r.skills} dimensions={r.dimensions}
          labels={{
            title: t('result.skillmapTitle'), draft: t('result.draft'), hint: t('result.skillmapHint'),
            notMeasured: t('result.notMeasured'), dimensionNotMeasured: t('result.dimensionNotMeasured'),
            measuredOf: (n, total) => t('result.measuredOf', { n, total }),
            legend: t.raw('result.gradeLegend') as string[],
            dimension: (k) => t(`dimensions.${k}`), skill: (k) => t(`skills.${k}`),
          }} />

        {/* Learning + next step */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#BBCFF5] bg-[#EBF1FF] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Target className="text-[#1A5FD4]" size={22} />
              <h2 className="text-xl font-bold text-gray-900">{t('result.learningTitle')}</h2>
            </div>
            <p className="mt-4 text-lg font-bold text-[#1A5FD4]">{t(`skills.${r.learning.skill}`)}</p>
            <p className="mt-2 text-sm text-gray-700">{r.learning.reason}</p>
            <Link href={`/${locale}${SKILL_LINK[r.learning.skill] ?? '/salesmade'}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1A5FD4]">
              {t('result.learningCta')} <ArrowRight size={16} />
            </Link>
          </section>
          <section className="rounded-3xl bg-[#0F1E3A] p-6 text-white sm:p-8">
            <h2 className="text-xl font-bold">{t('result.ctaTitle')}</h2>
            <p className="mt-3 text-sm text-white/75">{t('result.ctaBody')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/${locale}/checkout/mystery-shopping`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FFD37A] px-5 py-3 text-sm font-bold text-[#0F1E3A]">
                {t('result.ctaButton')} <ArrowRight size={16} />
              </Link>
              <Link href={`/${locale}/gespraechs-check`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white">
                {t('result.again')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
