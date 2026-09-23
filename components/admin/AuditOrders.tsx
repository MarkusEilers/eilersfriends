'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, XCircle, Clock, ChevronRight, RefreshCw } from 'lucide-react'

type Order = {
  id: string; firma: string; url: string | null; status: string
  quelle: string; extern_id: string | null
  run_ids: string[]; fehler: string | null
  created_at: string; finished_at: string | null
  org_name?: string | null
  auftrag?: { hinweis?: string | null; einstellungen?: Record<string, unknown> }
}

const ZUSTAND: Record<string, { farbe: string; text: string; Icon: typeof Clock }> = {
  offen: { farbe: 'text-gray-500 bg-gray-100', text: 'wartet', Icon: Clock },
  laeuft: { farbe: 'text-blue-700 bg-blue-50', text: 'läuft', Icon: Loader2 },
  fertig: { farbe: 'text-green-700 bg-green-50', text: 'fertig', Icon: CheckCircle2 },
  fehler: { farbe: 'text-red-700 bg-red-50', text: 'Fehler', Icon: XCircle },
  abgebrochen: { farbe: 'text-gray-500 bg-gray-100', text: 'abgebrochen', Icon: XCircle },
}

function dauer(von: string, bis: string | null): string {
  const ms = (bis ? new Date(bis).getTime() : Date.now()) - new Date(von).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'unter einer Minute'
  if (min < 60) return `${min} Minuten`
  return `${Math.floor(min / 60)} h ${min % 60} min`
}

export function AuditOrders({ orders }: { orders: Order[] }) {
  const [offen, setOffen] = useState<string | null>(null)
  const [laedt, setLaedt] = useState<string | null>(null)

  /**
   * Nachfragen heisst hier auch weitertreiben: Die Abfrage schiebt den Lauf
   * ein Stueck weiter. Wer zusieht, hilft also — statt nur zu warten.
   */
  async function nachsehen(id: string) {
    setLaedt(id)
    try {
      await fetch(`/api/services/messaging-audit/${id}`, { cache: 'no-store' })
      window.location.reload()
    } finally { setLaedt(null) }
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-gray-700">Noch kein Auftrag</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          Aufträge kommen aus dem CRM oder von hier. Sie erscheinen sofort in dieser Liste —
          auch während sie laufen.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-semibold">Firma</th>
            <th className="px-4 py-3 font-semibold">Stand</th>
            <th className="px-4 py-3 font-semibold">Dauer</th>
            <th className="px-4 py-3 font-semibold">Herkunft</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const z = ZUSTAND[o.status] ?? ZUSTAND.offen
            const auf = offen === o.id
            return (
              <>
                <tr
                  key={o.id}
                  className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/60 ${
                    o.quelle === 'test' ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{o.firma}</span>
                      {o.quelle === 'test' ? (
                        <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          Test
                        </span>
                      ) : null}
                    </div>
                    {o.url ? <div className="text-xs text-gray-500">{o.url}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${z.farbe}`}>
                      <z.Icon size={12} className={o.status === 'laeuft' ? 'animate-spin' : ''} />
                      {z.text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{dauer(o.created_at, o.finished_at)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.quelle === 'crm' ? 'CRM' : o.quelle === 'test' ? 'Test' : 'Oberfläche'}
                    {o.extern_id ? <span className="ml-1 text-xs text-gray-400">#{o.extern_id}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {o.status === 'laeuft' ? (
                      <button
                        onClick={() => nachsehen(o.id)} disabled={laedt === o.id}
                        className="mr-2 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={laedt === o.id ? 'animate-spin' : ''} /> weiter
                      </button>
                    ) : null}
                    <button
                      onClick={() => setOffen(auf ? null : o.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Details <ChevronRight size={12} className={auf ? 'rotate-90 transition-transform' : 'transition-transform'} />
                    </button>
                  </td>
                </tr>
                {auf ? (
                  <tr key={`${o.id}-d`} className="border-b border-gray-50 bg-gray-50/60">
                    <td colSpan={5} className="px-4 py-4">
                      {o.fehler ? (
                        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{o.fehler}</p>
                      ) : null}
                      {o.auftrag?.hinweis ? (
                        <p className="mb-3 text-xs text-gray-700"><span className="font-semibold">Hinweis:</span> {o.auftrag.hinweis}</p>
                      ) : null}
                      <div className="text-xs text-gray-500">
                        Auftrag <code className="rounded bg-white px-1 py-0.5">{o.id}</code>
                        {o.run_ids.length ? <> · {o.run_ids.length} {o.run_ids.length === 1 ? 'Lauf' : 'Läufe'}</> : null}
                      </div>
                      {o.auftrag?.einstellungen ? (
                        <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-white p-3 text-[11px] leading-relaxed text-gray-700">
                          {JSON.stringify(o.auftrag.einstellungen, null, 2)}
                        </pre>
                      ) : null}
                    </td>
                  </tr>
                ) : null}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
