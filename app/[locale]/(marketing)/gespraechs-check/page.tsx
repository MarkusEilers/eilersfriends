import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { MessagesSquare, ListTree, Quote, ShieldCheck } from 'lucide-react'
import { CallCheckForm } from './CallCheckForm'
import { Radar } from '@/components/call-check/Radar'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('callCheck.meta')
  return { title: t('title'), description: t('description') }
}

export default async function CallCheckPage({ params }: { params: Promise<{ locale: string }> }) {
  await params
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

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <section className="relative overflow-hidden bg-[#0F1E3A] px-6 pb-40 pt-20 text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #1A5FD4 0%, transparent 65%)' }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#5DDBF5]">
              {t('hero.badge')}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">{t('hero.headline')}</h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">{t('hero.subline')}</p>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {facts.map((f) => (
                <li key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#FFD37A]" />{f}</li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[380px] rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
            <Radar axes={sample} notAssessed={t('result.notAssessed')} />
          </div>
        </div>
      </section>

      <section className="relative -mt-28 px-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gray-100 bg-white p-6 shadow-xl shadow-[#0F1E3A]/10 sm:p-10">
          <CallCheckForm />
          <p className="mt-6 flex items-start gap-2 text-xs text-gray-500">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#1A5FD4]" /> {t('privacy')}
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">{t('what.headline')}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {items.map((it, i) => {
              const Icon = icons[i] ?? Quote
              return (
                <div key={it.title} className="rounded-3xl border border-gray-100 bg-white p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EBF1FF] text-[#1A5FD4]"><Icon size={20} /></div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">{it.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{it.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
