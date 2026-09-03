import { notFound } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { getById, knownTags } from '@/lib/blog/admin'
import { translationsOf } from '@/lib/blog/posts'
import { PostEditor, type EditorPost } from '@/components/blog/admin/PostEditor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === 'neu'
  const post = isNew ? null : await getById(id)
  if (!isNew && !post) notFound()

  const tags = (await knownTags(post?.author_slug)).map((t) => t.tag)
  const siblings = post ? await translationsOf(post.id) : []

  const initial: EditorPost | null = post
    ? {
        id: post.id, title: post.title, subtitle: post.subtitle ?? '', excerpt: post.excerpt ?? '',
        content: post.content ?? '', author_slug: post.author_slug, tags: post.tags ?? [],
        hero_image: post.hero_image, hero_alt: post.hero_alt, image_prompt: post.image_prompt,
        status: post.status as EditorPost['status'], published_at: post.published_at,
        comments_open: post.comments_open ?? true, slug: post.slug,
        locale: post.locale ?? 'de', translation_of: post.translation_of ?? null,
      }
    : null

  return (
    <div>
      <Link href={'/admin/blog' as '/'} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900">
        <ArrowLeft size={13} /> Alle Beiträge
      </Link>
      <PostEditor initial={initial} knownTags={tags} siblings={siblings} />
    </div>
  )
}
