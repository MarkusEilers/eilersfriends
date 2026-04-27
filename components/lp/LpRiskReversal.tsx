import { Shield } from 'lucide-react'

export function LpRiskReversal({
  content,
  accent,
}: { content: Record<string, any>; accent: string }) {
  const paragraphs: string[] = Array.isArray(content.paragraphs)
    ? content.paragraphs
    : content.body
      ? [String(content.body)]
      : []

  return (
    <section className="px-6 py-16 bg-white">
      <div className="mx-auto max-w-3xl rounded-3xl p-8 sm:p-10" style={{ backgroundColor: `${accent}08`, border: `1px solid ${accent}25` }}>
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full mb-4"
            style={{ backgroundColor: 'white', border: `2px solid ${accent}` }}
          >
            <Shield size={22} style={{ color: accent }} />
          </div>
          {content.eyebrow && (
            <span className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>
              {content.eyebrow as string}
            </span>
          )}
          <h3 className="text-xl font-bold sm:text-2xl" style={{ color: '#0D0D0B' }}>
            {content.headline as string}
          </h3>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
