import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { MessagesSquare, ListTree, Quote, ShieldCheck } from 'lucide-react'
import { CallCheckForm } from './CallCheckForm'
import { Radar } from '@/components/call-check/Radar'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { LpRender } from '@/components/lp/LpRender'
import { localize, ensureLpI18n } from '@/lib/lp/i18n'
import { auth } from '@/lib/auth'
import { PreviewBanner } from '@/components/lp/PreviewBanner'

/**
 * Kommt die Seite aus dem Landingpage-System (Slug „gespraechs-check“,
 * veröffentlicht, mit Sektion „call_check“), wird sie von dort gerendert —
 * bearbeitbar und übersetzbar im Backend. Sonst gilt die eingebaute Fassung.
 */
async function fromLandingPages(locale: string, preview = false) {
  try {
    await ensureLpI18n()
    const rows = (await db.execute(sql`
      SELECT s.id, s.type, s.is_visible, s.content, s.content_i18n, p.accent_color, p.email_list, p.status, p.id AS page_id
      FROM landing_pages p JOIN landing_page_sections s ON s.landing_page_id = p.id
      WHERE p.slug = 'gespraechs-check' AND (p.status = 'published' OR ${preview}) AND s.is_visible
      ORDER BY s."order"`)) as unknown as { id: string; type: string; is_visible: boolean; content: Record<string, unknown>; content_i18n: Record<string, unknown>; accent_color: string | null; email_list: string | null; status: string; page_id: string }[]
    if (!rows.some((r) => r.type === 'call_check')) return null
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        {rows[0].status !== 'published' && <PreviewBanner status={rows[0].status} editHref={`/admin/landing-pages/${rows[0].page_id}`} slug="gespraechs-check" locale={locale} />}
        <LpRender theme="ef" accent={rows[0].accent_color ?? '#1A5FD4'} emailList={rows[0].email_list ?? 'framework-gespraechs-check'}
          sections={rows.map((r) => ({ id: r.id, type: r.type, isVisible: r.is_visible, content: localize(r.content, r.content_i18n, locale) }))} />
      </div>
    )
  } catch { return null }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('callCheck.meta')
  return { title: t('title'), description: t('description') }
}

