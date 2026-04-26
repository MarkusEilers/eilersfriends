import { getTranslations, getLocale } from 'next-intl/server'
import { getDisplayedSubscriberCount } from '@/lib/db/queries/subscriber-count'
import { NewsletterForm } from './NewsletterForm'

export async function NewsletterSection() {
  const t = await getTranslations('newsletter')
  const locale = await getLocale()
  const total = await getDisplayedSubscriberCount()

  // Locale-aware thousand separator
  const formatter = new Intl.NumberFormat(
    locale === 'en' ? 'en-US' : locale === 'ru' ? 'ru-RU' : 'de-DE'
  )
  const formattedCount = formatter.format(total)

  return (
    <section id="newsletter" className="px-6 py-20" style={{ backgroundColor: '#F05A1A' }}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_480px] lg:items-center">
          {/* Left: Headline */}
          <div className="text-white">
            <p className="text-sm font-semibold opacity-70 mb-4 uppercase tracking-widest">
              {t('category')}
            </p>
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
              {t('headline', { count: formattedCount })}
            </h2>
            <p className="mt-5 text-base leading-relaxed opacity-80 max-w-md">
              {t('subtext')}
            </p>
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
