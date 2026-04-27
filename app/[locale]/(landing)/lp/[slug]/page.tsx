import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { eq, asc, and } from 'drizzle-orm'
import type { Metadata } from 'next'
import { LpRender } from '@/components/lp/LpRender'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const pages = await db.select().from(landingPages)
      .where(and(eq(landingPages.slug, slug), eq(landingPages.status, 'published')))
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
  const { slug } = await params
  let page: typeof landingPages.$inferSelect | null = null
  let sections: (typeof landingPageSections.$inferSelect)[] = []

  try {
    const pages = await db.select().from(landingPages)
      .where(and(eq(landingPages.slug, slug), eq(landingPages.status, 'published')))
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
      <LpRender sections={sections.map(s => ({ id: s.id, type: s.type, isVisible: s.isVisible, content: s.content as Record<string, unknown> }))} accent={accent} emailList={page!.emailList ?? 'general'} />
    </div>
  )
}
