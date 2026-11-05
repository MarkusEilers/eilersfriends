import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadLpSections, canPreview } from '@/lib/lp/story-loader'
import { StoryPage, loadStoryCtx } from '@/components/lp/story/StoryBlocks'
import { PreviewBanner } from '@/components/lp/PreviewBanner'
import { FooterSlim } from '@/components/layout/FooterSlim'
import { CookieBanner } from '@/components/layout/CookieBanner'

export const dynamic = 'force-dynamic'

/** Squeeze-Seite Mystery Shopping — Inhalte aus dem Landingpage-System (Slug „mystery-shopping“). */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const lp = await loadLpSections('mystery-shopping', locale).catch(() => null)
  return { title: lp?.title ?? 'Mystery Shopping · Eilers+Friends', description: lp?.description ?? undefined }
}

export default async function MysteryShoppingSqueeze({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { locale } = await params
  const preview = await canPreview((await searchParams).preview)
  const lp = await loadLpSections('mystery-shopping', locale, preview).catch(() => null)
  if (!lp) notFound()
  const ctx = await loadStoryCtx()
  return (
    <>
      {lp.status !== 'published' && <PreviewBanner status={lp.status} editHref={`/admin/landing-pages/${lp.pageId}`} slug="mystery-shopping" locale={locale} />}
      <StoryPage sections={lp.sections} ctx={ctx} />
      <FooterSlim />
      <CookieBanner />
    </>
  )
}
