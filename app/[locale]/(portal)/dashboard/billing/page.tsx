import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { Download, FileText, CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Inv { stripe_invoice_id: string; number: string | null; amount_due: number | null; amount_paid: number | null; currency: string; status: string | null; hosted_invoice_url: string | null; invoice_pdf: string | null; created_at: string; paid_at: string | null }
interface Sub { status: string; amount: number | null; currency: string; interval: string | null; current_period_end: string | null; cancel_at_period_end: boolean }

const eur = (n: number | null | undefined, cur = 'eur') => `${(n ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur.toUpperCase()}`
const dt = (s: string | null) => s ? new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default async function BillingPage() {
  const session = await auth()
  const email = session?.user?.email ?? null

  let invoices: Inv[] = []
  let subs: Sub[] = []
  if (email) {
    try {
      invoices = (await db.execute(sql`SELECT stripe_invoice_id, number, amount_due, amount_paid, currency, status, hosted_invoice_url, invoice_pdf, created_at, paid_at FROM billing_invoices WHERE lower(customer_email)=lower(${email}) ORDER BY created_at DESC`)) as unknown as Inv[]
      subs = (await db.execute(sql`SELECT status, amount, currency, interval, current_period_end, cancel_at_period_end FROM billing_subscriptions WHERE lower(customer_email)=lower(${email}) ORDER BY created_at DESC`)) as unknown as Sub[]
    } catch { /* tables may be empty */ }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
      <p className="mt-1 text-sm text-gray-500">Deine bisherigen Rechnungen und Zahlungen.</p>

      {!email && <p className="mt-6 text-sm text-gray-500">Bitte einloggen, um deine Rechnungen zu sehen.</p>}

      {/* Abonnements */}
      {subs.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {subs.map((s, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Abonnement</p>
              <p className="mt-1 text-sm text-gray-900">{eur(s.amount, s.currency)}{s.interval ? ` / ${s.interval === 'month' ? 'Monat' : s.interval}` : ''}</p>
              <p className="mt-1 text-xs text-gray-500">Status: {s.status}{s.cancel_at_period_end ? ' · zum Laufzeitende gekündigt' : ''}</p>
              <p className="text-xs text-gray-500">Nächste/Ende: {dt(s.current_period_end)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rechnungen */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            <FileText size={22} className="mx-auto mb-2 text-gray-300" />
            Noch keine Rechnungen vorhanden.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-widest text-gray-400">
                <th className="px-4 py-3 font-semibold">Datum</th>
                <th className="px-4 py-3 font-semibold">Nummer</th>
                <th className="px-4 py-3 font-semibold">Betrag</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Download</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const paid = inv.status === 'paid'
                return (
                  <tr key={inv.stripe_invoice_id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-700">{dt(inv.paid_at ?? inv.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-900">{eur(inv.amount_paid || inv.amount_due, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: paid ? '#EAF7EE' : '#FFF4E5', color: paid ? '#157A45' : '#B07C0A' }}>
                        {paid ? <CheckCircle2 size={11} /> : <Clock size={11} />} {paid ? 'Bezahlt' : 'Offen'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(inv.invoice_pdf || inv.hosted_invoice_url) ? (
                        <a href={inv.invoice_pdf ?? inv.hosted_invoice_url ?? '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                          <Download size={12} /> PDF
                        </a>
                      ) : <span className="text-xs text-gray-300">—</span>}
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
