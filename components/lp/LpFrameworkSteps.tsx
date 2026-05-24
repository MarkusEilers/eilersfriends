import { ArrowRight, Sparkles } from 'lucide-react'

export function LpFrameworkSteps({
  content,
  accent,
}: { content: Record<string, any>; accent: string }) {
  const steps: {
    title: string
    description?: string
    example?: string
    tip?: string
  }[] = Array.isArray(content.steps) ? content.steps : []
  const layout = (content.layout as 'list' | 'grid') ?? 'list'
  const resultTile = content.resultTile as
    | { eyebrow?: string; headline: string; body?: string; metrics?: { value: string; label: string }[] }
    | undefined

  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-6xl">
        {content.eyebrow && (
          <div className="text-center mb-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {content.eyebrow as string}
            </span>
          </div>
        )}
        {content.headline && (
          <h2 className="text-center text-3xl font-bold sm:text-4xl mb-3" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        {content.subheadline && (
          <p className="mx-auto max-w-2xl text-center text-base text-gray-600 mb-12">
            {content.subheadline as string}
          </p>
        )}

        {layout === 'grid' ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={i}
                className="group rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                    style={{ backgroundColor: `${accent}15`, color: accent }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-base font-bold leading-tight" style={{ color: '#0D0D0B' }}>{s.title}</h3>
                </div>
                {s.description && (
                  <p className="text-sm leading-relaxed text-gray-600">{s.description}</p>
                )}
                {s.tip && (
                  <p className="mt-4 text-xs italic text-gray-500 border-t border-gray-100 pt-3">
                    <strong className="not-italic" style={{ color: accent }}>Tipp:</strong> {s.tip}
                  </p>
                )}
              </div>
            ))}
            {resultTile && (
              <div
                className="rounded-2xl p-6 text-white"
                style={{ backgroundColor: accent, gridColumn: 'auto' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                    {resultTile.eyebrow ?? 'Ergebnis'}
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-tight mb-2">{resultTile.headline}</h3>
                {resultTile.body && (
                  <p className="text-sm leading-relaxed opacity-90">{resultTile.body}</p>
                )}
                {resultTile.metrics && resultTile.metrics.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
                    {resultTile.metrics.map((m, idx) => (
                      <div key={idx}>
                        <p className="text-xl font-bold">{m.value}</p>
                        <p className="text-[11px] uppercase tracking-wider opacity-75">{m.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <ol className="space-y-6 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <li key={i} className="grid gap-5 sm:grid-cols-[64px_1fr] items-start">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold mx-auto sm:mx-0"
                  style={{ backgroundColor: `${accent}15`, color: accent }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                  <h3 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>{s.title}</h3>
                  {s.description && (
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{s.description}</p>
                  )}
                  {s.example && (
                    <div className="mt-4 rounded-xl border-l-4 px-4 py-3 text-sm" style={{ borderColor: accent, backgroundColor: `${accent}08` }}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>Beispiel</p>
                      <p className="text-gray-700">{s.example}</p>
                    </div>
                  )}
                  {s.tip && (
                    <p className="mt-4 text-xs italic text-gray-500">
                      <strong className="not-italic" style={{ color: accent }}>Tipp:</strong> {s.tip}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
