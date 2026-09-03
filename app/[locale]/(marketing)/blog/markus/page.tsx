import type { Metadata } from 'next'
import { BlogHome } from '@/components/blog/BlogHome'
import { listPosts, countsByAuthor } from '@/lib/blog/posts'
import { AUTHORS } from '@/lib/blog/authors'

export const dynamic = 'force-dynamic'

const author = AUTHORS.markus

export const metadata: Metadata = {
  title: `Blog von ${author.name}`,
  description: author.bio,
}

export default async function AuthorBlogPage({
  searchParams,
}: { searchParams: Promise<{ preview?: string }> }) {
  const sp = await searchParams
  const [posts, counts] = await Promise.all([
    listPosts({ author: author.slug, limit: 24, includeDrafts: sp.preview === '1' }),
    countsByAuthor(),
  ])
  return <BlogHome posts={posts} author={author} counts={counts} />
}
