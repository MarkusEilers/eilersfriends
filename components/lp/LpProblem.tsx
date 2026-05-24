import { CheckCircle2 } from 'lucide-react'

export function LpProblem({ content }: { content: Record<string, any> }) {
  const tone = (content.tone as 'negative' | 'positive') ?? 'negative'
  const positive = tone === 'positive'
  const rawItems = (content.items as any[]) ?? []
  const items = rawItems.map((it) =>
    typeof it === 'string'
      ? { title: it, description: undefined as string | undefined }
      : { title: String(it.title ?? ''), description: it.description ? String(it.description) : undefined },
  )
  const accent = positive ? '#1A5FD4' : '#EB0028'
  const bg = positive ? '#FAFAF8' : '#FAFAF8'
  const cardBorder = positive ? '#BBCFF5' : 'rgb(254 226 226 / 1)'

  return (
    <section className="px-6 py-16" style={{ backgroundColor: bg }}>
      <div className="mx-auto max-w-5xl">
        {content.eyebrow && (
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>
            {content.eyebrow as string}
          </p>
        )}
        {content.headline && (
          <h2 className="mb-3 text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        {content.subheadline && (
          <p className="mx-auto mb-10 max-w-2xl text-center text-base text-gray-600">
            {content.subheadline as string}
          </p>
        )}
        {items.length > 0 && (
          <ul className={`grid gap-4 ${items.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border bg-white p-5"
                style={{ borderColor: cardBorder }}
              >
                {positive ? (
                  <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" style={{ color: accent }} />
                ) : (
                  <span className="mt-0.5 text-red-400 text-lg leading-none flex-shrink-0">✗</span>
                )}
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0D0D0B' }}>{item.title}</p>
                  {item.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {content.body && <p className="mt-8 text-center text-gray-600">{content.body as string}</p>}
      </div>
    </section>
  )
}
