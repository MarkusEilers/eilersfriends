export function LpOriginStory({
  content,
  accent,
}: { content: Record<string, any>; accent: string }) {
  const paragraphs: string[] = Array.isArray(content.paragraphs)
    ? content.paragraphs
    : content.body
      ? [String(content.body)]
      : []

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-3xl">
        {content.eyebrow && (
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: accent, backgroundColor: 'white', border: `1px solid ${accent}33` }}
          >
            {content.eyebrow as string}
          </span>
        )}
        {content.headline && (
          <h2 className="text-3xl font-bold sm:text-4xl mb-8" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h2>
        )}
        <div className="space-y-6 text-base leading-relaxed text-gray-700">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {content.pullquote && (
          <blockquote
            className="mt-10 rounded-2xl border-l-4 px-6 py-5 italic text-lg"
            style={{ borderColor: accent, backgroundColor: 'white', color: '#0D0D0B' }}
          >
            „{content.pullquote as string}"
          </blockquote>
        )}
      </div>
    </section>
  )
}
