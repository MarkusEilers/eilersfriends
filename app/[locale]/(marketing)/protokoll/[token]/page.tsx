import { notFound } from 'next/navigation'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { meetingView } from '@/lib/meetings/queries'
import { MeetingHeader } from '@/components/meetings/MeetingHeader'
import { Decisions } from '@/components/meetings/Decisions'
import { Boards } from '@/components/meetings/Boards'
import { FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Das verteilte Protokoll.
 *
 * Es zeigt das lebende Brett, nicht die Momentaufnahme — genau darum geht es:
 * Zwischen zwei Terminen soll hier gearbeitet werden. Was am Tag des Termins
 * galt, liegt als eingefrorener Stand daneben und geht nicht verloren.
 */
export default async function ProtokollPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const rows = await db.execute(sql`
    SELECT meeting_id, name, email FROM meeting_participants WHERE token = ${token} LIMIT 1`)
  const p = (rows as unknown as { meeting_id: string; name: string | null; email: string }[])[0]
  if (!p) notFound()

  await db.execute(sql`
    UPDATE meeting_participants SET opened_at = COALESCE(opened_at, now()) WHERE token = ${token}`)

  const view = await meetingView(p.meeting_id)
  if (!view) notFound()

  return (
    <main className="min-h-screen px-6 py-10" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
          Protokoll · angemeldet als {p.name ?? p.email}
        </div>

        <MeetingHeader meeting={view.meeting} participants={view.participants} />

        {view.meeting.summary ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              <FileText size={12} /> Zusammenfassung
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700">
              {String(view.meeting.summary)}
            </p>
          </section>
        ) : null}

        <Decisions decisions={view.decisions} />

        {view.meeting.series_id ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Themen und Aktivitäten</h3>
              <p className="text-[11px] text-gray-400">
                Läuft weiter — was Ihr hier bewegt, steht beim nächsten Termin an der neuen Stelle.
              </p>
            </div>
            <Boards
              boards={view.boards as never}
              seriesId={String(view.meeting.series_id)}
              meetingId={String(view.meeting.id)}
              token={token}
            />
          </section>
        ) : null}

        <p className="pb-8 text-center text-[11px] text-gray-400">
          Dieser Zugang gehört zu {p.email}. Jede Bewegung wird mit Namen im Verlauf festgehalten.
        </p>
      </div>
    </main>
  )
}
