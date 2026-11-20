import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadLpSections, canPreview, shareMeta } from '@/lib/lp/story-loader'
import { StoryPage, loadStoryCtx } from '@/components/lp/story/StoryBlocks'
import { PreviewBanner } from '@/components/lp/PreviewBanner'
import { FooterSlim } from '@/components/layout/FooterSlim'
import { Topbar } from '@/components/layout/Topbar'
import { Navbar } from '@/components/layout/Navbar'
import { CookieBanner } from '@/components/layout/CookieBanner'

export const dynamic = 'force-dynamic'

const META = {
  en: { title: 'Mystery Shopping: what league is your sales team playing in?', description: 'We hold a first call with your team as an imaginary customer. 14-page report and a training session on the skill that matters most.' },
  es: { title: 'Mystery Shopping: ¿en qué liga juega tu equipo de ventas?', description: 'Hacemos una primera llamada con tu equipo como cliente imaginario. Informe de 14 páginas y una sesión de formación sobre la habilidad clave.' },
}

/** Squeeze-Seite Mystery Shopping — Inhalte aus dem Landingpage-System (Slug „mystery-shopping“). */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const lp = await loadLpSections('mystery-shopping', locale).catch(() => null)
  const m = locale === 'en' || locale === 'es' ? META[locale] : null
  const title = m?.title ?? lp?.title ?? 'Mystery Shopping · Eilers+Friends'
  const description = m?.description ?? lp?.description ?? undefined
  return { title, description, ...shareMeta(title, description, lp?.ogImage ?? '/mystery/hero.jpg') }
}

export default async function MysteryShoppingSqueeze({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { locale } = await params
  const preview = await canPreview((await searchParams).preview)
  const lp = await loadLpSections('mystery-shopping', locale, preview).catch(() => null)
  if (!lp) notFound()
  const ctx = await loadStoryCtx()
  // Kopf kommt aus dem Seiten-Layout (Topbar + Navbar ohne Navigation); der eigene Kopf der Landingpage entfällt
  const topnav = lp.sections.find((s) => s.type === 'story_topnav')
  const sections = lp.sections.filter((s) => s.type !== 'story_topnav')
  const cta = topnav ? { label: String(topnav.content.cta ?? 'Mystery Shopping buchen'), href: String(topnav.content.ctaHref ?? '#optin') } : undefined
  return (
    <>
      {lp.status !== 'published' && <PreviewBanner status={lp.status} editHref={`/admin/landing-pages/${lp.pageId}`} slug="mystery-shopping" locale={locale} />}
      <Topbar variant="mystery" />
      <Navbar landing landingCta={cta} />
      <main><StoryPage sections={sections} ctx={ctx} /></main>
      <FooterSlim />
      <CookieBanner />
    </>
  )
}
