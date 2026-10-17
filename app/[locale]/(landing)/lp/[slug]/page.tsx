import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { eq, asc, and } from 'drizzle-orm'
import type { Metadata } from 'next'
import { LpRender } from '@/components/lp/LpRender'
import { PreviewBanner } from '@/components/lp/PreviewBanner'
import { auth } from '@/lib/auth'
import { localize, sectionI18n } from '@/lib/lp/i18n'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
  searchParams: Promise<{ preview?: string }>
}

/** Eilers+Friends darf mit ?preview=1 auch Entwürfe ansehen. */
async function canPreview(sp: { preview?: string }) {
  if (!sp.preview) return false
  const s = await auth().catch(() => null)
  return s?.user?.role === 'admin' || s?.user?.role === 'coach'
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

export default async function LandingPageRoute({ params, searchParams }: PageProps) {
  const { slug, locale } = await params
  const preview = await canPreview(await searchParams)
  let page: typeof landingPages.$inferSelect | null = null
  let sections: (typeof landingPageSections.$inferSelect)[] = []

  try {
    const pages = await db.select().from(landingPages)
      .where(preview ? eq(landingPages.slug, slug) : and(eq(landingPages.slug, slug), eq(landingPages.status, 'published')))
      .limit(1)

    if (pages.length === 0) notFound()
    page = pages[0]

    sections = await db.select().from(landingPageSections)
      .where(and(eq(landingPageSections.landingPageId, page.id), eq(landingPageSections.isVisible, true)))
      .orderBy(asc(landingPageSections.order))
  } catch {
    notFound()
  }

  const accent = page!.accentColor ?? '#1A5FD4'
  const i18n = await sectionI18n(page!.id).catch(() => new Map<string, Record<string, unknown>>())

  return (
    <div className="min-h-screen" style={{ '--accent' : accent } as React.CSSProperties}>
      {page!.status !== 'published' && <PreviewBanner status={page!.status} editHref={`/admin/landing-pages/${page!.id}`} slug={page!.slug} templateKey={page!.templateKey} locale={locale} />}
      <LpRender sections={sections.map(s => ({ id: s.id, type: s.type, isVisible: s.isVisible, content: localize(s.content as Record<string, unknown>, i18n.get(s.id), locale) }))} accent={accent} emailList={page!.emailList ?? 'general'} />
    </div>
  )
}
