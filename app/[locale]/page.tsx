import { HeroSection } from '@/components/sections/HeroSection'
import { LogoStripSection } from '@/components/sections/LogoStripSection'
import { ProblemSection } from '@/components/sections/ProblemSection'
import { BentoGrid } from '@/components/sections/BentoGrid'
import { SalesMadeAcademySection } from '@/components/sections/SalesMadeAcademySection'
import { ProgrammeSection } from '@/components/sections/ProgrammeSection'
import { CoachesSection } from '@/components/sections/CoachesSection'
import { HVCOSection } from '@/components/sections/HVCOSection'
import { PromoSection } from '@/components/sections/PromoSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CtaBlock } from '@/components/sections/CtaBlock'
import { NewsletterSection } from '@/components/sections/NewsletterSection'
import { Topbar } from '@/components/layout/Topbar'
import { getSetting } from '@/lib/db/queries/settings'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { loadLpSections, canPreview } from '@/lib/lp/story-loader'
import { StoryBlock, loadStoryCtx } from '@/components/lp/story/StoryBlocks'
import { STORY_CSS } from '@/components/lp/story/story-css'
import { PreviewBanner } from '@/components/lp/PreviewBanner'

export default async function HomePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { locale } = await params
  // Neue Startseite aus dem Landingpage-System (Slug „home“): live, sobald veröffentlicht; vorher mit ?preview=1 für Admins
  const preview = await canPreview((await searchParams).preview)
  const lp = await loadLpSections('home', locale, preview).catch(() => null)
  if (lp) {
    const ctx = await loadStoryCtx()
    const needsSb = lp.sections.some((s) => s.type !== 'story_html')
    return (
      <>
        {lp.status !== 'published' && <PreviewBanner status={lp.status} editHref={`/admin/landing-pages/${lp.pageId}`} slug="home" locale={locale} />}
        <Topbar />
        <Navbar />
        <main>
          {needsSb && <style href="story-css" precedence="default">{STORY_CSS}</style>}
          {lp.sections.map((s) => s.type === 'story_html'
            ? <StoryBlock key={s.id} type={s.type} c={s.content} ctx={ctx} />
            : <div key={s.id} className="sb"><StoryBlock type={s.type} c={s.content} ctx={ctx} /></div>)}
        </main>
        <Footer />
        <CookieBanner />
      </>
    )
  }
  const calendlyUrl = await getSetting('calendly.markus')
  return (
    <>
      <Topbar />
      <Navbar />
      <main>
        <HeroSection calendlyUrl={calendlyUrl} />
        <LogoStripSection />
        <ProblemSection />
        <BentoGrid />
        <SalesMadeAcademySection />
        <HVCOSection />
        <PromoSection />
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
