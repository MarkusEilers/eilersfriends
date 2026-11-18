import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { NotFound404 } from '@/components/notfound/NotFound404'

export const metadata: Metadata = { title: '404 · Eilers+Friends', robots: { index: false, follow: true } }

/** 404 im Look der Website: Navigation, Eily groß in der Mitte, Suchergebnisse aus dem Kontext. */
export default function LocaleNotFound() {
  return (
    <>
      <Topbar />
      <Navbar />
      <main><NotFound404 /></main>
      <Footer />
      <CookieBanner />
    </>
  )
}
