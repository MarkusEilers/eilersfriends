import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFunnel } from '@/lib/ask/registry'
import { publicDef, asLang } from '@/lib/ask/engine'
import { AskFunnel } from '@/components/ask/AskFunnel'
import { ASK_CSS } from '@/components/ask/ask-css'
import { SITE } from '@/lib/seo/site'

type P = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ src?: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params
  const f = getFunnel(slug)
  if (!f) return {}
  const l = asLang(locale)
  const url = (x: string) => `${SITE}${x === 'de' ? '' : `/${x}`}/check/${slug}`
  return {
    title: `${f.def.title[l]} · ${f.def.kicker[l]}`,
    description: f.def.intro[l].slice(0, 155),
    alternates: { canonical: url(l), languages: { de: url('de'), en: url('en'), es: url('es') } },
  }
}

/** ASK-Funnel: Fragenstrecke, Kurzergebnis sofort, voller Report nach Bestätigung per Mail. */
export default async function CheckPage({ params, searchParams }: P) {
  const { locale, slug } = await params
  const f = getFunnel(slug)
  if (!f) notFound()
  const lang = asLang(locale)
  const src = (await searchParams).src
  return (
    <div style={{ background: '#FAFAF8', minHeight: '70vh' }}>
      <style href="ask-css" precedence="default">{ASK_CSS}</style>
      <AskFunnel def={publicDef(f.def, lang)} lang={lang} source={src ? String(src).slice(0, 80) : undefined} />
    </div>
  )
}
