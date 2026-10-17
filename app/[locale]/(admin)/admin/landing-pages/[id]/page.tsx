import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { LandingPageEditorClient } from '@/components/admin/LandingPageEditorClient'
import { sectionI18n } from '@/lib/lp/i18n'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LandingPageEditorPage({ params }: PageProps) {
  const { id } = await params
  let page: typeof landingPages.$inferSelect | null = null
  let sections: (typeof landingPageSections.$inferSelect)[] = []

  try {
    const pages = await db
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, id))
      .limit(1)

    if (pages.length === 0) notFound()
    page = pages[0]

    sections = await db
      .select()
      .from(landingPageSections)
      .where(eq(landingPageSections.landingPageId, id))
      .orderBy(asc(landingPageSections.order))
  } catch (_) {
    notFound()
  }

  const i18n = await sectionI18n(page!.id)
  return <LandingPageEditorClient page={page!} sections={sections.map((s) => ({ ...s, contentI18n: (i18n.get(s.id) ?? {}) as Record<string, Record<string, unknown>> })) as never} />
}
