import { Link } from '@/lib/i18n/navigation'
import { PenLine, Plus, MessageSquare, Clock } from 'lucide-react'
import { listAll } from '@/lib/blog/admin'
import { seedCommentRules, queue } from '@/lib/blog/comments'
import { AUTHORS } from '@/lib/blog/authors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: 'Entwurf', bg: '#F3F4F6', fg: '#6B7280' },
  review: { label: 'In Prüfung', bg: '#FEF3C7', fg: '#92400E' },
  scheduled: { label: 'Geplant', bg: '#DBEAFE', fg: '#1E40AF' },
  published: { label: 'Veröffentlicht', bg: '#D1FAE5', fg: '#065F46' },
}

export default async function AdminBlogPage() {
  await seedCommentRules().catch(() => {})
  const [posts, waiting] = await Promise.all([listAll(), queue(1).catch(() => [])])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
            <PenLine size={12} /> Redaktion
          </span>
          <h1 className="mt-1.5 text-2xl font-bold text-gray-900">Blog</h1>
          <p className="mt-1 text-sm text-gray-500">{posts.length} Beiträge</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={'/admin/blog/kommentare' as '/'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <MessageSquare size={14} /> Kommentare
            {waiting.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-800">wartet</span>
            )}
          </Link>
          <Link
            href={'/admin/blog/neu' as '/'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Plus size={14} /> Neuer Beitrag
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {posts.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Noch kein Beitrag angelegt.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[10px] uppercase tracking-widest text-gray-400">
                <th className="px-4 py-3 font-bold">Titel</th>
                <th className="px-3 py-3 font-bold">Autor</th>
                <th className="px-3 py-3 font-bold">Sprache</th>
                <th className="px-3 py-3 font-bold">Status</th>
                <th className="px-3 py-3 font-bold">Datum</th>
                <th className="px-3 py-3 font-bold">Kommentare</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => {
                const a = AUTHORS[p.author_slug] ?? AUTHORS.markus
                const st = STATUS[p.status] ?? STATUS.draft
                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/blog/${p.id}` as '/'} className="font-semibold text-gray-900 hover:text-blue-700">
                        {p.title}
                      </Link>
                      {p.subtitle && <div className="text-xs text-gray-400">{p.subtitle}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: a.tint, color: a.accent }}>
                        {a.name.split(' ')[0]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11px] font-bold uppercase text-gray-400">{p.locale ?? 'de'}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {p.published_at ? (
                        <span className="inline-flex items-center gap-1">
                          {p.status === 'scheduled' && <Clock size={11} />}
                          {new Date(p.published_at).toLocaleDateString('de-DE')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {p.comment_count ?? 0}
                      {(p.open_comments ?? 0) > 0 && (
                        <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">
                          {p.open_comments} offen
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
