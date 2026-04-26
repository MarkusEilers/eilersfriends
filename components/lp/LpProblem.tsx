export function LpProblem({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as string[]) ?? []

  return (
    <section className="px-6 py-16" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-3xl">
        {content.headline && (
          <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        {items.length > 0 && (
          <ul className="space-y-4">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-4 rounded-2xl border border-red-100 bg-white p-5">
                <span className="mt-0.5 text-red-400 text-lg">✗</span>
                <p className="text-base text-gray-700">{item}</p>
              </li>
            ))}
          </ul>
        )}
        {content.body && <p className="mt-8 text-center text-gray-600">{content.body as string}</p>}
      </div>
    </section>
  )
}
