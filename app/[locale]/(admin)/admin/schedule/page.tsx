import { PERSONS, TEAM, WORK, entityFor } from '@/lib/schedule/config'
import { getConnectionStatus } from '@/lib/schedule/store'
import { graphConfigured } from '@/lib/schedule/graph'
import { listEventTypes, listHostProfiles } from '@/lib/schedule/types-store'
import { EventTypeEditor } from '@/components/admin/EventTypeEditor'
import { CalendarClock, CheckCircle2, AlertCircle, PlugZap } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function AdminSchedulePage({ searchParams }: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const sp = await searchParams
  const configured = graphConfigured()
  const statuses = await Promise.all(PERSONS.map(async (p) => ({ p, conn: configured ? await getConnectionStatus(p.slug).catch(() => null) : null })))
  const [types, hostProfiles] = await Promise.all([listEventTypes().catch(() => []), listHostProfiles().catch(() => [])])

  const owners = [...PERSONS.map(p => ({ slug: p.slug, name: p.name })), { slug: TEAM.slug, name: entityFor(TEAM.slug)?.name || TEAM.name }]
  const hosts = PERSONS.map(p => {
    const hp = hostProfiles.find(h => h.personSlug === p.slug)
    return { personSlug: p.slug, avatarUrl: hp?.avatarUrl || '', intro: hp?.intro || '' }
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Terminbuchung</h1>
        <p className="mt-1 text-sm text-gray-500">Kalender-Verbindungen, Event-Typen und Verfügbarkeits-Regeln für die Online-Buchung.</p>
      </div>

      {sp.connected && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Kalender für <strong>{sp.connected}</strong> verbunden.</div>}
      {sp.error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Verbindung fehlgeschlagen ({sp.error}). Bitte erneut versuchen.</div>}

      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: configured ? '#EBF7EE' : '#FFF4E5' }}>
          <PlugZap size={18} style={{ color: configured ? '#157A45' : '#B07C0A' }} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Microsoft-Graph-App</p>
          <p className="text-xs text-gray-500">{configured ? 'Konfiguriert — Personen können verbunden werden.' : 'Noch nicht konfiguriert: MS_CLIENT_ID / MS_CLIENT_SECRET / MS_TENANT_ID in Vercel setzen.'}</p>
        </div>
        <span className={'rounded-full px-3 py-1 text-xs font-bold ' + (configured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>{configured ? 'Bereit' : 'Nicht konfiguriert'}</span>
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">Kalender-Verbindungen</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {statuses.map(({ p, conn }) => {
          const connected = conn?.status === 'connected'
          return (
            <div key={p.slug} className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF' }}><CalendarClock size={18} style={{ color: '#1A5FD4' }} /></span>
                  <div><p className="text-sm font-bold text-gray-900">{p.name}</p><p className="text-xs text-gray-400">{p.email}</p></div>
                </div>
                {connected
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700"><CheckCircle2 size={12} /> verbunden</span>
                  : <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500"><AlertCircle size={12} /> nicht verbunden</span>}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">{connected && conn?.connectedAt ? `seit ${new Date(conn.connectedAt).toLocaleDateString('de-DE')}` : 'Kalender für Online-Buchung freigeben'}</span>
                <a href={configured ? `/api/schedule/oauth/start?person=${p.slug}` : undefined} aria-disabled={!configured}
                  className={'rounded-full px-4 py-1.5 text-xs font-semibold text-white ' + (configured ? 'bg-[#1A5FD4] hover:opacity-90' : 'pointer-events-none bg-gray-300')}>
                  {connected ? 'Neu verbinden' : 'Verbinden'}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <h2 className="mb-4 mt-10 text-sm font-bold uppercase tracking-widest text-gray-400">Event-Typen</h2>
      <EventTypeEditor owners={owners} types={types} hosts={hosts} />

      <p className="mt-8 text-xs text-gray-400">Arbeitszeiten: Mo–Fr {WORK.startHour}:00–{WORK.endHour}:00 ({WORK.tz}), {WORK.leadHours} h Vorlauf, {WORK.horizonDays} Tage Horizont. Puffer &amp; Tageslimit je Event-Typ oben einstellbar.</p>
    </div>
  )
}
