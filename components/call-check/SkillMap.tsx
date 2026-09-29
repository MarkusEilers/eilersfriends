import type { DimensionResult, SkillResult } from '@/lib/call-check/analyze'
import { DIMENSIONS, MAX_GRADE } from '@/lib/call-check/rubric'

/**
 * The skill map, marked as a draft — same five dimensions and nineteen skills
 * as the Upvest seller report.
 *
 * One call cannot show every skill. A skill without material is not drawn as
 * a low grade but as a hatched bar with the reason laid over it: "no
 * objections in this call" is information, a 1 would be a lie.
 */
export function SkillMap({ skills, dimensions, labels }: {
  skills: SkillResult[]
  dimensions: DimensionResult[]
  labels: {
    title: string; draft: string; hint: string; notMeasured: string; dimensionNotMeasured: string
    measuredOf: (n: number, total: number) => string
    legend: string[]
    dimension: (k: string) => string; skill: (k: string) => string
  }
}) {
  const byKey = new Map(skills.map((s) => [s.key, s]))
  const dimByKey = new Map(dimensions.map((d) => [d.key, d]))
  const measuredTotal = skills.filter((s) => s.measurable).length

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">{labels.title}</h2>
        <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
          {labels.draft}
        </span>
        <span className="text-sm font-semibold text-gray-500">{labels.measuredOf(measuredTotal, skills.length)}</span>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-gray-500">{labels.hint}</p>

      {/* Dimension overview, as in the seller report */}
      <div className="mt-6 space-y-2">
        {DIMENSIONS.map((d) => {
          const ds = dimByKey.get(d.key)
          return (
            <div key={d.key} className="grid grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[260px_1fr_auto]">
              <span className="text-sm font-medium text-gray-800"><span className="text-gray-400">{d.key}</span> {labels.dimension(d.key)}</span>
              <div className="relative hidden h-3 overflow-hidden rounded bg-gray-100 sm:block">
                {ds?.grade != null ? (
                  <div className="h-full rounded bg-[#1A5FD4]" style={{ width: `${(ds.grade / MAX_GRADE) * 100}%` }} />
                ) : (
                  <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg,#F3F4F6,#F3F4F6 5px,#E5E7EB 5px,#E5E7EB 10px)' }} />
                )}
              </div>
              <span className={ds?.grade != null ? 'text-sm font-bold text-gray-900' : 'text-xs font-semibold text-gray-400'}>
                {ds?.grade != null ? `${String(ds.grade).replace('.', ',')} / ${MAX_GRADE}` : labels.dimensionNotMeasured}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
        {DIMENSIONS.map((d) => (
          <div key={d.key}>
            <h3 className="border-b border-gray-100 pb-2 text-xs font-bold uppercase tracking-wider text-gray-800">
              <span className="text-gray-400">{d.key}</span> {labels.dimension(d.key)}
            </h3>
            <ul className="mt-3 space-y-3">
              {d.skills.map((k) => {
                const s = byKey.get(k)
                const measured = !!s?.measurable && s.grade != null
                return (
                  <li key={k}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className={measured ? 'font-medium text-gray-900' : 'font-medium text-gray-400'}>
                        <span className="mr-1.5 text-xs text-gray-400">{k}</span>{labels.skill(k)}
                      </span>
                      <span className={measured ? 'font-bold text-gray-900' : 'text-[11px] font-semibold uppercase tracking-wider text-gray-400'}>
                        {measured ? `${s!.grade} / ${MAX_GRADE}` : labels.notMeasured}
                      </span>
                    </div>
                    <div className="relative mt-1.5 h-7 overflow-hidden rounded-lg bg-gray-100">
                      {measured ? (
                        <div className="flex h-full">
                          {Array.from({ length: MAX_GRADE }, (_, i) => (
                            <div key={i} className="h-full flex-1 border-r-2 border-white last:border-r-0"
                              style={{ background: i < (s!.grade ?? 0) ? (i < 2 ? '#BBCFF5' : i < 3 ? '#5B8FE8' : '#1A5FD4') : 'transparent' }} />
                          ))}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center px-2.5"
                          style={{ background: 'repeating-linear-gradient(45deg,#F3F4F6,#F3F4F6 6px,#E5E7EB 6px,#E5E7EB 12px)' }}>
                          <span className="truncate rounded bg-white/90 px-2 py-0.5 text-[11px] font-medium text-gray-600" title={s?.basis}>
                            {s?.basis}
                          </span>
                        </div>
                      )}
                    </div>
                    {measured && s?.basis ? <p className="mt-1 text-xs text-gray-500">{s.basis}</p> : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-8 flex flex-wrap gap-x-5 gap-y-1 border-t border-gray-100 pt-4 text-xs text-gray-500">
        {labels.legend.map((l, i) => <span key={i}><b className="text-gray-700">{i + 1}</b> {l}</span>)}
      </p>
    </section>
  )
}
