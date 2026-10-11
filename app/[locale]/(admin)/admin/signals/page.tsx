import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureRolloutSchema } from '@/lib/rollouts/schema'
import { setSignalStatus, updateSignalText } from '@/lib/actions/rollouts-admin'

export const dynamic = 'force-dynamic'

const STATUS: Record<string, string> = { draft: 'Entwurf', approved: 'freigegeben', sent: 'versendet', skipped: 'verworfen' }

/** Signal-Mails: entstehen täglich als Entwurf, gehen nur nach Freigabe raus. */
export default async function SignalsPage() {
  await ensureRolloutSchema()
  const rows = (await db.execute(sql`
    SELECT q.id, q.kind, q.recipient_email, q.subject, q.body_text, q.status, q.scheduled_for::text AS scheduled_for, q.sent_at::text AS sent_at, q.error,
           s.code, c.name AS company
    FROM signal_queue q JOIN rollout_steps s ON s.id=q.rollout_step_id JOIN rollouts r ON r.id=s.rollout_id JOIN companies c ON c.id=r.company_id
    ORDER BY (q.status IN ('draft','approved')) DESC, q.scheduled_for DESC, s.code LIMIT 200`)) as unknown as
    { id: string; kind: string; recipient_email: string; subject: string; body_text: string; status: string; scheduled_for: string | null; sent_at: string | null; error: string | null; code: string; company: string }[]
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Signal-Mails</h1>
      <p className="mt-1 text-sm text-gray-500">7 Tage vor jedem Schritt „was kommt, was mitbringen", 2 Tage nach Ende „noch offen". Alles als Entwurf — versendet wird erst nach Deiner Freigabe.</p>
      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <details key={r.id} className="rounded-xl border border-gray-200 bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold">{r.code}</span>
              <span className="font-medium text-gray-900">{r.subject}</span>
              <span className="text-gray-400">{r.company} · {r.recipient_email}</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.status === 'sent' ? 'bg-green-50 text-green-700' : r.status === 'approved' ? 'bg-blue-50 text-blue-700' : r.status === 'skipped' ? 'bg-gray-100 text-gray-400' : 'bg-amber-50 text-amber-700'}`}>{STATUS[r.status] ?? r.status}</span>
            </summary>
            <div className="border-t border-gray-100 p-4">
              <form action={updateSignalText} className="space-y-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="subject" defaultValue={r.subject} disabled={r.status === 'sent'} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
                <textarea name="body" defaultValue={r.body_text} rows={10} disabled={r.status === 'sent'} className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs" />
                {r.status !== 'sent' && <button className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">Text speichern</button>}
              </form>
              {r.error && <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">{r.error}</p>}
              {r.status !== 'sent' && (
                <form action={setSignalStatus} className="mt-3 flex gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <button name="status" value="send" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Freigeben & senden</button>
                  <button name="status" value="skipped" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600">Verwerfen</button>
                </form>
              )}
            </div>
          </details>
        ))}
        {!rows.length && <p className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">Noch keine Entwürfe. Der tägliche Lauf legt sie 7 Tage vor jedem Schritt an.</p>}
      </div>
    </div>
  )
}
