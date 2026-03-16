import { HeroSection } from '@/components/sections/HeroSection'
import { LogoStripSection } from '@/components/sections/LogoStripSection'
import { ProblemSection } from '@/components/sections/ProblemSection'
import { BentoGrid } from '@/components/sections/BentoGrid'
import { CoachesSection } from '@/components/sections/CoachesSection'
import { HVCOSection } from '@/components/sections/HVCOSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CtaBlock } from '@/components/sections/CtaBlock'
import { NewsletterSection } from '@/components/sections/NewsletterSection'
import { Topbar } from '@/components/layout/Topbar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'

export default function HomePage() {
  return (
    <>
      <Topbar />
      <Navbar />
      <main>
        <HeroSection />
        <LogoStripSection />
        <ProblemSection />
        <BentoGrid />
        <CoachesSection />
        <HVCOSection />
        <TestimonialsSection />
        <CtaBlock />
        <NewsletterSection />
      </main>
      <Footer />
      <CookieBanner />
    </>
  )
}
