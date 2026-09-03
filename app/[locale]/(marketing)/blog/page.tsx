import type { Metadata } from 'next'
import { BlogHome } from '@/components/blog/BlogHome'
import { listPosts, countsByAuthor } from '@/lib/blog/posts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog · Was wir diese Woche gelernt haben',
  description:
    'Zwei Handschriften, ein Absender. Markus Eilers über Angebote, Pfade und Garantien. Aljona Eilers über Führung, Selbstführung und Kultur.',
}

export default async function BlogIndexPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ locale }, sp] = await Promise.all([params, searchParams])
  const preview = sp.preview === '1'
  const [posts, counts] = await Promise.all([
    listPosts({ limit: 24, includeDrafts: preview, locale }),
    countsByAuthor(),
  ])
  return <BlogHome posts={posts} counts={counts} />
}
