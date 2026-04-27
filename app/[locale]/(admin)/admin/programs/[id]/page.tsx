import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { programs, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ChevronLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { id } = await params
  let program: typeof programs.$inferSelect | null = null
  let coachName: string | null = null
  try {
    const [row] = await db.select().from(programs).where(eq(programs.id, id)).limit(1)
    if (!row) notFound()
    program = row
    if (row.coachId) {
      const [coach] = await db.select().from(users).where(eq(users.id, row.coachId)).limit(1)
      coachName = coach?.name ?? null
    }
  } catch { notFound() }

  const p = program!

  return (
    <div>
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft size={14} /> Zurück zur Übersicht
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
      <p className="text-xs text-gray-400 font-mono mt-1">/{p.slug}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Typ" value={p.type} />
        <Field label="Status" value={p.status} />
        <Field label="CTA-Typ" value={p.ctaType ?? '—'} />
        <Field label="Sprache" value={p.locale} />
        <Field label="Coach" value={coachName ?? '—'} />
        <Field label="Max. Teilnehmer" value={p.maxParticipants?.toString() ?? '—'} />
        <Field label="Preis" value={p.price ? `€${p.price}` : '—'} />
        <Field label="Erstellt" value={new Date(p.createdAt).toLocaleString('de-DE')} />
        <Field label="Aktualisiert" value={new Date(p.updatedAt).toLocaleString('de-DE')} />
      </div>

      {p.description && (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Beschreibung</p>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{p.description}</p>
        </div>
      )}

      <div className="mt-8 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
        <p className="text-sm font-medium text-gray-500">
          Editor für Module / Lessons / Sektionen folgt im nächsten Schritt.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Hier wird der CMS-ähnliche Editor mit Drag-Reorder für Module + Lessons +
          Skill-Mappings entstehen — analog zum LandingPage-Editor.
        </p>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}
