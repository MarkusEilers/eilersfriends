import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { LandingPageEditorClient } from '@/components/admin/LandingPageEditorClient'

interface PageProps {
  params: { id: string }
}

export default async function LandingPageEditorPage({ params }: PageProps) {
  let page: typeof landingPages.$inferSelect | null = null
  let sections: (typeof landingPageSections.$inferSelect)[] = []

  try {
    const pages = await db
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, params.id))
      .limit(1)

    if (pages.length === 0) notFound()
    page = pages[0]

    sections = await db
      .select()
      .from(landingPageSections)
      .where(eq(landingPageSections.landingPageId, params.id))
      .orderBy(asc(landingPageSections.order))
  } catch (_) {
    notFound()
  }

  return <LandingPageEditorClient page={page!} sections={sections} />
}
