import { listErrors, errorStats } from '@/lib/errors/store'
import { clearErrorsAction } from '@/lib/actions/errors'
import { AlertTriangle, Clock } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function ClearButton() {
  return (
    <form action={clearErrorsAction}>
      <button type="submit" className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:border-red-300 hover:text-red-600">Alle löschen</button>
    </form>
  )
}

export default async function AdminErrorsPage() {
  const [errors, stats] = await Promise.all([listErrors(150).catch(() => []), errorStats().catch(() => ({ total: 0, last24h: 0 }))])
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fehler-Log</h1>
          <p className="mt-1 text-sm text-gray-500">Client- und Server-Fehler von der Website. Neueste zuerst.</p>
        </div>
        {errors.length > 0 && <ClearButton />}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Letzte 24 h</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: stats.last24h > 0 ? '#C0392B' : '#157A45' }}>{stats.last24h}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Gesamt</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
      </div>

      {errors.length === 0 ? (
        <div className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center text-sm font-semibold text-green-700">Keine Fehler protokolliert. 🎉</div>
      ) : (
        <div className="space-y-2">
          {errors.map(e => (
            <details key={e.id} className="group rounded-2xl border border-gray-100 bg-white p-4">
              <summary className="flex cursor-pointer items-start justify-between gap-3 list-none">
                <div className="min-w-0 flex items-start gap-3">
                  <span className={'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ' + (e.level === 'fatal' ? 'bg-red-100 text-red-600' : e.level === 'warn' ? 'bg-amber-100 text-amber-600' : 'bg-orange-100 text-orange-600')}><AlertTriangle size={13} /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{e.message || '(ohne Meldung)'}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      <span className="font-semibold uppercase">{e.source}</span>{e.status ? ` · ${e.status}` : ''}{e.url ? ` · ${e.url.replace(/^https?:\/\/[^/]+/, '')}` : ''}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-gray-400"><Clock size={11} /> {new Date(e.createdAt).toLocaleString('de-DE')}</span>
              </summary>
              {(e.stack || e.userAgent) && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  {e.stack && <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-600">{e.stack}</pre>}
                  {e.userAgent && <p className="mt-2 text-[11px] text-gray-400">{e.userAgent}</p>}
                </div>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
