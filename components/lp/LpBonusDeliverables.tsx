import { Gift } from 'lucide-react'

export function LpBonusDeliverables({
  content,
  accent,
}: { content: Record<string, any>; accent: string }) {
  const items: { title: string; description?: string; badge?: string }[] =
    Array.isArray(content.items) ? content.items : []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-5xl">
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accent}15` }}
                >
                  <Gift size={18} style={{ color: accent }} />
                </div>
                {item.badge && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest"
                    style={{ backgroundColor: `${accent}15`, color: accent }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold" style={{ color: '#0D0D0B' }}>{item.title}</h3>
              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
