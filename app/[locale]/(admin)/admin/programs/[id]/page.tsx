import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ChevronLeft } from 'lucide-react'

interface PageProps { params: Promise<{ id: string }> }

interface TrackStep { title?: string; durationH?: number | string; description?: string; teams?: string[]; inputs?: string[]; outputs?: string[] }
interface TrackPhase { name?: string; goal?: string; steps?: TrackStep[] }
interface Row {
  id: string; name: string; slug: string; type: string; is_published: boolean
  category: string | null; created_at: string; updated_at: string
  track: TrackPhase[]; coach_name: string | null
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { id } = await params
  let row: Row | null = null
  try {
    const res = await db.execute(sql`
      SELECT p.id, p.name, p.slug, p.type, p.is_published, p.category,
             p.created_at, p.updated_at, COALESCE(p.track, '[]'::jsonb) AS track, u.name AS coach_name
      FROM programs p LEFT JOIN users u ON u.id = p.coach_id
      WHERE p.id = ${id} LIMIT 1
    `)
    row = (res as unknown as Row[])[0] ?? null
  } catch { row = null }
  if (!row) notFound()

  const p = row
  const track = Array.isArray(p.track) ? p.track : []
  const totalSteps = track.reduce((n, ph) => n + (ph.steps?.length ?? 0), 0)

  return (
    <div>
      <Link href="/admin/programs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={14} /> Zurück zur Übersicht
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
      <p className="text-xs text-gray-400 font-mono mt-1">/{p.slug}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Typ" value={p.type} />
        <Field label="Status" value={p.is_published ? 'Veröffentlicht' : 'Entwurf'} />
        <Field label="Kategorie" value={p.category ?? '—'} />
        <Field label="Coach" value={p.coach_name ?? '—'} />
        <Field label="Erstellt" value={new Date(p.created_at).toLocaleString('de-DE')} />
        <Field label="Aktualisiert" value={new Date(p.updated_at).toLocaleString('de-DE')} />
      </div>

      {/* Track-Übersicht */}
      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Bausteine-Track</p>
          <p className="text-xs text-gray-400">{track.length} Phasen · {totalSteps} Bausteine</p>
        </div>
        {track.length === 0 ? (
          <p className="text-sm text-gray-400">Noch kein Track hinterlegt.</p>
        ) : (
          <div className="space-y-5">
            {track.map((ph, pi) => (
              <div key={pi}>
                <h3 className="text-sm font-bold text-gray-900">{pi + 1}. {ph.name}{ph.steps?.length ? ` · ${ph.steps.length} Bausteine` : ''}</h3>
                {ph.goal && <p className="text-xs text-gray-500">{ph.goal}</p>}
                <ul className="mt-2 space-y-1 border-l-2 border-blue-100 pl-3">
                  {(ph.steps ?? []).map((st, si) => (
                    <li key={si} className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-800">{st.title}</span>{st.durationH ? ` · ${st.durationH}h` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
        <p className="text-sm font-medium text-gray-500">Voll editierbarer Programm-Editor (Track, Module, Preise) folgt.</p>
        <p className="mt-2 text-xs text-gray-400">Der Track wird aktuell direkt im Angebot befüllt (Picker „Programm-Track hinzufügen").</p>
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
