import { Gavel } from 'lucide-react'

/**
 * Entscheidungen stehen bewusst neben den Brettern und nicht darin.
 *
 * Eine Karte beschreibt etwas, das noch laeuft. Eine Entscheidung ist der
 * Moment, in dem etwas aufhoert zu laufen — sie gehoert nicht in eine Spalte,
 * sie gehoert ins Protokoll.
 */
export function Decisions({
  decisions, accent = '#1A5FD4',
}: { decisions: Array<Record<string, unknown>>; accent?: string }) {
  if (!decisions.length) return null
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
        <Gavel size={12} /> Entscheidungen
      </h3>
      <ul className="mt-4 space-y-4">
        {decisions.map((d) => (
          <li key={String(d.id)} className="border-l-2 pl-4" style={{ borderColor: accent }}>
            <div className="text-[15px] font-semibold leading-snug text-gray-900">{String(d.text)}</div>
            {d.rationale ? <p className="mt-1 text-sm leading-relaxed text-gray-600">{String(d.rationale)}</p> : null}
            <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-gray-400">
              {d.decided_by ? <span>entschieden von {String(d.decided_by)}</span> : null}
              {d.consequence ? <span className="text-gray-500">Folge: {String(d.consequence)}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
