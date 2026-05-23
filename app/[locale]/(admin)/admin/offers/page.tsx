import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listOffersForAdmin } from '@/lib/db/queries/offers'
import { createDraftOfferAction, signOutAdminAction } from '@/lib/actions/offers'
import { FileText, Plus, LogOut, Link2, Pencil, Eye, FileStack, Image as ImageIcon, Tv, Settings } from 'lucide-react'

type Status = 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'expired' | 'cancelled'

function statusLabel(s: Status): { label: string; bg: string; fg: string } {
  const m: Record<Status, { label: string; bg: string; fg: string }> = {
    draft:     { label: 'Entwurf',       bg: '#F3F4F6', fg: '#4B5563' },
    sent:      { label: 'Versendet',     bg: '#EFF6FF', fg: '#1D4ED8' },
    viewed:    { label: 'Angesehen',     bg: '#FEF9C3', fg: '#A16207' },
    signed:    { label: 'Unterzeichnet', bg: '#ECFDF5', fg: '#047857' },
    paid:      { label: 'Bezahlt',       bg: '#DCFCE7', fg: '#15803D' },
    expired:   { label: 'Abgelaufen',    bg: '#FEE2E2', fg: '#B91C1C' },
    cancelled: { label: 'Storniert',     bg: '#F3F4F6', fg: '#6B7280' },
  }
  return m[s] ?? m.draft
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '–'
  try {
    return new Date(d).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' })
  } catch { return '–' }
}

export default async function AdminOffersPage() {
  const [session, offers] = await Promise.all([auth(), listOffersForAdmin()])
  const userEmail = session?.user?.email ?? 'unbekannt'

  // Aggregations for stat cards
  const now = Date.now()
  const sentCount = offers.filter((o) => o.status === 'sent').length
  const signedCount = offers.filter((o) => o.status === 'signed' || o.status === 'paid').length
  const expiredCount = offers.filter((o) => {
    if (o.status === 'expired') return true
    if (!o.valid_until) return false
    return o.status !== 'signed' && o.status !== 'paid' && new Date(o.valid_until).getTime() < now
  }).length

  const tabs = [
    { key: 'offers',         label: 'Angebote',       href: '/admin/offers',           icon: FileText,   active: true  },
    { key: 'programs',       label: 'Vorlagen',       href: '/admin/programs',         icon: FileStack,  active: false },
    { key: 'logos',          label: 'Partner-Logos',  href: '/admin/logos',            icon: ImageIcon,  active: false },
    { key: 'infotainment',   label: 'Infotainment',   href: '/admin/email-templates',  icon: Tv,         active: false },
    { key: 'settings',       label: 'Einstellungen',  href: '/admin/settings',         icon: Settings,   active: false },
  ] as const

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Angebotsverwaltung</h1>
          <p className="mt-1 text-sm text-gray-500">Angemeldet als {userEmail}</p>
        </div>
        <div className="flex items-center gap-3">
          <form action={createDraftOfferAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus size={16} /> Neues Angebot
            </button>
          </form>
          <form action={signOutAdminAction}>
            <button
              type="submit"
              title="Abmelden"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────── */}
      <nav className="-mt-2 flex flex-wrap gap-1 border-b border-gray-200">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <Link
              key={t.key}
              href={t.href as '/'}
              className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
                t.active
                  ? 'border border-b-transparent border-gray-200 bg-white text-gray-900 shadow-sm -mb-px'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
              style={t.active ? { backgroundColor: '#FFFFFF' } : undefined}
            >
              <Icon size={14} />
              {t.label}
            </Link>
          )
        })}
      </nav>

      {/* ─── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Gesamt"        value={offers.length}    accent="#0D0D0B" />
        <StatCard label="Versendet"     value={sentCount}        accent="#1A5FD4" />
        <StatCard label="Unterzeichnet" value={signedCount}      accent="#047857" />
        <StatCard label="Abgelaufen"    value={expiredCount}     accent="#B91C1C" />
      </div>

      {/* ─── Liste ──────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900">Alle Angebote</h2>
          <p className="mt-1 text-sm text-gray-500">Übersicht aller erstellten Angebote</p>
        </div>
        {offers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            Noch keine Angebote. Klicke oben rechts auf <span className="font-semibold">„+ Neues Angebot"</span>.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {offers.map((o) => {
              const tone = statusLabel(o.status as Status)
              return (
                <li key={o.id} className="px-6 py-5 transition hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base font-bold text-gray-900">{o.offer_number}</span>
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: tone.bg, color: tone.fg }}>
                          {tone.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 truncate">
                        {o.customer_company || o.customer_name}
                        {o.title ? ` · ${o.title}` : ''}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap text-xs text-gray-500 hidden sm:block">
                      <div>Gültig bis</div>
                      <div className="mt-1 font-semibold text-gray-700">{formatDate(o.valid_until)}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/offer/${o.access_salt}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Öffentlichen Link öffnen"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Link2 size={15} />
                      </a>
                      <Link
                        href={`/admin/offers/${o.id}` as '/'}
                        title="Bearbeiten"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil size={15} />
                      </Link>
                      <a
                        href={`/offer/${o.access_salt}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Vorschau"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye size={15} />
                      </a>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums" style={{ color: accent }}>{value}</p>
    </div>
  )
}
