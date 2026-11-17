/** Die Umsatz-Reise als Trichter: oben breit, unten schmal. Farbe je Stufe (Ampel) oder „beantwortet“. */
export function Journey({ stages, current, first, dark = false, anim = false, firstTag }: {
  stages: { key: string; name: string; state?: 'red' | 'yellow' | 'green' | 'on' }[]
  current?: string
  first?: string | null
  dark?: boolean
  anim?: boolean
  firstTag?: string
}) {
  const n = stages.length
  return (
    <div className={`journey${dark ? ' dark' : ''}${anim ? ' anim' : ''}`} role="list">
      {stages.map((s, i) => {
        const w = 100 - (i * 38) / Math.max(1, n - 1)
        const isFirst = first === s.key
        return (
          <div className="seg" role="listitem" key={s.key} style={{ width: `${w}%`, ['--i' as string]: i } as React.CSSProperties}>
            <div className={`bar ${s.state ?? ''}${isFirst ? ' first' : ''}${current === s.key ? ' cur' : ''}`}>
              <span className="ix">{i + 1}</span>{s.name}
              {isFirst && firstTag && <span className="tag">{firstTag}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
