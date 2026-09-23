'use client'

import { useState } from 'react'

/**
 * Das Eingangsprotokoll.
 *
 * Die Auftragsliste zeigt, was zustande kam. Diese Liste zeigt, was angeklopft
 * hat — auch das, was abgewiesen wurde oder unterwegs gestorben ist. Beides
 * nebeneinander zu sehen ist der eigentliche Wert: Eine Zeile hier ohne Zeile
 * dort ist genau der Fall, den wir sonst nicht bemerken.
 */

type Call = {
  id: string; service_key: string; methode: string; status: number | null
  key_name: string | null; firma: string | null; extern_id: string | null
  order_id: string | null; fehler: string | null; rumpf: unknown
  dauer_ms: number | null; created_at: string
}

function farbe(status: number | null): string {
  if (status === null) return 'text-gray-500 bg-gray-100'
  if (status < 300) return 'text-green-700 bg-green-50'
  if (status < 500) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

function zeit(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function ServiceCalls({ calls }: { calls: Call[] }) {
  const [offen, setOffen] = useState<string | null>(null)

  if (!calls.length) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500">
        Noch kein Aufruf protokolliert.
      </p>
    )
  }

  // Ein Aufruf ohne Auftrag ist der Fall, um den es geht. Der faellt hier auf.
  const verloren = calls.filter((c) => !c.order_id && (c.status ?? 500) >= 400).length

  return (
    <div>
      {verloren > 0 ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {verloren} {verloren === 1 ? 'Aufruf' : 'Aufrufe'} ohne Auftrag — angeklopft, aber nichts entstanden.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3">Zeitpunkt</th>
              <th className="px-4 py-3">Firma</th>
              <th className="px-4 py-3">Schlüssel</th>
              <th className="px-4 py-3">Antwort</th>
              <th className="px-4 py-3">Auftrag</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <>
                <tr
                  key={c.id}
                  onClick={() => setOffen(offen === c.id ? null : c.id)}
                  className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">{zeit(c.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-gray-900">{c.firma ?? '—'}</span>
                    {c.extern_id ? (
                      <span className="ml-1 text-xs text-gray-400">#{c.extern_id}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{c.key_name ?? 'Oberfläche'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${farbe(c.status)}`}>
                      {c.status ?? 'offen'}
                    </span>
                    {c.dauer_ms !== null ? (
                      <span className="ml-2 text-xs text-gray-400">{c.dauer_ms} ms</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">
                    {c.order_id
                      ? <span className="font-mono text-xs text-gray-500">{c.order_id.slice(0, 8)}</span>
                      : <span className="text-xs font-semibold text-red-600">keiner</span>}
                  </td>
                </tr>
                {offen === c.id ? (
                  <tr key={`${c.id}-detail`} className="border-b border-gray-50 bg-gray-50/70">
                    <td colSpan={5} className="px-4 py-3">
                      {c.fehler ? (
                        <pre className="mb-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-xs text-red-800">
                          {c.fehler}
                        </pre>
                      ) : null}
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Was geschickt wurde
                      </div>
                      <pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-gray-700">
                        {JSON.stringify(c.rumpf, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ) : null}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
