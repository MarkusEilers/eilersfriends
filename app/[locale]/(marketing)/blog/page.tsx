import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { BookOpen, ArrowRight, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog · Coaching-Lehren der Woche',
  description:
    'Wöchentliche Lehren aus dem Coaching mit B2B-Gründer:innen — Angebote, Pfade, Beweise, Garantien. Keine Marketing-Lehrbuch-Posts.',
}

interface PostRow extends Record<string, unknown> {
  slug: string
  title: string
  excerpt: string | null
  published_at: string | null
  og_image: string | null
  reading_minutes: number | null
  author: string | null
}

async function ensureBlogSchema() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(160) UNIQUE NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT,
        og_image TEXT,
        author VARCHAR(64) DEFAULT 'Markus Eilers',
        reading_minutes INTEGER,
        status VARCHAR(16) DEFAULT 'draft' NOT NULL,
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
      )
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON blog_posts (published_at DESC)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts (status)`)
  } catch (err) {
    console.error('[blog] ensure schema failed', err)
  }
}

export default async function BlogIndexPage() {
  await ensureBlogSchema()

  let posts: PostRow[] = []
  try {
    const res = await db.execute<PostRow>(sql`
      SELECT slug, title, excerpt, published_at::text as published_at, og_image,
             reading_minutes, author
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 30
    `)
    posts = res as unknown as PostRow[]
  } catch { posts = [] }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Hero */}
      <section className="px-6 py-20 sm:py-28" style={{ background: 'linear-gradient(180deg, #0F1E3A 0%, #15315E 100%)' }}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#5DDBF5' }}>
            Eilers+Friends Briefing
          </p>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Coaching-Lehren der Woche.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Jeden Donnerstag schreibt Markus, was er in dieser Woche im Coaching mit B2B-Unternehmern gelernt hat.
            Über Angebote, die sich von selbst verkaufen. Über Pfade, die im Vorstand verteidigt werden.
            Über Garantien, die Du beim Espresso aussprechen kannst.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={'/#newsletter' as '/'} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 hover:opacity-90">
              <Mail size={14} /> Newsletter abonnieren
            </Link>
          </div>
        </div>
      </section>

      {/* Posts list */}
      <main className="mx-auto max-w-5xl px-6 py-16">
        {posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-16 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: '#EBF1FF' }}>
              <BookOpen size={22} style={{ color: '#1A5FD4' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Bald geht's los.</h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-600">
              Die ersten Briefings werden hier veröffentlicht — solange:{' '}
              <Link href={'/#newsletter' as '/'} className="font-semibold text-blue-600 underline">trag Dich für den Donnerstag-Newsletter ein</Link>.
              Die ersten Ausgaben kommen direkt in Deine Inbox.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3 text-left">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bald</p>
                <h3 className="mt-2 text-sm font-bold text-gray-900">Beef-Radar: was Dein CFO wirklich hört</h3>
                <p className="mt-1 text-xs text-gray-500">Warum „150 Jahre Erfahrung" einen Deal kippt</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bald</p>
                <h3 className="mt-2 text-sm font-bold text-gray-900">Doppelschmerz: heute und morgen</h3>
                <p className="mt-1 text-xs text-gray-500">Warum strategische Angebote teurer verkaufen</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bald</p>
                <h3 className="mt-2 text-sm font-bold text-gray-900">Espresso-Test für Deine Garantie</h3>
                <p className="mt-1 text-xs text-gray-500">Wort-Garantie statt Marketing-Schwur</p>
              </div>
            </div>
          </div>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}` as '/'} className="group block rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg">
                  {post.published_at && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {new Date(post.published_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {post.reading_minutes ? ` · ${post.reading_minutes} Min Lesezeit` : ''}
                    </p>
                  )}
                  <h2 className="mt-2 text-2xl font-bold text-gray-900 group-hover:text-blue-700" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-3 text-base leading-relaxed text-gray-600">{post.excerpt}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                    Weiterlesen <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
