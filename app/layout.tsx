import type { Metadata } from 'next'
import '@/app/globals.css'
import { StructuredData } from '@/components/seo/StructuredData'

export const metadata: Metadata = {
  // Seitentitel tragen die Marke selbst (Sprachen und Texte: app/[locale]/layout.tsx)
  title: { template: '%s', default: 'Eilers+Friends: Sales Academy & kostenlose Vertriebs-Frameworks' },
  description: 'Mehr Abschlüsse für B2B-Teams: SalesMade Academy mit 12 Monaten Live-Training, kostenlose Frameworks, Mystery Shopping für Euer Vertriebsteam und Leadership-Coaching.',
  metadataBase: new URL('https://www.eilersfriends.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#1A5FD4" />
        <StructuredData />
      </head>
      <body>{children}</body>
    </html>
  )
}
