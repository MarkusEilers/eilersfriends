import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadLpSections, canPreview } from '@/lib/lp/story-loader'
import { StoryBlock, loadStoryCtx } from '@/components/lp/story/StoryBlocks'
import { STORY_CSS } from '@/components/lp/story/story-css'
import { PreviewBanner } from '@/components/lp/PreviewBanner'

export const dynamic = 'force-dynamic'

const META: Record<string, { title: string; description: string }> = {
  de: { title: 'SalesMade Academy: Sales-Training für B2B-Teams · Eilers+Friends', description: 'Euer Sales-Team kann mehr, als die Zahlen zeigen. 12 Monate Live-Training und Coaching, 19 gemessene Skills, 90 Tage Geld-zurück-Garantie. Nur 30 Premium-Plätze.' },
  en: { title: 'SalesMade Academy: sales training for B2B teams · Eilers+Friends', description: 'Your sales team can do more than the numbers show. 12 months of live training and coaching, 19 measured skills, 90-day money-back guarantee. Only 30 Premium seats.' },
  es: { title: 'SalesMade Academy: formación en ventas para equipos B2B · Eilers+Friends', description: 'Tu equipo de ventas puede más de lo que muestran los números. 12 meses de formación y coaching en directo, 19 habilidades medidas, garantía de devolución de 90 días.' },
}

/** SalesMade Academy — Inhalte aus dem Landingpage-System (Slug „academy“). Globale Navigation und Footer kommen aus dem Marketing-Layout. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const lp = await loadLpSections('academy', locale).catch(() => null)
  const m = META[locale]
  return { title: m?.title ?? 'SalesMade Academy: Sales-Training für B2B-Teams · Eilers+Friends', description: m?.description ?? lp?.description ?? undefined }
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
