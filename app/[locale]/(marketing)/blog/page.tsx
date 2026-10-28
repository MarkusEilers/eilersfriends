import type { Metadata } from 'next'
import { StoriesHub, postToItem, type HubItem } from '@/components/blog/StoriesHub'
import { listPosts, topTags, frameworkCards } from '@/lib/blog/posts'
import { AUTHORS } from '@/lib/blog/authors'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Winning Team Stories · Eilers+Friends',
  description:
    'Was wir in 500+ Founder-Sparrings über Vertrieb und Führung lernen: Kundenstorys, die Serie „Gekippt bei Minute …", Frameworks, Podcast und Sparring-Notizen.',
}

const DISCIPLINE: Record<string, string[]> = { revenue: ['markus', 'team'], leadership: ['aljona', 'team'] }

export default async function BlogIndexPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string; format?: string; d?: string; thema?: string }> }) {
  const [{ locale }, sp] = await Promise.all([params, searchParams])
  const preview = sp.preview === '1'
  const filter = { format: sp.format || null, d: sp.d && DISCIPLINE[sp.d] ? sp.d : null, thema: sp.thema || null }

  const wantFrameworks = (!filter.format || filter.format === 'framework') && filter.d !== 'leadership' && !filter.thema
  const [posts, tags, fws] = await Promise.all([
    listPosts({ limit: 48, includeDrafts: preview, locale, format: filter.format, authors: filter.d ? DISCIPLINE[filter.d] : null, tag: filter.thema }),
    topTags(8),
    wantFrameworks ? frameworkCards(8) : Promise.resolve([]),
  ])

  const items: HubItem[] = posts.map(postToItem)
  // Frameworks hinten anhaengen — Beitraege bleiben vorn, Frameworks fuellen das Raster.
  for (const f of fws) {
    items.push({
      key: `fw-${f.slug}`, href: `/frameworks/${f.slug}`, title: f.title.split(' — ')[0], excerpt: f.excerpt, image: f.image,
      author: AUTHORS.markus, format: 'framework', date: null, minutes: null, tags: [], badge: 'mit AI-Agent',
    })
  }
  return <StoriesHub items={items} filter={filter} tags={tags} preview={preview} />
}