export default async function CallCheckPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<{ preview?: string }> }) {
  const { locale } = await params
  const sp = (await searchParams) ?? {}
  const session = sp.preview ? await auth().catch(() => null) : null
  const preview = !!sp.preview && (session?.user?.role === 'admin' || session?.user?.role === 'coach')
  const managed = await fromLandingPages(locale, preview)
  if (managed) return managed
  const t = await getTranslations('callCheck')
  const facts = t.raw('hero.facts') as string[]
  const items = t.raw('what.items') as Array<{ title: string; body: string }>
  const icons = [MessagesSquare, ListTree, Quote]

  // A sample shape for the hero: the page shows what the result looks like
  // before anyone uploads anything.
  const sample = [
    { label: t('criteria.smart_questions'), value: 62 },
    { label: t('criteria.assumptions'), value: 48 },
    { label: t('criteria.serial_questions'), value: 35 },
    { label: t('criteria.offer'), value: null },
    { label: t('criteria.empathy'), value: 71 },
  ]

  const steps = t.raw('how.steps') as Array<{ title: string; body: string }>
  const chain = t.raw('sample.chain') as string[]
  const gen = locale === 'de' ? '/frameworks/instant-influence' : `/${locale}/frameworks/instant-influence`

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Kopf: Versprechen links, Vorschau rechts (Report + Netzdiagramm) */}
      <section className="relative overflow-hidden bg-[#0E1733] px-6 pb-44 pt-20 text-white">
        <div className="pointer-events-none absolute -right-48 -top-48 h-[640px] w-[640px] rounded-full opacity-40" style={{ background: 'radial-gradient(circle, #1A5FD4 0%, transparent 62%)' }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.16em] text-[#6FA3FF]">{t('hero.badge')}</span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.06] tracking-[-.03em] sm:text-[52px]">{t('hero.headline')}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#C9D8F5]">{t('hero.subline')}</p>
            <ul className="mt-8 flex flex-col gap-2.5 text-[15px] text-white/85">
              {facts.map((f) => (
                <li key={f} className="flex items-center gap-3"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563FF] text-[11px] font-bold">✓</span>{f}</li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-[560px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mystery/report-mockup.jpg" alt="" className="aspect-[4/3] w-full rounded-[28px] object-cover shadow-[0_40px_80px_-40px_rgba(0,0,0,.7)]" />
            <div className="absolute -bottom-10 -left-6 w-[230px] rounded-[22px] border border-white/10 bg-[#14203F]/95 p-3 shadow-2xl backdrop-blur sm:-left-10 sm:w-[260px]">
              <Radar axes={sample} notAssessed={t('result.notAssessed')} theme="dark" />
            </div>
          </div>
        </div>
      </section>

      {/* Formular */}
      <section id="check" className="relative -mt-28 px-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_30px_70px_-30px_rgba(14,23,51,.35)] sm:p-10">
          <CallCheckForm />
          <p className="mt-6 flex items-start gap-2 text-xs text-gray-500">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#1A5FD4]" /> {t('privacy')}
          </p>
        </div>
      </section>

      {/* So funktioniert es */}
      <section className="px-6 pt-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold tracking-[-.02em] text-[#0D0D0B] sm:text-4xl">{t('how.headline')}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((st, i) => (
              <div key={st.title} className="relative">
                <span className="text-[56px] font-bold leading-none tracking-[-.04em] text-[#1A5FD4]">{i + 1}</span>
                <h3 className="mt-4 text-xl font-bold text-[#0D0D0B]">{st.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{st.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Was Du bekommst, jeweils mit einer kleinen Vorschau */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold tracking-[-.02em] text-[#0D0D0B] sm:text-4xl">{t('what.headline')}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {items.map((it, i) => {
              const Icon = icons[i] ?? Quote
              return (
                <div key={it.title} className="flex flex-col rounded-[24px] bg-white p-7 shadow-[0_1px_2px_rgba(14,23,51,.05),0_18px_40px_-18px_rgba(14,23,51,.18)]">
                  <div className="flex min-h-[132px] flex-col justify-center rounded-2xl bg-[#F4F6FA] p-4">
                    {i === 0 && sample.map((a) => (
                      <div key={a.label} className="flex items-center gap-2 py-[3px] text-[11px] text-gray-600">
                        <span className="w-[42%] truncate">{a.label}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white"><span className="block h-full rounded-full bg-[#1A5FD4]" style={{ width: `${a.value ?? 0}%`, opacity: a.value === null ? 0 : 1 }} /></span>
                      </div>
                    ))}
                    {i === 1 && (
                      <div className="flex flex-wrap gap-1.5">
                        {chain.map((c, n) => (
                          <span key={c} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${n === 3 ? 'bg-[#FDEAE8] text-[#B52217]' : 'bg-white text-[#124293]'}`}>{c}</span>
                        ))}
                        <span className="mt-1 w-full text-[11px] font-semibold text-[#B52217]">↑ {t('sample.broken')}</span>
                      </div>
                    )}
                    {i === 2 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#1A5FD4]">{t('sample.sentenceLabel')}</span>
                        <p className="mt-1.5 text-[15px] font-semibold leading-snug text-[#0D0D0B]">{t('sample.sentence')}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EBF1FF] text-[#1A5FD4]"><Icon size={18} /></span><h3 className="text-lg font-bold text-[#0D0D0B]">{it.title}</h3></div>
                  <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{it.body}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-12 text-center"><a href="#check" className="inline-flex items-center gap-2 rounded-full bg-[#1A5FD4] px-7 py-4 text-[15px] font-bold text-white no-underline">{t('again')} →</a></div>
        </div>
      </section>

      {/* Passendes Framework */}
      <section className="px-6 pb-24">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 rounded-[28px] bg-[#0E1733] p-8 text-white sm:p-12">
          <div className="min-w-0 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[.16em] text-[#6FA3FF]">{t('related.eyebrow')}</span>
            <h2 className="mt-3 text-2xl font-bold tracking-[-.02em] sm:text-3xl">{t('related.headline')}</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[#C9D8F5]">{t('related.body')}</p>
          </div>
          <a href={gen} className="inline-flex flex-none items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-bold text-[#0E1733] no-underline">{t('related.cta')} →</a>
        </div>
      </section>
    </div>
  )
}
