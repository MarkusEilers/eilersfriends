import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadLpSections, canPreview } from '@/lib/lp/story-loader'
import { StoryBlock, loadStoryCtx } from '@/components/lp/story/StoryBlocks'
import { STORY_CSS } from '@/components/lp/story/story-css'
import { PreviewBanner } from '@/components/lp/PreviewBanner'
import { SITE } from '@/lib/seo/site'

export const dynamic = 'force-dynamic'

const META: Record<string, { title: string; description: string }> = {
  de: { title: 'Liquid Leadership · Führungsprogramm von Aljona Eilers · Eilers+Friends', description: 'Zwölf Sessions, nach denen Teams ihren Führungskräften gern folgen. Group Coaching, 1:1 mit Shadowing und drei Quality Gates. Für CEOs und ihre Führungsteams.' },
  en: { title: 'Liquid Leadership · Leadership programme by Aljona Eilers · Eilers+Friends', description: 'Twelve sessions after which teams gladly follow their leaders. Group coaching, 1:1 with shadowing and three quality gates. For CEOs and their leadership teams.' },
  es: { title: 'Liquid Leadership · Programa de liderazgo de Aljona Eilers · Eilers+Friends', description: 'Doce sesiones tras las cuales los equipos siguen con gusto a sus líderes. Group coaching, 1:1 con shadowing y tres quality gates. Para CEOs y sus equipos directivos.' },
}
const IMG = `${SITE}/heroes/liquid-leadership-2.jpg`
const url = (l: string) => `${SITE}${l === 'de' ? '' : `/${l}`}/liquidleadership`

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const m = META[locale] ?? META.de
  return {
    title: m.title, description: m.description,
    alternates: { canonical: url(locale), languages: { de: url('de'), en: url('en'), es: url('es'), 'x-default': url('de') } },
    openGraph: { type: 'website', title: m.title, description: m.description, url: url(locale), images: [{ url: IMG, alt: 'Liquid Leadership mit Aljona Eilers' }] },
    twitter: { card: 'summary_large_image', title: m.title, description: m.description, images: [IMG] },
  }
}

/** Liquid Leadership — Inhalte aus dem Landingpage-System (Slug „liquidleadership“), Programm im Backend: programs.slug „liquid-leadership“. */
export default async function LiquidLeadershipPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { locale } = await params
  const preview = await canPreview((await searchParams).preview)
  const lp = await loadLpSections('liquidleadership', locale, preview).catch(() => null)
  if (!lp) notFound()
  const ctx = await loadStoryCtx()
  const m = META[locale] ?? META.de
  const course = {
    '@context': 'https://schema.org', '@type': 'Course', name: 'Liquid Leadership', description: m.description, url: url(locale), image: IMG,
    inLanguage: locale, educationalLevel: 'Führungskräfte', numberOfCredits: 12,
    provider: { '@type': 'Organization', name: 'Eilers+Friends', url: SITE },
    instructor: { '@type': 'Person', name: 'Aljona Eilers', url: `${SITE}/aljona` },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'blended', courseWorkload: 'PT12H', instructor: { '@type': 'Person', name: 'Aljona Eilers' } },
  }
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(course).replace(/</g, '\\u003c') }} />
      {lp.status !== 'published' && <PreviewBanner status={lp.status} editHref={`/admin/landing-pages/${lp.pageId}`} slug="liquidleadership" locale={locale} />}
      {lp.sections.some((s) => s.type !== 'story_html') && <style href="story-css" precedence="default">{STORY_CSS}</style>}
      {lp.sections.map((s) => s.type === 'story_html'
        ? <StoryBlock key={s.id} type={s.type} c={s.content} ctx={ctx} />
        : <div key={s.id} className="sb"><StoryBlock type={s.type} c={s.content} ctx={ctx} /></div>)}
    </main>
  )
}
