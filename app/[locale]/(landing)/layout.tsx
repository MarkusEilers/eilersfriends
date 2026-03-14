import { NavbarSlim } from '@/components/layout/NavbarSlim'
import { FooterSlim } from '@/components/layout/FooterSlim'
import { CookieBanner } from '@/components/layout/CookieBanner'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarSlim />
      <main>{children}</main>
      <FooterSlim />
      <CookieBanner />
    </>
  )
}
