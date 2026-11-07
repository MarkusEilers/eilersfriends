// app/[locale]/checkout/layout.tsx
// Strips marketing/portal chrome — full-width checkout
import type { Metadata } from 'next'

/** Checkout- und Bestätigungsseiten gehören nicht in die Suche. */
export const metadata: Metadata = { robots: { index: false, follow: true } }

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>
}
