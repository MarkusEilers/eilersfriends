/**
 * Radar over the five criteria.
 *
 * Honest about gaps: an axis without a score is not drawn at zero — that would
 * read as "failed". It gets a hatched wedge and its label says "not assessed".
 * The filled shape only connects the axes that were actually rated.
 */

export interface RadarAxis { label: string; value: number | null }

export function Radar({ axes, notAssessed, size = 320 }: { axes: RadarAxis[]; notAssessed: string; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.34
  const n = axes.length
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const pt = (i: number, v: number) => [cx + Math.cos(angle(i)) * r * v, cy + Math.sin(angle(i)) * r * v] as const

  const rings = [0.25, 0.5, 0.75, 1]
  const measured = axes.map((a, i) => ({ ...a, i })).filter((a) => a.value !== null)
  const shape = measured.map((a) => pt(a.i, (a.value ?? 0) / 100).join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto" role="img">
      <defs>
        <pattern id="radar-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#9CA3AF" strokeWidth="1.5" />
        </pattern>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#5DDBF5" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1A5FD4" stopOpacity="0.35" />
        </radialGradient>
      </defs>

      {rings.map((k) => (
        <polygon key={k} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1"
          points={axes.map((_, i) => pt(i, k).join(',')).join(' ')} />
      ))}

      {axes.map((a, i) => {
        const [x, y] = pt(i, 1)
        if (a.value !== null) {
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        }
        const [x0, y0] = pt(i - 0.5, 1), [x1, y1] = pt(i + 0.5, 1)
        return (
          <g key={i}>
            <polygon points={`${cx},${cy} ${x0},${y0} ${x},${y} ${x1},${y1}`} fill="url(#radar-hatch)" opacity="0.35" />
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3 4" />
          </g>
        )
      })}

      {measured.length >= 3 && (
        <polygon points={shape} fill="url(#radar-fill)" stroke="#5DDBF5" strokeWidth="2" strokeLinejoin="round" />
      )}
      {measured.map((a) => {
        const [x, y] = pt(a.i, (a.value ?? 0) / 100)
        return <circle key={a.i} cx={x} cy={y} r="4" fill="#FFD37A" stroke="#0F1E3A" strokeWidth="1.5" />
      })}

      {axes.map((a, i) => {
        const [x, y] = pt(i, 1.24)
        const anchor = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end'
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
            className="text-[11px] font-semibold" fill={a.value === null ? '#9CA3AF' : '#FFFFFF'}>
            <tspan x={x} dy="-0.4em">{a.label}</tspan>
            <tspan x={x} dy="1.25em" fill={a.value === null ? '#9CA3AF' : '#FFD37A'} className="font-bold">
              {a.value === null ? notAssessed : a.value}
            </tspan>
          </text>
        )
      })}
    </svg>
  )
}
