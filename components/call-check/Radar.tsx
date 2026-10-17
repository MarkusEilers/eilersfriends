/**
 * Radar over the five criteria — light, inline, full content width.
 *
 * Honest about gaps: an axis without a score is not drawn at zero — that would
 * read as "failed". It gets a hatched wedge and its label says "not assessed".
 * The filled shape only connects the axes that were actually rated.
 *
 * The viewBox is wider than tall so long labels ("Eine Frage auf einmal")
 * always have room left and right of the chart and never get cut off.
 */

export interface RadarAxis { label: string; value: number | null }

const W = 760, H = 430

/** Break a label into at most two lines of ~18 characters. */
function lines(label: string): string[] {
  if (label.length <= 18) return [label]
  const words = label.split(' ')
  let a = ''
  for (const w of words) {
    if ((a + ' ' + w).trim().length > 18 && a) break
    a = (a + ' ' + w).trim()
  }
  const b = label.slice(a.length).trim()
  return b ? [a, b] : [a]
}

const THEME = {
  light: { ring: '#E5E7EB', label: '#111827', value: '#1A5FD4', stroke: '#1A5FD4', dot: '#0F1E3A' },
  dark: { ring: 'rgba(255,255,255,0.16)', label: '#FFFFFF', value: '#FFD37A', stroke: '#5DDBF5', dot: '#0F1E3A' },
}

export function Radar({ axes, notAssessed, theme = 'light' }: { axes: RadarAxis[]; notAssessed: string; theme?: 'light' | 'dark' }) {
  const c = THEME[theme]
  const cx = W / 2, cy = H / 2 + 6, r = 150
  const n = axes.length
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const pt = (i: number, v: number) => [cx + Math.cos(angle(i)) * r * v, cy + Math.sin(angle(i)) * r * v] as const

  const rings = [0.25, 0.5, 0.75, 1]
  const measured = axes.map((a, i) => ({ ...a, i })).filter((a) => a.value !== null)
  const shape = measured.map((a) => pt(a.i, (a.value ?? 0) / 100).join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-4xl" role="img"
      aria-label={axes.map((a) => `${a.label}: ${a.value ?? notAssessed}`).join(', ')}>
      <defs>
        <pattern id="radar-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#9CA3AF" strokeWidth="1.5" />
        </pattern>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#5DDBF5" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1A5FD4" stopOpacity="0.28" />
        </radialGradient>
      </defs>

      {rings.map((k) => (
        <polygon key={k} fill="none" stroke={c.ring} strokeWidth="1"
          points={axes.map((_, i) => pt(i, k).join(',')).join(' ')} />
      ))}

      {axes.map((a, i) => {
        const [x, y] = pt(i, 1)
        if (a.value !== null) {
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={c.ring} strokeWidth="1" />
        }
        const [x0, y0] = pt(i - 0.5, 1), [x1, y1] = pt(i + 0.5, 1)
        return (
          <g key={i}>
            <polygon points={`${cx},${cy} ${x0},${y0} ${x},${y} ${x1},${y1}`} fill="url(#radar-hatch)" opacity="0.3" />
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3 4" />
          </g>
        )
      })}

      {measured.length >= 3 && (
        <polygon points={shape} fill="url(#radar-fill)" stroke={c.stroke} strokeWidth="2" strokeLinejoin="round" />
      )}
      {measured.map((a) => {
        const [x, y] = pt(a.i, (a.value ?? 0) / 100)
        return <circle key={a.i} cx={x} cy={y} r="5" fill="#FFD37A" stroke={c.dot} strokeWidth="1.5" />
      })}

      {axes.map((a, i) => {
        const [x, y] = pt(i, 1.16)
        const anchor = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end'
        const ls = lines(a.label)
        const top = y < cy - r * 0.9
        // Labels above the top axis grow upwards, all others downwards from the point.
        const y0 = top ? y - (ls.length) * 16 : y - 8
        return (
          <text key={i} x={x} y={y0} textAnchor={anchor} fontSize="14" fontWeight="600"
            fill={a.value === null ? '#9CA3AF' : c.label}>
            {ls.map((l, k) => <tspan key={k} x={x} dy={k === 0 ? 0 : 16}>{l}</tspan>)}
            <tspan x={x} dy="20" fontSize="17" fontWeight="800" fill={a.value === null ? '#9CA3AF' : c.value}>
              {a.value === null ? notAssessed : a.value}
            </tspan>
          </text>
        )
      })}
    </svg>
  )
}
