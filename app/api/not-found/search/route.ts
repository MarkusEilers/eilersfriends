import { NextResponse } from 'next/server'
import { corpus, rank, type Lang } from '@/lib/notfound/corpus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FALLBACK: Record<Lang, string[]> = {
  de: ['/academy', '/mystery-shopping', '/check/bottleneck', '/frameworks', '/blog', '/schedule'],
  en: ['/en/academy', '/en/mystery-shopping', '/en/check/bottleneck', '/en/frameworks', '/en/blog', '/en/schedule'],
  es: ['/es/academy', '/es/mystery-shopping', '/es/check/bottleneck', '/es/frameworks', '/es/blog', '/es/schedule'],
}

/** Suchergebnisse für die 404-Seite: aus dem kaputten Pfad und/oder einer Frage. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { q?: string; path?: string; lang?: string }
  const lang: Lang = b.lang === 'en' || b.lang === 'es' ? b.lang : 'de'
  const q = String(b.q ?? '').slice(0, 300), path = String(b.path ?? '').slice(0, 300)
  const docs = await corpus(lang)
  const ranked = rank(docs, `${q} ${path.replace(/[/_-]+/g, ' ')}`, q ? '' : path)
  const best = !q && ranked[0] && ranked[0].score >= 9 && (!ranked[1] || ranked[0].score >= ranked[1].score + 3) ? ranked[0] : null
  let results = ranked.slice(0, 6)
  if (results.length < 3) {
    const extra = FALLBACK[lang].map((h) => docs.find((d) => d.href === h)).filter((d): d is NonNullable<typeof d> => !!d && !results.some((r) => r.href === d.href))
    results = [...results, ...extra.map((d) => ({ ...d, score: 0 }))].slice(0, 6)
  }
  return NextResponse.json({
    best: best ? { href: best.href, title: best.title } : null,
    results: results.map(({ kind, href, title, text, image }) => ({ kind, href, title, text, image: image ?? null })),
  })
}
