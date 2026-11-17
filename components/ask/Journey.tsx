/** Die Umsatz-Reise als Trichter: oben breit, unten schmal. Farbe je Stufe (Ampel) oder „beantwortet“. */
export function Journey({ stages, current, first }: {
  stages: { key: string; name: string; state?: 'red' | 'yellow' | 'green' | 'on' }[]
  current?: string
  first?: string | null
}) {
  const n = stages.length
  return (
    <div className="journey" role="list">
      {stages.map((s, i) => {
        const w = 100 - (i * 36) / Math.max(1, n - 1)
        return (
          <div className="seg" role="listitem" key={s.key} style={{ width: `${w}%` }}>
            <div className={`bar ${s.state ?? ''}${first === s.key ? ' first' : ''}`} style={{ width: '100%', outline: current === s.key ? '2px solid var(--blue)' : undefined, outlineOffset: 2 }}>
              <span style={{ opacity: .6, marginRight: 8, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>{s.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
