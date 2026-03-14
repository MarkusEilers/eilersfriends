import { Topbar } from '@/components/layout/Topbar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
    </>
  )
}
