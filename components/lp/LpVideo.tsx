export function LpVideo({ content }: { content: Record<string, unknown> }) {
  const embedUrl = content.embedUrl as string
  if (!embedUrl) return null

  return (
    <section className="px-6 py-16" style={{ backgroundColor: '#0A0D14' }}>
      <div className="mx-auto max-w-4xl">
        {content.headline && (
          <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">
            {content.headline as string}
          </h2>
        )}
        <div className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl">
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
