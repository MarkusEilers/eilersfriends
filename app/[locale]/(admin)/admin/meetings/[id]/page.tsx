import { notFound } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { meetingView } from '@/lib/meetings/queries'
import { MeetingHeader } from '@/components/meetings/MeetingHeader'
import { Decisions } from '@/components/meetings/Decisions'
import { Boards } from '@/components/meetings/Boards'
import { MeetingTools } from '@/components/meetings/MeetingTools'
import { MeetingCreate } from '@/components/meetings/MeetingCreate'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === 'neu') {
    const orgs = (await db.execute(sql`
      SELECT c.id, c.name FROM companies c ORDER BY c.name LIMIT 200`)) as unknown as
      Array<{ id: string; name: string }>
    const series = (await db.execute(sql`
      SELECT s.id, s.name, s.org_id FROM meeting_series s ORDER BY s.created_at DESC LIMIT 200`)) as unknown as
      Array<{ id: string; name: string; org_id: string }>
    return (
      <div>
        <Link href={'/admin/meetings' as '/'} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900">
          <ArrowLeft size={13} /> Alle Termine
        </Link>
        <MeetingCreate orgs={orgs} series={series} />
      </div>
    )
  }

  const view = await meetingView(id)
  if (!view) notFound()

  return (
    <div className="space-y-5">
      <Link href={'/admin/meetings' as '/'} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900">
        <ArrowLeft size={13} /> Alle Termine
      </Link>

      <MeetingHeader meeting={view.meeting} participants={view.participants} />

      {view.previous.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Davor</span>
          {view.previous.map((p) => (
            <Link
              key={String(p.id)} href={`/admin/meetings/${p.id}` as '/'}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600 hover:bg-gray-200"
            >
              {new Date(String(p.starts_at)).toLocaleDateString('de-DE')} · {String(p.title)}
            </Link>
          ))}
        </div>
      )}

      {view.meeting.series_id ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Themen und Aktivitäten</h3>
            <p className="text-[11px] text-gray-400">Gehört der Reihe — der nächste Termin sieht denselben Stand.</p>
          </div>
          <Boards
            boards={view.boards as never}
            seriesId={String(view.meeting.series_id)}
            meetingId={String(view.meeting.id)}
          />
        </section>
      ) : (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Dieser Termin gehört zu keiner Reihe — es gibt daher keine Bretter, die mitlaufen.
        </p>
      )}

      <Decisions decisions={view.decisions} />

      <MeetingTools
        meetingId={String(view.meeting.id)}
        shareToken={String(view.meeting.share_token ?? '')}
        status={String(view.meeting.status)}
        summary={(view.meeting.summary as string) ?? ''}
        transcript={(view.meeting.transcript as string) ?? ''}
        participants={view.participants as never}
      />
    </div>
  )
}
