/**
 * Cinematic SVG illustrations for each framework card.
 * No external assets — pure SVG gradients + geometric shapes.
 * Positioned absolute inside a relative parent.
 */
export function FrameworkArt({
  slug,
  accent,
  imageUrl,
}: {
  slug: string
  accent: string
  imageUrl?: string | null
}) {
  // If a generated image is available, prefer it over the SVG illustration
  if (imageUrl) {
    return (
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    )
  }

  switch (slug) {
    case 'instant-influence':
    case 'instant-authority':
      // Concentric ripples — first conversation, ripples of influence
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="ii-grad" cx="80%" cy="60%" r="80%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="600" height="400" fill="url(#ii-grad)" />
          {/* Concentric arcs from bottom-right */}
          {[80, 130, 190, 260, 340, 430].map((r, i) => (
            <circle key={i} cx="500" cy="280" r={r} fill="none" stroke={accent} strokeOpacity={0.16 - i * 0.02} strokeWidth={1.5} />
          ))}
          {/* Anchor dot */}
          <circle cx="500" cy="280" r="6" fill={accent} fillOpacity={0.7} />
        </svg>
      )

    case 'b2b-angebote':
      // Target with offset rings — "unwiderstehliche Angebote"
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="bo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="600" height="400" fill="url(#bo-grad)" />
          {/* Target ring set 1 */}
          <g transform="translate(150, 320)">
            {[80, 60, 40, 22].map((r, i) => (
              <circle key={i} cx="0" cy="0" r={r} fill="none" stroke={accent} strokeOpacity={0.18 + i * 0.05} strokeWidth={1.5} />
            ))}
            <circle cx="0" cy="0" r="6" fill={accent} fillOpacity={0.7} />
          </g>
          {/* Arrow vector */}
          <path d="M 480 50 L 160 310" stroke={accent} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="4 5" fill="none" />
          <polygon points="160,310 175,302 168,318" fill={accent} fillOpacity={0.5} />
        </svg>
      )

    case 'hailiom':
      // Sparkle/star pattern — AI content explosion
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="hl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.20" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="600" height="400" fill="url(#hl-grad)" />
          {/* Sparkle clusters */}
          {[
            { x: 480, y: 80, s: 28 }, { x: 510, y: 200, s: 16 }, { x: 380, y: 60, s: 12 },
            { x: 440, y: 290, s: 20 }, { x: 540, y: 320, s: 10 },
          ].map((sp, i) => (
            <g key={i} transform={`translate(${sp.x}, ${sp.y})`}>
              <path
                d={`M 0 -${sp.s} L ${sp.s/3} -${sp.s/3} L ${sp.s} 0 L ${sp.s/3} ${sp.s/3} L 0 ${sp.s} L -${sp.s/3} ${sp.s/3} L -${sp.s} 0 L -${sp.s/3} -${sp.s/3} Z`}
                fill={accent}
                fillOpacity={0.18 + (5 - i) * 0.04}
              />
            </g>
          ))}
        </svg>
      )

    case 'beef-radar':
      // Radar sweep — concentric + sweeping line
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="br-grad" cx="100%" cy="50%" r="70%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.20" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="600" height="400" fill="url(#br-grad)" />
          {/* Radar concentric */}
          <g transform="translate(500, 200)">
            {[60, 110, 160, 220].map((r, i) => (
              <circle key={i} cx="0" cy="0" r={r} fill="none" stroke={accent} strokeOpacity={0.20 - i * 0.03} strokeWidth={1.5} />
            ))}
            {/* Crosshair */}
            <line x1="-220" y1="0" x2="220" y2="0" stroke={accent} strokeOpacity={0.18} strokeWidth={1} />
            <line x1="0" y1="-220" x2="0" y2="220" stroke={accent} strokeOpacity={0.18} strokeWidth={1} />
            {/* Sweep line */}
            <line x1="0" y1="0" x2="180" y2="-90" stroke={accent} strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
            <circle cx="0" cy="0" r="5" fill={accent} fillOpacity={0.8} />
          </g>
        </svg>
      )

    case 'core-messages':
      // Sun-rays / lightbulb — radiating insight
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="cm-grad" cx="80%" cy="50%" r="60%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.20" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="600" height="400" fill="url(#cm-grad)" />
          {/* 11 rays from a center — matches "11 Botschaften" */}
          <g transform="translate(490, 200)">
            {Array.from({ length: 11 }).map((_, i) => {
              const a = (i / 11) * Math.PI * 2 - Math.PI / 2
              const x = Math.cos(a) * 180
              const y = Math.sin(a) * 180
              const x1 = Math.cos(a) * 30
              const y1 = Math.sin(a) * 30
              return <line key={i} x1={x1} y1={y1} x2={x} y2={y} stroke={accent} strokeOpacity={0.35} strokeWidth={1.5} strokeLinecap="round" />
            })}
            <circle cx="0" cy="0" r="22" fill={accent} fillOpacity={0.18} />
            <circle cx="0" cy="0" r="10" fill={accent} fillOpacity={0.55} />
          </g>
        </svg>
      )

    case 'strategic-preparation':
      // Branching paths — decision tree
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="sp-grad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.20" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="600" height="400" fill="url(#sp-grad)" />
          {/* Branches */}
          <g stroke={accent} fill="none" strokeWidth={1.5} strokeOpacity={0.30}>
            <line x1="380" y1="200" x2="490" y2="80" />
            <line x1="380" y1="200" x2="540" y2="200" />
            <line x1="380" y1="200" x2="490" y2="320" />
            <line x1="490" y1="80" x2="560" y2="40" />
            <line x1="490" y1="80" x2="560" y2="120" />
            <line x1="490" y1="320" x2="560" y2="280" />
            <line x1="490" y1="320" x2="560" y2="360" />
          </g>
          {[
            [380, 200, 7], [490, 80, 5], [540, 200, 5], [490, 320, 5],
            [560, 40, 4], [560, 120, 4], [560, 280, 4], [560, 360, 4],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={accent} fillOpacity={0.55} />
          ))}
        </svg>
      )

    case 'recommendation-pitch':
      // Speech-bubble + arrow — recommendation flowing
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="rp-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="600" height="400" fill="url(#rp-grad)" />
          {/* Big rounded square + tail (chat bubble) */}
          <g transform="translate(420, 130)" stroke={accent} fill="none" strokeWidth={2} strokeOpacity={0.5}>
            <rect x="0" y="0" width="140" height="100" rx="20" />
            <path d="M 30 100 L 30 130 L 60 100" />
          </g>
          {/* Smaller bubble overlapping */}
          <g transform="translate(380, 240)" stroke={accent} fill="none" strokeWidth={1.5} strokeOpacity={0.30}>
            <rect x="0" y="0" width="100" height="70" rx="14" />
          </g>
          {/* Three dots inside big bubble */}
          {[455, 485, 515].map((cx) => (
            <circle key={cx} cx={cx} cy="180" r="4" fill={accent} fillOpacity={0.7} />
          ))}
        </svg>
      )

    default:
      // Generic dot grid fallback
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="dots-fb" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.5" fill={accent} fillOpacity={0.20} />
            </pattern>
          </defs>
          <rect width="600" height="400" fill={`${accent}08`} />
          <rect width="600" height="400" fill="url(#dots-fb)" />
        </svg>
      )
  }
}
