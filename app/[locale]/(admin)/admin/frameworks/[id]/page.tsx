import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { DEFAULT_CARD_META, mergedMeta, type Deliverable } from '@/lib/db/queries/framework-meta'
import { saveFrameworkMetaAction } from '@/lib/actions/framework-meta'
import { FrameworkImageGenerator } from '@/components/admin/FrameworkImageGenerator'
import { FRAMEWORK_PROMPTS } from '@/lib/data/framework-prompts'

interface PageProps {
  params: Promise<{ id: string }>
}

const ICON_OPTIONS: Deliverable['icon'][] = ['FileDown', 'Video', 'ClipboardList', 'Wand2', 'BookOpen', 'Sparkles']

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

  const meta = mergedMeta(row.slug, row.cardMeta as Parameters<typeof mergedMeta>[1])
  const deliverables = meta.deliverables ?? []
  // Pad to 5 rows for the form
  while (deliverables.length < 5) deliverables.push({ icon: 'FileDown', label: '' })

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
        {/* Form */}
        <form action={saveFrameworkMetaAction} className="space-y-6">
          <input type="hidden" name="slug" value={row.slug} />

          {/* Poster section */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
              Poster auf der Card
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Diese Texte erscheinen auf dem Cover-Bild — auf der Startseite, der /frameworks-Liste und der Detail-Seite.
            </p>

            <Field label="Poster-Titel (Bold UPPERCASE — Zeilenumbruch mit \n)" name="posterTitle" type="textarea" rows={2} defaultValue={meta.posterTitle ?? ''} mono />
            <Field label="Poster-Subtitle (kleinere UPPERCASE-Zeile darunter)" name="posterSubtitle" defaultValue={meta.posterSubtitle ?? ''} />
            <Field label="Agent-Label (Glass-Pill oben links auf der Card)" name="agentLabel" defaultValue={meta.agentLabel ?? ''} />
            <Field label="Tagline (kleine Zeile unter dem Card-Body-Titel)" name="tagline" defaultValue={meta.tagline ?? ''} />
          </section>

          {/* Tone palette */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
              Farben (Tone-Palette)
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Verlauf auf der Card: tone.from → tone.to. Accent wird für die Sub-Zeile und das Eck-Glow genutzt.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <ColorField label="From" name="toneFrom" defaultValue={meta.tone?.from ?? '#0F1E3A'} />
              <ColorField label="To" name="toneTo" defaultValue={meta.tone?.to ?? '#1A5FD4'} />
              <ColorField label="Accent" name="toneAccent" defaultValue={meta.tone?.accent ?? '#5DDBF5'} />
            </div>
          </section>

          {/* Deliverables */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
              Deliverables auf /frameworks
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Bis zu 5 Bullet-Items mit Icon + Label. Werden auf der /frameworks-Listing-Card als „Was Du bekommst" angezeigt.
            </p>
            <div className="space-y-3">
              {deliverables.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    name={`deliverable_${i}_icon`}
                    defaultValue={d.icon}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name={`deliverable_${i}_label`}
                    defaultValue={d.label}
                    placeholder={`Deliverable ${i + 1} (leer = ausblenden)`}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A5FD4' }}
            >
              <Save size={14} /> Speichern
            </button>
            <Link
              href={`/frameworks/${row.slug}`}
              target="_blank"
              className="text-xs font-semibold text-gray-500 underline hover:text-gray-900"
            >
              Auf der Live-Seite ansehen ↗
            </Link>
          </div>
        </form>

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

function Field({
  label, name, defaultValue, type = 'text', rows = 1, mono,
}: {
  label: string
  name: string
  defaultValue: string
  type?: 'text' | 'textarea'
  rows?: number
  mono?: boolean
}) {
  const cls = `mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 ${mono ? 'font-mono' : ''}`
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-700">{label}</label>
      {type === 'textarea' ? (
        <textarea name={name} defaultValue={defaultValue} rows={rows} className={cls} />
      ) : (
        <input type="text" name={name} defaultValue={defaultValue} className={cls} />
      )}
    </div>
  )
}

function ColorField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</label>
      <div className="flex gap-1.5 items-center">
        <input type="color" name={name + '__pick'} defaultValue={defaultValue} className="h-9 w-9 rounded border border-gray-200 cursor-pointer"
               onChange={undefined /* uncontrolled visual picker — value below is what's submitted */} />
        <input
          type="text"
          name={name}
          defaultValue={defaultValue}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-mono"
        />
      </div>
    </div>
  )
}
