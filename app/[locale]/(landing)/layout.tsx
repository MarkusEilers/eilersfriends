import { NavbarSlim } from '@/components/layout/NavbarSlim'
import { FooterSlim } from '@/components/layout/FooterSlim'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { getSetting } from '@/lib/db/queries/settings'
import { Suspense } from 'react'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const calendlyUrl = await getSetting('calendly.markus')
  return (
    <>
      <NavbarSlim ctaHref={calendlyUrl} />
      <main>{children}</main>
      <FooterSlim />
      <CookieBanner />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}