import { getTranslations, getLocale } from 'next-intl/server'
import { getDisplayedSubscriberCount } from '@/lib/db/queries/subscriber-count'
import { NewsletterForm } from './NewsletterForm'

/** variant „letter“: Texte des Winning Team Letter (neue Startseite), Formular und Einwilligung bleiben gleich. */
export async function NewsletterSection({ variant }: { variant?: 'letter' } = {}) {
  const t = await getTranslations('newsletter')
  const locale = await getLocale()
  const total = await getDisplayedSubscriberCount()

  // Locale-aware thousand separator
  const formatter = new Intl.NumberFormat(
    locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'de-DE'
  )
  const formattedCount = formatter.format(total)

  return (
    <section id="newsletter" className="px-6 py-20" style={{ backgroundColor: '#1A5FD4' }}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_480px] lg:items-center">
          {/* Left: Headline */}
          <div className="text-white">
            <p className="text-sm font-semibold opacity-70 mb-4 uppercase tracking-widest">
              {variant === 'letter' ? t('letter.category') : t('category')}
            </p>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              {variant === 'letter' ? t('letter.headline') : t('headline', { count: formattedCount })}
            </h2>
            <p className="mt-5 text-base leading-relaxed opacity-80 max-w-md">
              {variant === 'letter' ? t('letter.subtext', { count: formattedCount }) : t('subtext')}
            </p>
            {variant === 'letter' && (
              <p className="mt-3 text-base leading-relaxed opacity-70 max-w-md">{t('letter.body')}</p>
            )}
          </div>

          {/* Right: Form card */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  )
}
