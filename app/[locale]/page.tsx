import { HeroSection } from '@/components/sections/HeroSection'
import { LogoStripSection } from '@/components/sections/LogoStripSection'
import { ProblemSection } from '@/components/sections/ProblemSection'
import { BentoGrid } from '@/components/sections/BentoGrid'
import { SalesMadeAcademySection } from '@/components/sections/SalesMadeAcademySection'
import { ProgrammeSection } from '@/components/sections/ProgrammeSection'
import { CoachesSection } from '@/components/sections/CoachesSection'
import { HVCOSection } from '@/components/sections/HVCOSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CtaBlock } from '@/components/sections/CtaBlock'
import { NewsletterSection } from '@/components/sections/NewsletterSection'
import { Topbar } from '@/components/layout/Topbar'
import { getSetting } from '@/lib/db/queries/settings'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'

export default async function HomePage() {
  const calendlyUrl = await getSetting('calendly.markus')
  return (
    <>
      <Topbar />
      <Navbar calendlyUrl={calendlyUrl} />
      <main>
        <HeroSection calendlyUrl={calendlyUrl} />
        <LogoStripSection />
        <ProblemSection />
        <BentoGrid />
        <SalesMadeAcademySection />
        <HVCOSection />
        <CoachesSection />
        <ProgrammeSection />
        <TestimonialsSection />
        <CtaBlock />
        <NewsletterSection />
      </main>
      <Footer />
      <CookieBanner />
    </>
  )
}
