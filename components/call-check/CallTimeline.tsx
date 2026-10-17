/**
 * The conversation as a horizontal strip.
 *
 * Top lane: when the seller spoke. Bottom lane: when the customer spoke.
 * Width of each block = words in that turn, so the strip reads like time
 * (transcripts rarely carry reliable timestamps — words are the honest clock).
 * Above the lanes: the stages of the call, coloured by how well they went.
 * Below: numbered markers for every moment that triggered feedback,
 * explained in the list underneath.
 *
 * Pure server component: positions in percent, tooltips via title.
 */

export interface TimelineTurn { r: 's' | 'c' | 'o'; w: number }
export interface TimelinePhase { from_turn: number; to_turn: number; label: string; rating: 'good' | 'mixed' | 'weak'; note: string }
export type MarkerKind = 'turning' | 'feedback' | 'strength' | 'objection' | 'signal_pos' | 'signal_neg'
export interface TimelineMarker { turn: number; kind: MarkerKind; label: string; detail?: string }

export interface TimelineLabels {
  title: string; hint: string; seller: string; customer: string; start: string; end: string
  phases: string; rating: Record<'good' | 'mixed' | 'weak', string>; kinds: Record<MarkerKind, string>
}

const PHASE_STYLE: Record<TimelinePhase['rating'], string> = {
  good: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  mixed: 'bg-amber-50 border-amber-200 text-amber-800',
  weak: 'bg-[#FFEBEC] border-[#F5BBBC] text-[#B3001F]',
}
const MARKER_STYLE: Record<MarkerKind, string> = {
  turning: 'bg-[#EB0028] text-white ring-2 ring-[#EB0028]/30',
  feedback: 'bg-[#EB0028] text-white',
  strength: 'bg-emerald-600 text-white',
  objection: 'bg-amber-500 text-white',
  signal_pos: 'bg-white text-emerald-700 border-2 border-emerald-600',
  signal_neg: 'bg-white text-[#B3001F] border-2 border-[#EB0028]',
}

