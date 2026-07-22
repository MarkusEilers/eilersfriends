import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { Sparkles, GraduationCap, Rocket, BookOpen, ArrowRight } from 'lucide-react'

/** Promo-/„Ads"-Block auf der Startseite — eigene Services/Aktionen + Quiz-Teaser. */
export async function PromoSection() {
  const t = await getTranslations('promo')
  const cards = [
    { key: 'academy', href: '/salesmade', icon: GraduationCap },
    { key: 'jumpstart', href: '/kontakt', icon: Rocket },
    { key: 'frameworks', href: '/frameworks', icon: BookOpen },
  ] as const

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>{t('eyebrow')}</span>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>{t('heading')}</h2>
        </div>

        {/* Quiz-Teaser — Hero der Promo-Sektion */}
        <Link href={'/#newsletter' as '/'} className="group mt-10 block overflow-hidden rounded-3xl p-8 sm:p-10"
          style={{ background: 'linear-gradient(135deg, #0F1E3A 0%, #15315E 100%)' }}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                style={{ backgroundColor: 'rgba(147,184,245,0.15)', color: '#93B8F5', border: '1px solid rgba(147,184,245,0.35)' }}>
                <Sparkles size={12} /> {t('quizTag')}
              </span>
              <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{t('quizTitle')}</h3>
              <p className="mt-3 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('quizDesc')}</p>
            </div>
            <span className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-full px-6 py-3 text-sm font-bold text-white transition-transform group-hover:translate-x-0.5"
              style={{ backgroundColor: '#1A5FD4' }}>
              {t('quizCta')} <ArrowRight size={16} />
            </span>
          </div>
        </Link>

        {/* Promo-Karten */}
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <Link key={c.key} href={c.href as '/'}
                className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF' }}>
                    <Icon size={20} style={{ color: '#1A5FD4' }} />
                  </span>
                  <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>{t(`${c.key}Tag`)}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ color: '#0D0D0B' }}>{t(`${c.key}Title`)}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{t(`${c.key}Desc`)}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#1A5FD4' }}>
                  {t(`${c.key}Cta`)} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
