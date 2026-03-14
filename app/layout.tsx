import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Eilers+Friends',
    default: 'Eilers+Friends — Systematisches Wachstum für Gründer',
  },
  description: 'Wir helfen Gründern und Vertriebsteams, aus Wissen echte Fähigkeit zu machen — messbar, reproduzierbar, skalierbar.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://eilersfriends.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
