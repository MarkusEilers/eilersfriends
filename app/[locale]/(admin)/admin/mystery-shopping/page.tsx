import { getAvailability, listBookings, nextQuarterLabel } from '@/lib/mystery-shopping/slots'
import { saveMysteryQuarterAction } from '@/lib/actions/mystery-shopping'
import { SlotDots } from '@/components/mystery-shopping/SlotDots'

export const dynamic = 'force-dynamic'

const STATUS: Record<string, string> = { paid: 'bezahlt', pending: 'im Checkout', duplicate_paid: 'doppelt bezahlt – prüfen' }

/** Plätze je Quartal pflegen und Buchungen sehen. */
export default async function AdminMysteryShoppingPage() {
  const a = await getAvailability()
  const rows = await listBookings()
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Mystery Shopping · Plätze</h1>
      <p className="mt-1 text-sm text-gray-500">Quartal {a.quarter}. Der Zähler auf der Website sinkt mit jeder bezahlten Buchung. Jede Firma (E-Mail-Domain) kann einmal buchen.</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <SlotDots capacity={a.capacity} free={a.free} nextOpens={nextQuarterLabel(a.quarter)} />
          <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div><dt className="text-gray-500">Bezahlt</dt><dd className="text-lg font-bold">{a.paid}</dd></div>
            <div><dt className="text-gray-500">Im Checkout</dt><dd className="text-lg font-bold">{a.pending}</dd></div>
            <div><dt className="text-gray-500">Anderweitig vergeben</dt><dd className="text-lg font-bold">{a.offset}</dd></div>
          </dl>
        </div>
        <form action={saveMysteryQuarterAction} className="rounded-2xl border border-gray-200 bg-white p-6">
          <input type="hidden" name="quarter" value={a.quarter} />
          <label className="block text-sm font-semibold text-gray-700">Plätze in diesem Quartal
            <input name="capacity" type="number" min={1} max={200} defaultValue={a.capacity} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          <label className="mt-4 block text-sm font-semibold text-gray-700">Bereits anderweitig vergeben
            <input name="offset" type="number" min={0} defaultValue={a.offset} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            <span className="mt-1 block text-xs font-normal text-gray-500">Nur echte Zusagen außerhalb des Shops eintragen (z. B. direkt vereinbarte Sessions). Eine künstliche Verknappung ist wettbewerbsrechtlich riskant.</span>
          </label>
          <button className="mt-5 rounded-full bg-[#1A5FD4] px-5 py-2.5 text-sm font-bold text-white">Speichern</button>
        </form>
      </div>

      <h2 className="mt-10 text-lg font-bold text-gray-900">Buchungen</h2>
      {rows.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Noch keine Buchungen.</p>
      ) : (
        <table className="mt-3 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500"><tr><th className="p-3">Firma</th><th className="p-3">Kontakt</th><th className="p-3">Quartal</th><th className="p-3">Status</th><th className="p-3">Datum</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t border-gray-100">
              <td className="p-3"><b>{r.company || r.company_domain}</b><div className="text-xs text-gray-500">{r.company_domain}</div></td>
              <td className="p-3">{r.name}<div className="text-xs text-gray-500">{r.email}</div></td>
              <td className="p-3">{r.quarter}</td>
              <td className="p-3">{STATUS[r.status] ?? r.status}</td>
              <td className="p-3 text-gray-500">{new Date(r.paid_at ?? r.created_at).toLocaleDateString('de-DE')}</td>
            </tr>))}
          </tbody>
        </table>
      )}
    </div>
  )
}
