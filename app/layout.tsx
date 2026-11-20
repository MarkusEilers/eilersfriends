import type { Metadata } from 'next'
import '@/app/globals.css'
import { StructuredData } from '@/components/seo/StructuredData'
import { getLocale } from 'next-intl/server'
import { ROOT_FONTS_CSS, ROOT_FONT_PRELOAD } from '@/lib/fonts/google-local'

export const metadata: Metadata = {
  // Seitentitel tragen die Marke selbst (Sprachen und Texte: app/[locale]/layout.tsx)
  title: { template: '%s', default: 'Eilers+Friends: Sales Academy & kostenlose Vertriebs-Frameworks' },
  description: 'Mehr Abschlüsse für B2B-Teams: SalesMade Academy mit 12 Monaten Live-Training, kostenlose Frameworks, Mystery Shopping für Euer Vertriebsteam und Leadership-Coaching.',
  metadataBase: new URL('https://www.eilersfriends.com'),
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Sprache der Seite im <html lang>: wichtig für Google und Screenreader (vorher immer „de“)
  const raw = await getLocale().catch(() => 'de')
  const lang = raw === 'en' || raw === 'es' ? raw : 'de'
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preload" href={ROOT_FONT_PRELOAD} as="font" type="font/woff2" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: ROOT_FONTS_CSS }} />
        <meta name="theme-color" content="#1A5FD4" />
        <StructuredData />
      </head>
      <body>{children}</body>
    </html>
  )
}
