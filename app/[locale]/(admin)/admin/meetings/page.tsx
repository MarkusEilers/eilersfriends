import { Link } from '@/lib/i18n/navigation'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { CalendarDays, Repeat, Plus } from 'lucide-react'
import { ensureMeetingSchema } from '@/lib/meetings/schema'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminMeetingsPage() {
  await ensureMeetingSchema()

  const orgs = (await db.execute(sql`
    SELECT c.id, c.name,
      (SELECT COUNT(*)::int FROM meeting_series s WHERE s.org_id = c.id) AS series,
      (SELECT COUNT(*)::int FROM meetings m WHERE m.org_id = c.id) AS meetings,
      (SELECT MAX(m.starts_at) FROM meetings m WHERE m.org_id = c.id) AS last_meeting
    FROM companies c
    ORDER BY (SELECT MAX(m.starts_at) FROM meetings m WHERE m.org_id = c.id) DESC NULLS LAST, c.name
    LIMIT 50`)) as unknown as Array<{
      id: string; name: string; series: number; meetings: number; last_meeting: string | null
    }>

  const recent = (await db.execute(sql`
    SELECT m.id, m.title, m.starts_at, m.status, s.name AS series_name, c.name AS org_name,
      (SELECT COUNT(*)::int FROM meeting_participants p WHERE p.meeting_id = m.id) AS participants
    FROM meetings m
    LEFT JOIN meeting_series s ON s.id = m.series_id
    LEFT JOIN companies c ON c.id = m.org_id
    ORDER BY m.starts_at DESC LIMIT 20`)) as unknown as Array<Record<string, unknown>>

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
            <CalendarDays size={12} /> Besprechungen
          </span>
          <h1 className="mt-1.5 text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Termine hängen an einer Organisation. Wer zu einer Reihe gehört, erbt deren Bretter.
          </p>
        </div>
        <Link
          href={'/admin/meetings/neu' as '/'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          <Plus size={14} /> Neuer Termin
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {recent.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">Noch kein Termin angelegt.</div>
          ) : (
            <ul>
              {recent.map((m) => (
                <li key={String(m.id)} className="border-b border-gray-50 last:border-0">
                  <Link href={`/admin/meetings/${m.id}` as '/'} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/60">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-900">{String(m.title)}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                        {m.series_name ? (
                          <span className="inline-flex items-center gap-1 text-blue-600">
                            <Repeat size={10} /> {String(m.series_name)}
                          </span>
                        ) : null}
                        <span>{String(m.org_name ?? '—')}</span>
                        <span>{String(m.participants)} Teilnehmer</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-gray-400">
                      <div>{new Date(String(m.starts_at)).toLocaleDateString('de-DE')}</div>
                      <div className="mt-0.5 font-semibold text-gray-500">{String(m.status)}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Organisationen</div>
          <ul className="mt-2 space-y-1">
            {orgs.slice(0, 15).map((o) => (
              <li key={o.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50">
                <span className="min-w-0 flex-1 truncate text-gray-700">{o.name}</span>
                <span className="shrink-0 text-[11px] text-gray-400">
                  {o.series > 0 ? `${o.series} Reihen · ` : ''}{o.meetings}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
