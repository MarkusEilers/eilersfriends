interface Testimonial { name: string; role: string; text: string; avatar?: string; rating?: number }

export function LpTestimonials({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Testimonial[]) ?? []

  return (
    <section className="px-6 py-16" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-5xl">
        {content.headline && (
          <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {item.rating && (
                <div className="mb-3 text-yellow-400">{'★'.repeat(item.rating)}</div>
              )}
              <p className="text-sm leading-relaxed text-gray-700">&ldquo;{item.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                {item.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatar} alt={item.name} className="h-10 w-10 rounded-full object-cover grayscale" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                    {item.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
