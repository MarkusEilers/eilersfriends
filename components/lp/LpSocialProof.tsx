export function LpSocialProof({ content }: { content: Record<string, unknown> }) {
  return (
    <section className="border-y border-gray-100 bg-white px-6 py-10">
      <div className="mx-auto max-w-4xl text-center">
        {content.headline && (
          <p className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">
            {content.headline as string}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale">
          {/* Logos werden als <img> aus content.logos[] gerendert */}
          {((content.logos as string[]) ?? []).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-8 object-contain" />
          ))}
          {(!content.logos || (content.logos as string[]).length === 0) && (
            <p className="text-sm text-gray-400">Logos werden im Editor hinterlegt</p>
          )}
        </div>
      </div>
    </section>
  )
}
