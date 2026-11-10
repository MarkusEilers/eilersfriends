import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { StoriesHub, postToItem, type HubItem } from '@/components/blog/StoriesHub'
import { listPosts, topTags, frameworkCards } from '@/lib/blog/posts'
import { AUTHORS } from '@/lib/blog/authors'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blogUi.index')
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

const DISCIPLINE: Record<string, string[]> = { revenue: ['markus', 'team'], leadership: ['aljona', 'team'] }

export default async function BlogIndexPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string; format?: string; d?: string; thema?: string; coach?: string; n?: string; q?: string }> }) {
  const [{ locale }, sp] = await Promise.all([params, searchParams])
  const preview = (sp.preview === '1' && await isEditor())
  const coach = sp.coach === 'markus' || sp.coach === 'aljona' ? sp.coach : null
  const filter = {
    format: sp.format || null, d: sp.d && DISCIPLINE[sp.d] ? sp.d : null, thema: sp.thema || null, coach,
    n: Math.min(200, Math.max(0, Number(sp.n) || 0)),
    q: (sp.q ?? '').trim().slice(0, 80) || null,
  }
  const limit = filter.n || 24
  const authors = coach ? [coach] : filter.d ? DISCIPLINE[filter.d] : null

  const wantFrameworks = (!filter.format || filter.format === 'framework') && filter.d !== 'leadership' && coach !== 'aljona' && !filter.thema && !filter.q
  const [posts, tags, fws] = await Promise.all([
    listPosts({ limit: limit + 1, includeDrafts: preview, locale, format: filter.format, authors, tag: filter.thema, q: filter.q }),
    topTags(10),
    wantFrameworks ? frameworkCards(8) : Promise.resolve([]),
  ])
  const hasMore = posts.length > limit
  const items: HubItem[] = posts.slice(0, limit).map(postToItem)
  for (const f of fws) {
    items.push({
      key: `fw-${f.slug}`, href: `/frameworks/${f.slug}`, title: f.title.split(' — ')[0], excerpt: f.excerpt, image: f.image,
      author: AUTHORS.markus, format: 'framework', date: null, minutes: null, tags: [], agent: true,
    })
  }
  // Filter-Tabs nur für Formate mit Inhalt (Beiträge dieser Sprache + Frameworks)
  const fmtRows = (await db.execute(sql`SELECT DISTINCT format FROM blog_posts WHERE status = 'published' AND locale = ${locale} AND format IS NOT NULL`).catch(() => [])) as unknown as Array<{ format: string }>
  const formats = [...fmtRows.map((r) => r.format), ...((await frameworkCards(1)).length ? ['framework'] : [])]
  return <StoriesHub items={items} filter={filter} tags={tags} preview={preview} hasMore={hasMore} formats={formats} />
}

/** Entwürfe nur für Admin und Coach — sonst wäre ?preview=1 eine offene Tür. */
async function isEditor() {
  const s = await auth().catch(() => null)
  return s?.user?.role === 'admin' || s?.user?.role === 'coach'
}
