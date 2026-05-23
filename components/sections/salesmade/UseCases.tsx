import { getTranslations } from 'next-intl/server'
import { User, Users, TrendingUp, ArrowRight } from 'lucide-react'

const ICONS = [User, Users, TrendingUp] as const

interface UseCase {
  eyebrow: string
  title: string
  body: string
  outcome: string
  cta: string
}

export async function UseCases() {
  const t = await getTranslations('salesmadePage.useCases')
  const cases: UseCase[] = ((t.raw('items') as UseCase[]) ?? []).slice(0, 3)
  if (!cases.length) return null

  return (
    <section className="border-t border-gray-100 px-6 py-24" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}>
            {t('eyebrow')}
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('headline')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600">
            {t('subtext')}
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cases.map((uc, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <article key={i} className="group flex flex-col rounded-2xl border bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: '#E5E7EB' }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>
                  <Icon size={20} />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#1A5FD4' }}>
                  {uc.eyebrow}
                </p>
                <h3 className="mt-2 text-xl font-bold leading-tight" style={{ color: '#0D0D0B' }}>
                  {uc.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {uc.body}
                </p>
                <div className="mt-5 rounded-xl px-4 py-3" style={{ backgroundColor: '#F3F4F6' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {t('outcomeLabel')}
                  </p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: '#0F1E3A' }}>
                    {uc.outcome}
                  </p>
                </div>
                <a href="/kontakt"
                  className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold transition-colors group-hover:translate-x-0.5"
                  style={{ color: '#1A5FD4' }}>
                  {uc.cta} <ArrowRight size={14} />
                </a>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
