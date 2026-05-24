import { Topbar } from '@/components/layout/Topbar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { getSetting } from '@/lib/db/queries/settings'
import { Suspense } from 'react'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const calendlyUrl = await getSetting('calendly.markus')
  return (
    <>
      <Topbar />
      <Navbar calendlyUrl={calendlyUrl} />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}