export function LpProblem({ content }: { content: Record<string, any> }) {
  const rawItems = (content.items as any[]) ?? []
  const items = rawItems.map((it) =>
    typeof it === 'string'
      ? { title: it, description: undefined as string | undefined }
      : { title: String(it.title ?? ''), description: it.description ? String(it.description) : undefined },
  )
  const accent = '#D4192B'

  return (
    <section className="px-6 py-16" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-4xl">
        {content.eyebrow && (
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>
            {content.eyebrow as string}
          </p>
        )}
        {content.headline && (
          <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        {items.length > 0 && (
          <ul className={`grid gap-4 ${items.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-red-100 bg-white p-5">
                <span className="mt-0.5 text-red-400 text-lg leading-none flex-shrink-0">✗</span>
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
