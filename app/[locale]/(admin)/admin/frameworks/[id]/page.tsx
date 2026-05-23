import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { mergedMeta, type CardMeta } from '@/lib/db/queries/framework-meta'
import { FrameworkImageGenerator } from '@/components/admin/FrameworkImageGenerator'
import { FrameworkMetaForm } from '@/components/admin/FrameworkMetaForm'
import { FRAMEWORK_PROMPTS } from '@/lib/data/framework-prompts'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminFrameworkEditPage({ params }: PageProps) {
  const { id } = await params

  // id might be the UUID or the slug — try both
  let row = null
  try {
    const [byId] = await db.select().from(landingPages).where(eq(landingPages.id, id)).limit(1)
    row = byId ?? null
  } catch {}
  if (!row) {
    try {
      const [bySlug] = await db.select().from(landingPages).where(eq(landingPages.slug, id)).limit(1)
      row = bySlug ?? null
    } catch {}
  }
  if (!row) redirect('/admin/frameworks')

  const meta = mergedMeta(row.slug, row.cardMeta as CardMeta | null)

  return (
    <div>
      <Link
        href="/admin/frameworks"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={12} /> Zurück zur Übersicht
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{row.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          <code className="text-xs font-mono">/frameworks/{row.slug}</code>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Form — client wrapper with useActionState */}
        <FrameworkMetaForm
          slug={row.slug}
          meta={meta}
          liveHref={`/frameworks/${row.slug}`}
        />

        {/* Sidebar — image generator */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">
              Bilder
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Card- + Hero-Bild generieren oder regenerieren.
            </p>
            <FrameworkImageGenerator
              slug={row.slug}
              heroPrompt={FRAMEWORK_PROMPTS[row.slug]?.hero ?? ''}
              cardPrompt={FRAMEWORK_PROMPTS[row.slug]?.card ?? ''}
              hasImage={!!row.ogImageUrl}
            />
            {row.ogImageUrl && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  Aktuelles Card-Bild
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.ogImageUrl}
                  alt={row.title}
                  className="w-full rounded-lg border border-gray-100"
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">
              Schnellzugriff
            </h2>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href={`/admin/landing-pages/${row.id}`} className="text-blue-600 underline">
                  Body-Sections editieren (LP-Editor)
                </Link>
              </li>
              <li>
                <Link href={`/frameworks/${row.slug}`} target="_blank" className="text-blue-600 underline">
                  Detail-Seite öffnen ↗
                </Link>
              </li>
              <li>
                <Link href={`/admin/frameworks`} className="text-gray-500 underline">
                  Zurück zur Übersicht
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
