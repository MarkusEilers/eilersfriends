import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { desc, eq, ilike, or, count } from 'drizzle-orm'
import {
  Users, CheckCircle, Clock, Ban, AlertTriangle,
  Search, Mail, MoreHorizontal,
} from 'lucide-react'
import { setSubscriberStatus, deleteSubscriber } from '@/lib/actions/subscribers'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function SubscribersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.q?.trim() ?? ''
  const statusFilter = params.status

  // Build query
  const conditions = []
  if (search) {
    conditions.push(
      or(
        ilike(newsletterSubscribers.email, `%${search}%`),
        ilike(newsletterSubscribers.firstName, `%${search}%`),
      ),
    )
  }
  if (statusFilter && ['pending', 'active', 'unsubscribed', 'bounced'].includes(statusFilter)) {
    conditions.push(eq(newsletterSubscribers.status, statusFilter as 'pending' | 'active' | 'unsubscribed' | 'bounced'))
  }

  let rows: (typeof newsletterSubscribers.$inferSelect)[] = []
  let totals = { all: 0, active: 0, pending: 0, unsubscribed: 0, bounced: 0 }
  try {
    rows = await db
      .select()
      .from(newsletterSubscribers)
      .where(conditions.length ? conditions.length === 1 ? conditions[0] : (await import('drizzle-orm')).and(...conditions) : undefined)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(200)

    // Stats (separate query — over all rows, not filtered)
    const stats = await db
      .select({
        status: newsletterSubscribers.status,
        n: count(),
      })
      .from(newsletterSubscribers)
      .groupBy(newsletterSubscribers.status)
    for (const s of stats) {
      const v = Number(s.n) || 0
      totals.all += v
      if (s.status === 'active') totals.active = v
      if (s.status === 'pending') totals.pending = v
      if (s.status === 'unsubscribed') totals.unsubscribed = v
      if (s.status === 'bounced') totals.bounced = v
    }
  } catch (_) {}

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriber</h1>
          <p className="mt-1 text-sm text-gray-500">
            Newsletter-Anmeldungen verwalten — DOI-Status, Beehiiv-Sync, manuelle Aktionen.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-8">
        <StatCard label="Gesamt"          value={totals.all}          color="#0F1E3A" icon={Users} />
        <StatCard label="Aktiv"           value={totals.active}       color="#157A45" icon={CheckCircle} />
        <StatCard label="Pending DOI"     value={totals.pending}      color="#B07C0A" icon={Clock} />
        <StatCard label="Abgemeldet"     value={totals.unsubscribed} color="#6B7280" icon={Ban} />
        <StatCard label="Bounced"         value={totals.bounced}      color="#D4192B" icon={AlertTriangle} />
      </div>

      {/* Filters */}
      <form className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Email oder Name suchen…"
            className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-orange-400"
          />
        </div>
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <button
          type="submit"
          className="rounded-full px-4 py-2 text-xs font-semibold text-white"
          style={{ backgroundColor: '#F05A1A' }}
        >
          Suchen
        </button>
        <div className="flex flex-wrap gap-1.5 ml-auto">
          <FilterChip current={statusFilter} value={undefined} q={search}>Alle</FilterChip>
          <FilterChip current={statusFilter} value="active" q={search}>Aktiv</FilterChip>
          <FilterChip current={statusFilter} value="pending" q={search}>Pending</FilterChip>
          <FilterChip current={statusFilter} value="unsubscribed" q={search}>Abgemeldet</FilterChip>
          <FilterChip current={statusFilter} value="bounced" q={search}>Bounced</FilterChip>
        </div>
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <Mail size={32} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Keine Subscriber gefunden.</p>
          <p className="mt-1 text-xs text-gray-400">
            {search || statusFilter
              ? 'Suche/Filter ändern oder löschen.'
              : 'Sobald jemand das Newsletter-Formular abschickt, erscheint er/sie hier.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/60">
              <tr className="text-left text-xs font-bold uppercase tracking-widest text-gray-500">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Quelle</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">DOI</th>
                <th className="px-5 py-3">Beehiiv</th>
                <th className="px-5 py-3">Erstellt</th>
                <th className="px-5 py-3 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{s.email}</td>
                  <td className="px-5 py-3 text-gray-600">{s.firstName ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{s.source ?? '—'}</span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {s.doiConfirmedAt
                      ? <span className="text-green-700">✓ {new Date(s.doiConfirmedAt).toLocaleDateString('de-DE')}</span>
                      : s.doiSentAt
                        ? <span className="text-amber-700">gesendet</span>
                        : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {s.beehiivId
                      ? <span className="text-blue-700">✓ synced</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RowActions id={s.id} status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 200 && (
            <p className="px-5 py-3 text-xs text-gray-400 text-center border-t border-gray-100">
              Anzeige limitiert auf 200 — verfeinere Suche/Filter für mehr.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label, value, color, icon: Icon,
}: {
  label: string
  value: number
  color: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function FilterChip({
  current, value, q, children,
}: {
  current?: string
  value?: string
  q?: string
  children: React.ReactNode
}) {
  const isActive = current === value || (!current && !value)
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (value) params.set('status', value)
  const href = `/admin/subscribers${params.toString() ? '?' + params.toString() : ''}`
  return (
    <a
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        isActive
          ? 'bg-orange-500 text-white border-orange-500'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {children}
    </a>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: '#157A45', bg: '#D7F2E0', label: 'Aktiv' },
    pending: { color: '#B07C0A', bg: '#FFF8E6', label: 'Pending DOI' },
    unsubscribed: { color: '#6B7280', bg: '#F3F4F6', label: 'Abgemeldet' },
    bounced: { color: '#D4192B', bg: '#FFE5E7', label: 'Bounced' },
  }
  const m = map[status] ?? { color: '#6B7280', bg: '#F3F4F6', label: status }
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: m.color, backgroundColor: m.bg }}
    >
      {m.label}
    </span>
  )
}

function RowActions({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {status !== 'active' && (
        <form action={setSubscriberStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="active" />
          <button
            type="submit"
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-50"
            title="Als aktiv markieren"
          >Aktivieren</button>
        </form>
      )}
      {status !== 'unsubscribed' && (
        <form action={setSubscriberStatus}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="unsubscribed" />
          <button
            type="submit"
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50"
            title="Abmelden"
          >Abmelden</button>
        </form>
      )}
      <form action={deleteSubscriber}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="rounded-full px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
          title="Löschen"
        >Löschen</button>
      </form>
    </div>
  )
}
