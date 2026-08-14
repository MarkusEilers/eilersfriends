/** Kleiner Fortschrittsring — Circle.so-artig, ruhig und klein. */
export function ProgressRing({ value, size = 34, done = false }: { value: number; size?: number; done?: boolean }) {
  const r = (size - 4) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, done ? 100 : value))
  const color = done ? '#067647' : '#1A5FD4'
  return (
    <svg width={size} height={size} className="flex-shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={3} />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      )}
    </svg>
  )
}
