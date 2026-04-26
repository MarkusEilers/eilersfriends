interface Item { icon?: string; title: string; text?: string }

export function LpFeatures({
  content, accent, type,
}: {
  content: Record<string, any>
  accent: string
  type: string
}) {
  const items = (content.items as Item[]) ?? []

  return (
    <section className="px-6 py-16 bg-white">
      <div className="mx-auto max-w-4xl">
        {content.headline && (
          <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        {content.body && (
          <p className="mb-8 text-center text-gray-600">{content.body as string}</p>
        )}
        {items.length > 0 && (
          <div className={`grid gap-5 ${items.length > 4 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {items.map((item, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                {item.icon && <div className="mb-3 text-2xl">{item.icon}</div>}
                <p className="font-semibold text-gray-900">{item.title}</p>
                {item.text && <p className="mt-2 text-sm text-gray-600">{item.text}</p>}
              </div>
            ))}
          </div>
        )}
        {/* Preis-Box für Angebot */}
        {type === 'offer' && content.price && (
          <div className="mt-10 rounded-2xl border-2 p-8 text-center" style={{ borderColor: accent }}>
            <p className="text-4xl font-bold" style={{ color: accent }}>{content.price as string}</p>
            {content.ctaLabel && (
              <a
                href={(content.ctaHref as string) || '#'}
                className="mt-6 inline-block rounded-full px-8 py-4 text-sm font-semibold text-white shadow-md"
                style={{ backgroundColor: accent }}
              >
                {content.ctaLabel as string}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
