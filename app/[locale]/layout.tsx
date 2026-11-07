import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/lib/i18n/routing'
import { SITE } from '@/lib/seo/site'
import { AnalyticsGate } from '@/components/layout/AnalyticsGate'
import { ChatWidget } from '@/components/chat/ChatWidget'

const TITLE_BY_LOCALE: Record<string, { default: string; description: string }> = {
  de: {
    default: 'Eilers+Friends: Sales Academy & kostenlose Vertriebs-Frameworks',
    description: 'Mehr Abschlüsse für B2B-Teams: SalesMade Academy mit 12 Monaten Live-Training, kostenlose Frameworks, Mystery Shopping für Euer Vertriebsteam und Leadership-Coaching.',
  },
  en: {
    default: 'Eilers+Friends: Sales Academy & free B2B sales frameworks',
    description: 'Win more deals as a B2B team: the SalesMade Academy with 12 months of live training, free sales frameworks, Mystery Shopping for your sales team and leadership coaching.',
  },
  es: {
    default: 'Eilers+Friends: Sales Academy y frameworks de ventas gratuitos',
    description: 'Más cierres para equipos B2B: SalesMade Academy con 12 meses de formación en directo, frameworks de ventas gratuitos, Mystery Shopping para tu equipo y coaching de liderazgo.',
  },
  ru: {
    default: 'Eilers+Friends — Системный рост для основателей',
    description: 'Бизнес-коучинг для B2B-основателей. Revenue Systems и Leadership Training для прогнозируемого роста.',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const meta = TITLE_BY_LOCALE[locale] ?? TITLE_BY_LOCALE.de
  return {
    metadataBase: new URL(SITE),
    // Seitentitel tragen die Marke selbst — kein „| Eilers+Friends“ doppelt anhängen
    title: { template: '%s', default: meta.default },
    description: meta.description,
    openGraph: { siteName: 'Eilers+Friends', locale, type: 'website' },
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
      <AnalyticsGate />
      <ChatWidget />
    </NextIntlClientProvider>
  )
}
