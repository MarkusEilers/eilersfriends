import { Calendar, MapPin, Users, Repeat } from 'lucide-react'

export function MeetingHeader({
  meeting, participants, accent = '#1A5FD4',
}: {
  meeting: Record<string, unknown>
  participants: Array<Record<string, unknown>>
  accent?: string
}) {
  const start = meeting.starts_at ? new Date(String(meeting.starts_at)) : null
  return (
    <header className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {meeting.series_name ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: `${accent}14`, color: accent }}
            >
              <Repeat size={11} /> {String(meeting.series_name)}
            </span>
          ) : null}
          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{String(meeting.title)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {start && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} />
                {start.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}
                {start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {meeting.location ? (
              <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {String(meeting.location)}</span>
            ) : null}
            {meeting.org_name ? <span className="text-gray-400">{String(meeting.org_name)}</span> : null}
          </div>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            <Users size={11} /> {participants.length} Teilnehmer
          </div>
          <div className="mt-1.5 flex flex-wrap justify-end gap-1">
            {participants.map((p) => (
              <span
                key={String(p.id)}
                title={String(p.email)}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
              >
                {String(p.name ?? p.email)}
                {p.role === 'leitung' ? ' ·  Leitung' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
