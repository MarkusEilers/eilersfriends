import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadLpSections, canPreview } from '@/lib/lp/story-loader'
import { StoryBlock, loadStoryCtx } from '@/components/lp/story/StoryBlocks'
import { STORY_CSS } from '@/components/lp/story/story-css'
import { PreviewBanner } from '@/components/lp/PreviewBanner'

export const dynamic = 'force-dynamic'

/** SalesMade Academy — Inhalte aus dem Landingpage-System (Slug „academy“). Globale Navigation und Footer kommen aus dem Marketing-Layout. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const lp = await loadLpSections('academy', locale).catch(() => null)
  return { title: lp?.title ?? 'SalesMade Academy · Eilers+Friends', description: lp?.description ?? undefined }
}

export default async function AcademyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { locale } = await params
  const preview = await canPreview((await searchParams).preview)
  const lp = await loadLpSections('academy', locale, preview).catch(() => null)
  if (!lp) notFound()
  const ctx = await loadStoryCtx()
  const needsSb = lp.sections.some((s) => s.type !== 'story_html')
  return (
    <>
      {lp.status !== 'published' && <PreviewBanner status={lp.status} editHref={`/admin/landing-pages/${lp.pageId}`} slug="academy" locale={locale} />}
      {needsSb && <style href="story-css" precedence="default">{STORY_CSS}</style>}
      {lp.sections.map((s) => s.type === 'story_html'
        ? <StoryBlock key={s.id} type={s.type} c={s.content} ctx={ctx} />
        : <div key={s.id} className="sb"><StoryBlock type={s.type} c={s.content} ctx={ctx} /></div>)}
    </>
  )
}
