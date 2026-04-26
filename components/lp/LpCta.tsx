export function LpCta({ content, accent }: { content: Record<string, unknown>; accent: string }) {
  return (
    <section className="px-6 py-20 bg-white">
      <div className="mx-auto max-w-2xl text-center">
        {content.headline && (
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        {content.body && (
          <p className="mt-4 text-gray-500">{content.body as string}</p>
        )}
        {content.ctaLabel && (
          <a
            href={(content.ctaHref as string) || '#'}
            className="mt-8 inline-block rounded-full px-10 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {content.ctaLabel as string}
          </a>
        )}
      </div>
    </section>
  )
}