export function CallTimeline({ turns, phases, markers, L }: {
  turns: TimelineTurn[]; phases: TimelinePhase[]; markers: TimelineMarker[]; L: TimelineLabels
}) {
  const total = turns.reduce((n, t) => n + Math.max(1, t.w), 0) || 1
  // Start offset (percent) of every turn, 1-based like the numbering the model saw.
  const start: number[] = [0]
  let acc = 0
  for (const t of turns) { start.push((acc / total) * 100); acc += Math.max(1, t.w) }
  start.push(100)
  const pos = (turn: number) => {
    const i = Math.min(Math.max(1, turn), turns.length)
    const w = (Math.max(1, turns[i - 1]?.w ?? 1) / total) * 100
    return start[i] + w / 2
  }
  const span = (from: number, to: number) => {
    const a = start[Math.min(Math.max(1, from), turns.length)]
    const b = to >= turns.length ? 100 : start[Math.max(from, to) + 1]
    return { left: a, width: Math.max(0.8, b - a) }
  }

  // Markers sorted by position; markers too close to each other go one row down.
  const sorted = [...markers].filter((m) => m.turn >= 1 && m.turn <= turns.length)
    .sort((a, b) => a.turn - b.turn)
    .map((m, i) => ({ ...m, n: i + 1, x: pos(m.turn), row: 0 }))
  const lastX: number[] = []
  for (const m of sorted) {
    let row = 0
    while (lastX[row] !== undefined && m.x - lastX[row] < 3.2) row++
    m.row = row; lastX[row] = m.x
  }
  const rows = Math.max(1, ...sorted.map((m) => m.row + 1))

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900">{L.title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-gray-500">{L.hint}</p>

      <div className="mt-8 grid grid-cols-[72px_1fr] gap-x-3 gap-y-1.5 sm:grid-cols-[96px_1fr]">
        {/* Stages */}
        {phases.length > 0 && (<>
          <span className="self-center text-[11px] font-bold uppercase tracking-wider text-gray-400">{L.phases}</span>
          <div className="relative h-9">
            {phases.map((p, i) => {
              const s = span(p.from_turn, p.to_turn)
              return (
                <div key={i} title={`${p.label} · ${L.rating[p.rating]} — ${p.note}`}
                  className={`absolute top-0 flex h-9 items-center overflow-hidden rounded-lg border px-2 text-[11px] font-semibold ${PHASE_STYLE[p.rating]}`}
                  style={{ left: `${s.left}%`, width: `calc(${s.width}% - 2px)` }}>
                  <span className="truncate">{p.label}</span>
                </div>
              )
            })}
          </div>
        </>)}

        {/* Seller lane */}
        <span className="self-center text-xs font-semibold text-gray-600">{L.seller}</span>
        <div className="relative h-7 rounded-md bg-gray-50">
          {turns.map((t, i) => t.r === 's' ? (
            <div key={i} className="absolute top-0 h-7 rounded-[3px] bg-[#1A5FD4]"
              style={{ left: `${start[i + 1]}%`, width: `max(2px, calc(${(Math.max(1, t.w) / total) * 100}% - 1px))` }}
              title={`#${i + 1} · ${t.w}`} />
          ) : null)}
        </div>

        {/* Customer lane */}
        <span className="self-center text-xs font-semibold text-gray-600">{L.customer}</span>
        <div className="relative h-7 rounded-md bg-gray-50">
          {turns.map((t, i) => t.r === 'c' ? (
            <div key={i} className="absolute top-0 h-7 rounded-[3px] bg-[#5DDBF5]"
              style={{ left: `${start[i + 1]}%`, width: `max(2px, calc(${(Math.max(1, t.w) / total) * 100}% - 1px))` }}
              title={`#${i + 1} · ${t.w}`} />
          ) : null)}
        </div>

        {/* Markers */}
        <span />
        <div className="relative" style={{ height: `${rows * 30 + 6}px` }}>
          {sorted.map((m) => (
            <div key={m.n} className="absolute -translate-x-1/2" style={{ left: `${m.x}%`, top: `${m.row * 30}px` }}>
              <div className="mx-auto h-1.5 w-px bg-gray-300" />
              <span title={`${L.kinds[m.kind]}: ${m.label}`}
                className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-bold ${MARKER_STYLE[m.kind]}`}>
                {m.kind === 'turning' ? '!' : m.n}
              </span>
            </div>
          ))}
        </div>

        <span />
        <div className="flex justify-between text-[11px] text-gray-400"><span>{L.start}</span><span>{L.end}</span></div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600">
        {(Object.keys(L.kinds) as MarkerKind[]).filter((k) => sorted.some((m) => m.kind === k)).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3.5 w-3.5 rounded-full ${MARKER_STYLE[k]}`} /> {L.kinds[k]}
          </span>
        ))}
        {(['good', 'mixed', 'weak'] as const).filter((k) => phases.some((p) => p.rating === k)).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3.5 w-5 rounded border ${PHASE_STYLE[k]}`} /> {L.rating[k]}
          </span>
        ))}
      </div>

      {/* Stages explained */}
      {phases.length > 0 && (
        <ol className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {phases.map((p, i) => (
            <li key={i} className={`rounded-2xl border p-4 ${PHASE_STYLE[p.rating]}`}>
              <p className="text-sm font-bold">{p.label} <span className="font-medium opacity-70">· {L.rating[p.rating]}</span></p>
              <p className="mt-1 text-sm text-gray-700">{p.note}</p>
            </li>
          ))}
        </ol>
      )}

      {/* Markers explained */}
      {sorted.length > 0 && (
        <ol className="mt-6 divide-y divide-gray-100">
          {sorted.map((m) => (
            <li key={m.n} className="flex gap-3 py-3">
              <span className={`mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-bold ${MARKER_STYLE[m.kind]}`}>
                {m.kind === 'turning' ? '!' : m.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{m.label} <span className="font-normal text-gray-400">· {L.kinds[m.kind]}</span></p>
                {m.detail ? <p className="mt-0.5 text-sm text-gray-600">{m.detail}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
