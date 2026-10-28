import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { BlogHome } from '@/components/blog/BlogHome'
import { listPosts, countsByAuthor } from '@/lib/blog/posts'
import { AUTHORS } from '@/lib/blog/authors'

export const dynamic = 'force-dynamic'

const author = AUTHORS.aljona

export const metadata: Metadata = {
  title: `Blog von ${author.name}`,
  description: author.bio,
}

export default async function AuthorBlogPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ preview?: string }> }) {
  const [{ locale }, sp] = await Promise.all([params, searchParams])
  const [posts, counts] = await Promise.all([
    listPosts({ author: author.slug, limit: 24, includeDrafts: (sp.preview === '1' && await isEditor()), locale }),
    countsByAuthor(),
  ])
  return <BlogHome posts={posts} author={author} counts={counts} />
}

/** Entwürfe nur für Admin und Coach — sonst wäre ?preview=1 eine offene Tür. */
async function isEditor() {
  const s = await auth().catch(() => null)
  return s?.user?.role === 'admin' || s?.user?.role === 'coach'
}
