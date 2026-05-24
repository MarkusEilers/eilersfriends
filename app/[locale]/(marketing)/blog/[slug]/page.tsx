import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PostRow extends Record<string, unknown> {
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  og_image: string | null
  author: string | null
  reading_minutes: number | null
  published_at: string | null
}

async function loadPost(slug: string): Promise<PostRow | null> {
  try {
    const res = await db.execute<PostRow>(sql`
      SELECT slug, title, excerpt, content, og_image, author, reading_minutes,
             published_at::text as published_at
      FROM blog_posts
      WHERE slug = ${slug} AND status = 'published'
      LIMIT 1
    `)
    const arr = res as unknown as PostRow[]
    return arr[0] ?? null
  } catch { return null }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await loadPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.og_image ? [{ url: post.og_image }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await loadPost(slug)
  if (!post) notFound()

  return (
    <article className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-12" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-3xl">
          <Link href={'/blog' as '/'} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6">
            <ArrowLeft size={12} /> Zurück zur Übersicht
          </Link>
          {post.published_at && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {new Date(post.published_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
              {post.reading_minutes ? ` · ${post.reading_minutes} Min Lesezeit` : ''}
            </p>
          )}
          <h1 className="mt-3 text-4xl font-bold text-gray-900 sm:text-5xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-gray-600">{post.excerpt}</p>
          )}
          {post.author && (
            <p className="mt-6 text-sm text-gray-500">von {post.author}</p>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        {post.content ? (
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          <p className="text-gray-500">Noch kein Inhalt verfügbar.</p>
        )}
      </main>
    </article>
  )
}
