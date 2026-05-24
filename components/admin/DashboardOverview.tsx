import type { DashboardStats, BriefingItem, RangeCount } from '@/lib/analytics/dashboard'
import {
  Users,
  Send,
  Eye,
  UserCircle2,
  TrendingUp,
  Globe,
  FileEdit,
  CheckCircle2,
  Activity,
  Sparkles,
  Clock,
} from 'lucide-react'

interface Props {
  stats: DashboardStats
  userName: string
  userRole: string
}

const numFmt = (n: number) => new Intl.NumberFormat('de-DE').format(n)

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  helper,
}: {
  icon: typeof Users
  label: string
  value: RangeCount
  accent: string
  helper?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}15` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
        <span className="text-xs font-medium text-gray-500">heute</span>
      </div>
      <div className="mt-4">
        <div
          className="font-serif text-3xl leading-none"
          style={{ fontFamily: 'var(--font-serif)', color: '#0D0D0B' }}
        >
          {numFmt(value.today)}
        </div>
        <p className="mt-1 text-sm font-medium text-gray-700">{label}</p>
        {helper ? <p className="mt-0.5 text-xs text-gray-500">{helper}</p> : null}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">7T</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-800">{numFmt(value.last7d)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">30T</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-800">{numFmt(value.last30d)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Gesamt</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-800">{numFmt(value.total)}</p>
        </div>
      </div>
    </div>
  )
}

const CATEGORY_META: Record<
  string,
  { color: string; bg: string; icon: typeof CheckCircle2; label: string }
> = {
  subscriber: { color: '#F05A1A', bg: '#FFF1EB', icon: UserCircle2, label: 'Subscriber' },
  sequence: { color: '#1A5FD4', bg: '#EBF1FF', icon: Send, label: 'Sequence' },
  content: { color: '#6B5CE7', bg: '#F0EEFF', icon: FileEdit, label: 'Content' },
  offer: { color: '#B07C0A', bg: '#FFF8E6', icon: TrendingUp, label: 'Angebot' },
  system: { color: '#0F1E3A', bg: '#E7EAF2', icon: Activity, label: 'System' },
  auth: { color: '#0F1E3A', bg: '#E7EAF2', icon: CheckCircle2, label: 'Auth' },
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} Min`
  const h = Math.round(min / 60)
  if (h < 24) return `vor ${h} Std`
  const d = Math.round(h / 24)
  if (d < 14) return `vor ${d} Tag${d === 1 ? '' : 'en'}`
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short' }).format(date)
}

function BriefingRow({ item }: { item: BriefingItem }) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.system
  const Icon = meta.icon
  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0 border-b border-gray-100 last:border-b-0">
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: meta.bg }}
      >
        <Icon size={16} style={{ color: meta.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-semibold text-gray-900">{item.title}</p>
          <span className="flex-shrink-0 text-xs text-gray-500">
            {relativeTime(item.createdAt)}
          </span>
        </div>
        {item.summary ? (
          <p className="mt-0.5 truncate text-xs text-gray-600">{item.summary}</p>
        ) : null}
      </div>
    </li>
  )
}

export function DashboardOverview({ stats, userName, userRole }: Props) {
  const { subscribers, sequenceSends, pageViews, uniqueVisitors, topPaths, topReferrers, recentEvents } =
    stats

  const hasTraffic = pageViews.total > 0
  const hasBriefing = recentEvents.length > 0

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <Sparkles size={14} style={{ color: '#F05A1A' }} />
          <span>Gesamt-Briefing</span>
        </div>
        <h1
          className="mt-2 text-3xl text-gray-900"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Willkommen zurück, {userName.split(' ')[0]}.
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Was seit Deiner letzten Sitzung passiert ist · {userRole}
        </p>
      </header>

      {/* KPI Row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Neue Newsletter-Subscriber"
          value={subscribers}
          accent="#F05A1A"
          helper="alle mit DOI-Status"
        />
        <StatCard
          icon={Send}
          label="Versendete Sequences"
          value={sequenceSends}
          accent="#1A5FD4"
          helper="aktive Drips"
        />
        <StatCard
          icon={Eye}
          label="Page-Views"
          value={pageViews}
          accent="#6B5CE7"
          helper="nur nach Cookie-Zustimmung"
        />
        <StatCard
          icon={UserCircle2}
          label="Unique Visitors"
          value={uniqueVisitors}
          accent="#D4192B"
          helper="anonymisierter Hash"
        />
      </section>

      {/* Briefing + Right Rail */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Briefing */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2
                className="text-xl text-gray-900"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Aktivitäts-Briefing
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Subscriber · Sequences · Website-Updates · in chronologischer Reihenfolge
              </p>
            </div>
            <span
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: '#FFF1EB', color: '#F05A1A' }}
            >
              <Clock size={11} />
              {recentEvents.length} Ereignisse
            </span>
          </div>

          {hasBriefing ? (
            <ul className="divide-y-0">
              {recentEvents.map((item) => (
                <BriefingRow key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm font-medium text-gray-700">Noch keine Aktivität</p>
              <p className="mt-1 text-xs text-gray-500">
                Sobald Subscriber sich anmelden, Sequences laufen oder Du Inhalte editierst,
                taucht das hier auf.
              </p>
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="space-y-6">
          {/* Top Paths */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3
              className="text-sm font-semibold text-gray-900"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <span className="inline-flex items-center gap-2">
                <TrendingUp size={14} style={{ color: '#1A5FD4' }} />
                Top Seiten (30 Tage)
              </span>
            </h3>
            {topPaths.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {topPaths.map((p) => (
                  <li key={p.path} className="flex items-center justify-between text-xs">
                    <span className="truncate font-mono text-gray-700" title={p.path}>
                      {p.path}
                    </span>
                    <span className="ml-3 flex-shrink-0 font-semibold text-gray-900">
                      {numFmt(p.views)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-gray-500">
                {hasTraffic ? '—' : 'Tracking startet sobald Besucher den Banner akzeptieren.'}
              </p>
            )}
          </div>

          {/* Top Referrers */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3
              className="text-sm font-semibold text-gray-900"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <span className="inline-flex items-center gap-2">
                <Globe size={14} style={{ color: '#6B5CE7' }} />
                Top Quellen
              </span>
            </h3>
            {topReferrers.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {topReferrers.map((r) => (
                  <li key={r.host} className="flex items-center justify-between text-xs">
                    <span className="truncate text-gray-700" title={r.host}>
                      {r.host}
                    </span>
                    <span className="ml-3 flex-shrink-0 font-semibold text-gray-900">
                      {numFmt(r.views)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-gray-500">
                {hasTraffic ? 'Direct-Traffic only.' : 'Noch keine Daten.'}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
