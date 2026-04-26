export function LpGeneric({ content }: { content: Record<string, any> }) {
  return (
    <section className="px-6 py-12 bg-white">
      <div className="mx-auto max-w-3xl">
        {content.headline && (
          <h2 className="mb-4 text-2xl font-bold" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        {content.body && (
          <p className="text-gray-600 leading-relaxed">{content.body as string}</p>
        )}
      </div>
    </section>
  )
}
