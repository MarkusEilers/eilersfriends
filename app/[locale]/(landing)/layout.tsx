import { Suspense } from 'react'
import { NavbarSlim } from '@/components/layout/NavbarSlim'
import { FooterSlim } from '@/components/layout/FooterSlim'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarSlim />
      <main>{children}</main>
      <FooterSlim />
      <CookieBanner />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}
