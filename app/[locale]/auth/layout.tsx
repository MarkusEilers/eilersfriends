import type { Metadata } from 'next'

/** Login und Einladung gehören nicht in die Google-Suche. */
export const metadata: Metadata = { title: 'Anmelden · Eilers+Friends', robots: { index: false, follow: false } }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
