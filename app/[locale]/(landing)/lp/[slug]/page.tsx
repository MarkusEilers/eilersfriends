import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { eq, asc, and } from 'drizzle-orm'
import type { Metadata } from 'next'
import { LpHero } from '@/components/lp/LpHero'
import { LpVideo } from '@/components/lp/LpVideo'
import { LpSocialProof } from '@/components/lp/LpSocialProof'
import { LpProblem } from '@/components/lp/LpProblem'
import { LpFeatures } from '@/components/lp/LpFeatures'
import { LpTestimonials } from '@/components/lp/LpTestimonials'
import { LpFaq } from '@/components/lp/LpFaq'
import { LpEmailCapture } from '@/components/lp/LpEmailCapture'
import { LpCta } from '@/components/lp/LpCta'
import { LpCoachBio } from '@/components/lp/LpCoachBio'
import { LpGeneric } from '@/components/lp/LpGeneric'

interface PageProps {
  params: { slug: string; locale: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const pages = await db.select().from(landingPages)
      .where(and(eq(landingPages.slug, params.slug), eq(landingPages.status, 'published')))
      .limit(1)
    const page = pages[0]
    if (!page) return {}
    return {
      title: page.title,
      description: page.metaDescription ?? undefined,
    }
  } catch {
    return {}
  }
}

export default async function LandingPageRoute({ params }: PageProps) {
  let page: typeof landingPages.$inferSelect | null = null
  let sections: (typeof landingPageSections.$inferSelect)[] = []

  try {
    const pages = await db.select().from(landingPages)
      .where(and(eq(landingPages.slug, params.slug), eq(landingPages.status, 'published')))
      .limit(1)

    if (pages.length === 0) notFound()
    page = pages[0]

    sections = await db.select().from(landingPageSections)
      .where(and(eq(landingPageSections.landingPageId, page.id), eq(landingPageSections.isVisible, true)))
      .orderBy(asc(landingPageSections.order))
  } catch {
    notFound()
  }

  const accent = page!.accentColor ?? '#F05A1A'

  return (
    <div className="min-h-screen" style={{ '--accent' : accent } as React.CSSProperties}>
      {sections.map((section) => {
        const content = section.content as Record<string, unknown>
        switch (section.type) {
          case 'hero':
            return <LpHero key={section.id} content={content} accent={accent} emailList={page!.emailList ?? 'general'} />
          case 'video':
            return <LpVideo key={section.id} content={content} />
          case 'social_proof':
            return <LpSocialProof key={section.id} content={content} />
          case 'problem':
            return <LpProblem key={section.id} content={content} />
          case 'solution':
          case 'features':
          case 'how_it_works':
          case 'offer':
            return <LpFeatures key={section.id} content={content} accent={accent} type={section.type} />
          case 'testimonials':
            return <LpTestimonials key={section.id} content={content} />
          case 'faq':
            return <LpFaq key={section.id} content={content} />
          case 'email_capture':
            return <LpEmailCapture key={section.id} content={content} accent={accent} emailList={page!.emailList ?? 'general'} />
          case 'cta':
            return <LpCta key={section.id} content={content} accent={accent} />
          case 'coach_bio':
            return <LpCoachBio key={section.id} content={content} />
          default:
            return <LpGeneric key={section.id} content={content} />
        }
      })}
    </div>
  )
}
