import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/lib/i18n/routing'
import { AnalyticsGate } from '@/components/layout/AnalyticsGate'
import { ChatWidget } from '@/components/chat/ChatWidget'

const TITLE_BY_LOCALE: Record<string, { default: string; description: string }> = {
  de: {
    default: 'Eilers+Friends — Systematisches Wachstum für Gründer',
    description: 'Business Coaching für B2B-Unternehmer. Revenue Systems & Leadership Training für planbares Wachstum. Von 500+ Gründer:innen empfohlen.',
  },
  en: {
    default: 'Eilers+Friends — Systematic growth for founders',
    description: 'Business coaching for B2B founders. Revenue Systems & Leadership Training for predictable growth. Trusted by 500+ founders.',
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
    title: {
      template: '%s | Eilers+Friends',
      default: meta.default,
    },
    description: meta.description,
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
