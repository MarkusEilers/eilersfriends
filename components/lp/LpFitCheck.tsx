import { Check, X } from 'lucide-react'

export function LpFitCheck({
  content,
  accent,
}: { content: Record<string, any>; accent: string }) {
  const goodFit: string[] = Array.isArray(content.goodFit) ? content.goodFit : []
  const notGoodFit: string[] = Array.isArray(content.notGoodFit) ? content.notGoodFit : []

  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-5xl">
        {content.eyebrow && (
          <div className="text-center mb-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {content.eyebrow as string}
            </span>
          </div>
        )}
        {content.headline && (
          <h2 className="text-center text-3xl font-bold sm:text-4xl mb-12" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Good fit */}
          <div className="rounded-3xl p-8" style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}30` }}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3" style={{ color: '#0D0D0B' }}>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: accent, color: 'white' }}
              >
                <Check size={16} />
              </span>
              {(content.goodFitTitle as string) || 'Du bist genau richtig hier, wenn …'}
            </h3>
            <ul className="space-y-3">
              {goodFit.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-gray-700">
                  <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: accent }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not good fit */}
          <div className="rounded-3xl p-8 border-2 border-dashed border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-gray-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-700">
                <X size={16} />
              </span>
              {(content.notGoodFitTitle as string) || 'Eher nicht für dich, wenn …'}
            </h3>
            <ul className="space-y-3">
              {notGoodFit.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-gray-600">
                  <X size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
