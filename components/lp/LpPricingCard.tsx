import { Check } from 'lucide-react'

export function LpPricingCard({
  content,
  accent,
}: { content: Record<string, any>; accent: string }) {
  const includes: string[] = Array.isArray(content.includes) ? content.includes : []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-2xl">
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

        <div
          className="rounded-3xl p-8 sm:p-10 shadow-xl"
          style={{ backgroundColor: 'white', border: `2px solid ${accent}` }}
        >
          {content.badge && (
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: accent, color: 'white' }}
            >
              {content.badge as string}
            </span>
          )}
          <h3 className="text-2xl font-bold" style={{ color: '#0D0D0B' }}>
            {content.title as string}
          </h3>
          {content.subtitle && (
            <p className="mt-2 text-sm text-gray-500">{content.subtitle as string}</p>
          )}

          {(content.price || content.priceLabel) && (
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-5xl font-bold" style={{ color: '#0D0D0B' }}>
                {content.price as string}
              </span>
              {content.priceLabel && (
                <span className="text-sm text-gray-500">{content.priceLabel as string}</span>
              )}
            </div>
          )}

          {includes.length > 0 && (
            <ul className="mt-8 space-y-3">
              {includes.map((f, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <Check size={18} className="flex-shrink-0 mt-0.5" style={{ color: accent }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          {content.ctaLabel && (
            <a
              href={(content.ctaHref as string) || '#'}
              className="mt-10 block w-full rounded-full px-6 py-4 text-center text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              {content.ctaLabel as string}
            </a>
          )}
          {content.fineprint && (
            <p className="mt-4 text-center text-xs text-gray-500">
              {content.fineprint as string}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
