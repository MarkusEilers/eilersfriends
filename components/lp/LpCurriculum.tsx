export function LpCurriculum({
  content,
  accent,
}: { content: Record<string, any>; accent: string }) {
  const modules: { title: string; description?: string; lessons?: number }[] =
    Array.isArray(content.modules) ? content.modules : []

  return (
    <section className="px-6 py-20 bg-white">
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

        <div className="space-y-3">
          {modules.map((m, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-gray-100 bg-white open:bg-gray-50 transition-colors"
            >
              <summary className="flex cursor-pointer items-center gap-5 px-6 py-5">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: `${accent}15`, color: accent }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold" style={{ color: '#0D0D0B' }}>{m.title}</h3>
                  {m.lessons && (
                    <p className="text-xs text-gray-400 mt-0.5">{m.lessons} Lessons</p>
                  )}
                </div>
                <span
                  className="text-xl transition-transform group-open:rotate-45"
                  style={{ color: accent }}
                >
                  +
                </span>
              </summary>
              {m.description && (
                <div className="px-6 pb-5 pl-[3.75rem]">
                  <p className="text-sm leading-relaxed text-gray-600">{m.description}</p>
                </div>
              )}
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
