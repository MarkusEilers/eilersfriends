/**
 * Subtle squared / Karo grid background pattern.
 * Replaces the floating "blur orbs" on hero sections — semantic-neutral
 * texture instead of decorative blobs.
 *
 * Renders as an absolute-positioned div that fills its (relative) parent.
 * Use inside <section className="relative">…</section>.
 */
export function KaroPattern({
  color = 'currentColor',
  opacity = 0.05,
  size = 32,
  className = '',
}: {
  color?: string
  opacity?: number
  size?: number
  className?: string
}) {
  // CSS gradient grid: thin lines spaced `size` px apart, opacity 5%
  // No alpha-multiply on the gradient color → opacity is on the wrapper.
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
          backgroundSize: `${size}px ${size}px`,
          // Soft fade at edges — radial mask so the grid doesn't end harshly
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }}
      />
    </div>
  )
}

/**
 * Variation: fade-from-corner (like the old blur orbs were positioned
 * top-right or bottom-left). Useful when you want the texture to feel
 * "anchored" to one corner instead of centered.
 */
export function KaroPatternCorner({
  color = 'currentColor',
  opacity = 0.06,
  size = 32,
  corner = 'top-right',
  className = '',
}: {
  color?: string
  opacity?: number
  size?: number
  corner?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}) {
  const maskMap: Record<string, string> = {
    'top-right':    'radial-gradient(ellipse 60% 60% at 100% 0%, black 0%, transparent 70%)',
    'top-left':     'radial-gradient(ellipse 60% 60% at 0% 0%, black 0%, transparent 70%)',
    'bottom-right': 'radial-gradient(ellipse 60% 60% at 100% 100%, black 0%, transparent 70%)',
    'bottom-left':  'radial-gradient(ellipse 60% 60% at 0% 100%, black 0%, transparent 70%)',
  }
  const mask = maskMap[corner]

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
          backgroundSize: `${size}px ${size}px`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
    </div>
  )
}
