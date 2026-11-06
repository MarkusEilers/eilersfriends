import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { Sparkles, GraduationCap, Rocket, BookOpen, ArrowRight } from 'lucide-react'
import { getAvailability } from '@/lib/mystery-shopping/slots'

/** Promo-/„Ads"-Block auf der Startseite — eigene Services/Aktionen + Quiz-Teaser. */
export async function PromoSection() {
  const t = await getTranslations('promo')
  const ms = await getAvailability().catch(() => null)
  const cards = [
    { key: 'academy', href: '/academy', icon: GraduationCap },
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

        {/* Werbebanner Mystery Shopping — 1-€-Einstieg, Plätze live aus der Buchung. */}
        <Link href={'/mystery-shopping' as '/'} className="group mt-10 block overflow-hidden rounded-3xl" style={{ backgroundColor: '#0E1733' }}>
          <div className="grid items-stretch md:grid-cols-[1.4fr_1fr]">
            <div className="p-8 sm:p-10">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6FA3FF' }}>{t('msTag')}</span>
              <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{t('msTitle')}</h3>
              <p className="mt-3 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('msDesc')}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 rounded-[10px] px-6 py-3 text-sm font-bold text-white transition-transform group-hover:translate-x-0.5" style={{ backgroundColor: '#2563FF' }}>
                  {t('msCta')} <ArrowRight size={16} />
                </span>
                {ms && <span className="text-sm font-semibold text-white/80">{ms.soldOut ? t('msSoldOut') : t('msFree', { free: ms.free, capacity: ms.capacity })}</span>}
              </div>
            </div>
            <div className="relative min-h-[220px] bg-cover bg-center" style={{ backgroundImage: 'url(/mystery/hero.jpg)' }}>
              <span className="absolute left-5 top-5 flex h-[84px] w-[84px] -rotate-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg line-through decoration-[3px]" style={{ backgroundColor: '#EB0028', boxShadow: 'inset 0 0 0 4px #EB0028, inset 0 0 0 6px rgba(255,255,255,.45)' }}>997 €</span>
              <span className="absolute left-[70px] top-[30px] flex h-[104px] w-[104px] rotate-[8deg] flex-col items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg" style={{ backgroundColor: '#1A5FD4', boxShadow: 'inset 0 0 0 5px #1A5FD4, inset 0 0 0 7px rgba(255,255,255,.5)' }}>1 €</span>
            </div>
          </div>
        </Link>

        {/* Teaser — Hero der Promo-Sektion.
            Übergang: zeigt auf den Gesprächs-Check, bis die Quiz-Engine steht.
            Vorher führte er zur Newsletter-Anmeldung und versprach eine Analyse,
            die es nicht gab. Die Quiz-Texte bleiben in promo.quiz*. */}
        <Link href={'/gespraechs-check' as '/'} className="group mt-6 block overflow-hidden rounded-3xl p-8 sm:p-10"
          style={{ background: 'linear-gradient(135deg, #0F1E3A 0%, #15315E 100%)' }}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                style={{ backgroundColor: 'rgba(147,184,245,0.15)', color: '#93B8F5', border: '1px solid rgba(147,184,245,0.35)' }}>
                <Sparkles size={12} /> {t('checkTag')}
              </span>
              <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{t('checkTitle')}</h3>
              <p className="mt-3 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{t('checkDesc')}</p>
            </div>
            <span className="inline-flex flex-shrink-0 items-center gap-2 self-start rounded-full px-6 py-3 text-sm font-bold text-white transition-transform group-hover:translate-x-0.5"
              style={{ backgroundColor: '#1A5FD4' }}>
              {t('checkCta')} <ArrowRight size={16} />
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
