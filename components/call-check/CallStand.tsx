import { ThumbsDown, ThumbsUp } from 'lucide-react'
import type { CheckResult, Depth } from '@/lib/call-check/analyze'

export interface StandLabels {
  title: string; probability: string; valueAligned: string; valueNotAligned: string
  depthTitle: string; depthLevels: string[]; depthHint: string
  positive: string; negative: string; noSignals: string
}

/** Wo das Gespräch steht: Kaufwahrscheinlichkeit, Gesprächstiefe, Kaufsignale. */
export function CallStand({ r, depth, L }: { r: CheckResult; depth: Depth; L: StandLabels }) {
  const p = r.purchase?.probability ?? null
  const pos = (r.buying_signals ?? []).filter((s) => s.type === 'positive')
  const neg = (r.buying_signals ?? []).filter((s) => s.type === 'negative')
  const steps = [depth.pain_gain, depth.evidence, depth.impact]
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900">{L.title}</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-[#F7F8FA] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{L.probability}</p>
          {p !== null ? (
            <>
              <p className="mt-2 text-5xl font-bold text-gray-900">{p}<span className="text-2xl text-gray-400"> %</span></p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: p >= 60 ? '#16A34A' : p >= 35 ? '#F59E0B' : '#EB0028' }} /></div>
              <p className={`mt-3 text-xs font-semibold ${r.purchase?.value_aligned ? 'text-green-700' : 'text-amber-700'}`}>{r.purchase?.value_aligned ? L.valueAligned : L.valueNotAligned}</p>
              {r.purchase?.reasoning && <p className="mt-2 text-sm text-gray-600">{r.purchase.reasoning}</p>}
            </>
          ) : <p className="mt-2 text-sm text-gray-400">—</p>}
        </div>
        <div className="rounded-2xl bg-[#F7F8FA] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{L.depthTitle}</p>
          <p className="mt-2 text-lg font-bold text-gray-900">{L.depthLevels[depth.level]}</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {steps.map((ok, i) => (
              <div key={i}>
                <div className={`h-2 rounded-full ${ok ? 'bg-[#1A5FD4]' : 'bg-gray-200'}`} />
                <p className={`mt-1.5 text-[11px] font-semibold ${ok ? 'text-gray-700' : 'text-gray-400'}`}>{L.depthLevels[i + 1]}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">{L.depthHint}</p>
        </div>
      </div>
      {(pos.length > 0 || neg.length > 0) ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {[{ list: pos, title: L.positive, Icon: ThumbsUp, c: 'text-green-700' }, { list: neg, title: L.negative, Icon: ThumbsDown, c: 'text-[#B3001F]' }].map(({ list, title, Icon, c }) => (
            <div key={title}>
              <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${c}`}><Icon size={13} /> {title}</p>
              <ul className="mt-3 space-y-3">
                {list.map((s, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-semibold text-gray-800">{s.signal}</p>
                    {s.quote && <p className="mt-0.5 text-gray-500">„{s.quote}“</p>}
                  </li>
                ))}
                {!list.length && <li className="text-sm text-gray-400">—</li>}
              </ul>
            </div>
          ))}
        </div>
      ) : r.buying_signals ? <p className="mt-6 text-sm text-gray-400">{L.noSignals}</p> : null}
    </section>
  )
}
