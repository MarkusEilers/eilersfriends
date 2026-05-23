import type { Metadata } from 'next'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Eilers+Friends',
    default: 'Eilers+Friends — Systematisches Wachstum für Gründer',
  },
  description: 'Wir helfen Gründern und Vertriebsteams, aus Wissen echte Fähigkeit zu machen — messbar, reproduzierbar, skalierbar.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://eilersfriends.com'),
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
      </head>
      <body>{children}</body>
    </html>
  )
}
