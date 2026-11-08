type Logo = string | { src?: string; name?: string }

/** Logoleiste der Framework-Seiten. Einträge als Bild-URL oder { src, name }; ohne ladbares Bild wird der Name als Wortmarke gezeigt. */
export function LpSocialProof({ content }: { content: Record<string, any> }) {
  const logos = ((content.logos as Logo[]) ?? []).map((l) => (typeof l === 'string' ? { src: l, name: '' } : { src: l.src ?? '', name: l.name ?? '' }))
  const label = (content.eyebrow as string) || (content.headline as string) || ''
  if (!logos.length) return null
  return (
    <section className="lpx-logos border-y border-gray-100 bg-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {label && <p className="mb-5 text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(140px,1fr))`, gap: 1, background: '#EFEAE3', border: '1px solid #EFEAE3', borderRadius: 16, overflow: 'hidden' }}>
          {logos.map((l, i) => (
            <div key={i} style={{ background: '#fff', minHeight: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
              {l.name
                ? <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em', color: '#0D0D0B', opacity: 0.45, whiteSpace: 'nowrap' }}>{l.name}</span>
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={l.src} alt="" style={{ height: 28, maxWidth: '80%', objectFit: 'contain', filter: 'grayscale(1)', opacity: 0.5 }} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
