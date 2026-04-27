import { db } from '@/lib/db'
import { programs, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import {
  Plus, ExternalLink, GraduationCap, Users as UsersIcon, Briefcase,
  FileText, Globe, Archive, Edit3,
} from 'lucide-react'
import { createProgram, setProgramStatus, deleteProgram } from '@/lib/actions/programs'

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  academy: { label: 'Academy', color: '#1A5FD4', bg: '#EBF1FF', icon: GraduationCap },
  coaching: { label: 'Coaching', color: '#D4192B', bg: '#FFEBEC', icon: UsersIcon },
  training: { label: 'Training', color: '#B07C0A', bg: '#FFF8E6', icon: Briefcase },
}

export default async function ProgramsPage() {
  let rows: ((typeof programs.$inferSelect) & { coachName?: string | null })[] = []
  try {
    const res = await db
      .select({
        id: programs.id,
        coachId: programs.coachId,
        name: programs.name,
        slug: programs.slug,
        description: programs.description,
        type: programs.type,
        ctaType: programs.ctaType,
        status: programs.status,
        price: programs.price,
        maxParticipants: programs.maxParticipants,
        locale: programs.locale,
        createdAt: programs.createdAt,
        updatedAt: programs.updatedAt,
        coachName: users.name,
      })
      .from(programs)
      .leftJoin(users, eq(programs.coachId, users.id))
      .orderBy(desc(programs.updatedAt))
    rows = res as typeof rows
  } catch (_) {}

  const stats = {
    total: rows.length,
    published: rows.filter((r) => r.status === 'published').length,
    drafts: rows.filter((r) => r.status === 'draft').length,
    archived: rows.filter((r) => r.status === 'archived').length,
    academy: rows.filter((r) => r.type === 'academy').length,
    coaching: rows.filter((r) => r.type === 'coaching').length,
    training: rows.filter((r) => r.type === 'training').length,
  }

  const grouped = {
    published: rows.filter((r) => r.status === 'published'),
    draft: rows.filter((r) => r.status === 'draft'),
    archived: rows.filter((r) => r.status === 'archived'),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programme &amp; Frameworks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Academy, Coaching und Training-Angebote — Module &amp; Lessons folgen je Programm.
          </p>
        </div>
        <form action={createProgram}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#F05A1A' }}
          >
            <Plus size={16} />
            Neues Programm
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        <StatCard label="Gesamt"        value={stats.total}     color="#0F1E3A" />
        <StatCard label="Veröffentlicht" value={stats.published} color="#157A45" />
        <StatCard label="Entwürfe"      value={stats.drafts}    color="#B07C0A" />
        <StatCard label="Archiviert"    value={stats.archived}  color="#6B7280" />
      </div>

      {/* Type breakdown */}
      {stats.total > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {(['academy', 'coaching', 'training'] as const).map((t) => {
            const meta = TYPE_META[t]
            const n = stats[t]
            const Icon = meta.icon
            return (
              <div
                key={t}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{ color: meta.color, backgroundColor: meta.bg, borderColor: `${meta.color}30` }}
              >
                <Icon size={12} /> {meta.label}: <span className="font-bold">{n}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <GraduationCap size={32} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Noch keine Programme angelegt.</p>
          <p className="mt-1 text-xs text-gray-400">
            Klick auf „Neues Programm", um SalesMade Academy, Liquid Leadership oder ein neues Framework zu starten.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.published.length > 0 && (
            <Group title="Veröffentlicht" icon={<Globe size={14} />} color="green" rows={grouped.published} />
          )}
          {grouped.draft.length > 0 && (
            <Group title="Entwürfe" icon={<FileText size={14} />} color="orange" rows={grouped.draft} />
          )}
          {grouped.archived.length > 0 && (
            <Group title="Archiviert" icon={<Archive size={14} />} color="gray" rows={grouped.archived} />
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function Group({
  title, icon, color, rows,
}: {
  title: string
  icon: React.ReactNode
  color: 'green' | 'orange' | 'gray'
  rows: ((typeof programs.$inferSelect) & { coachName?: string | null })[]
}) {
  const colorMap = {
    green: 'text-green-700 bg-green-50',
    orange: 'text-orange-700 bg-orange-50',
    gray: 'text-gray-600 bg-gray-100',
  }
  return (
    <div>
      <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colorMap[color]}`}>
        {icon} {title} ({rows.length})
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((p) => {
          const meta = TYPE_META[p.type] ?? TYPE_META.academy
          const Icon = meta.icon
          return (
            <div key={p.id} className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <Icon size={18} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">/{p.slug}</p>
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0"
                  style={{ color: meta.color, backgroundColor: meta.bg }}
                >
                  {meta.label}
                </span>
              </div>

              {p.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{p.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                <span>Coach: <strong className="text-gray-700">{p.coachName ?? '—'}</strong></span>
                {p.maxParticipants ? <span>· max {p.maxParticipants} Plätze</span> : null}
                {p.price ? <span>· €{p.price}</span> : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-50">
                <div className="flex gap-1.5">
                  <Link
                    href={`/admin/programs/${p.id}`}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    <Edit3 size={11} /> Bearbeiten
                  </Link>
                  {p.status === 'published' && (
                    <a
                      href={`/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 border-blue-200"
                    >
                      <ExternalLink size={11} /> Live
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  {p.status !== 'published' && (
                    <form action={setProgramStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="published" />
                      <button type="submit" className="rounded-full px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-50" title="Veröffentlichen">Publish</button>
                    </form>
                  )}
                  {p.status !== 'archived' && (
                    <form action={setProgramStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="archived" />
                      <button type="submit" className="rounded-full px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50" title="Archivieren">Archiv</button>
                    </form>
                  )}
                  <form action={deleteProgram}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="rounded-full px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" title="Löschen">×</button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
