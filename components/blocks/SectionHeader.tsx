import { cn } from '@/lib/utils/cn'

type AccentColor = 'orange' | 'blue' | 'red' | 'purple' | 'amber'

const COLOR_MAP: Record<AccentColor, { pill: string; dot: string }> = {
  orange: { pill: 'bg-orange-bg text-orange border-orange-border', dot: 'bg-orange' },
  blue:   { pill: 'bg-blue-bg text-blue border-blue-border', dot: 'bg-blue' },
  red:    { pill: 'bg-red-bg text-red border-red-border', dot: 'bg-red' },
  purple: { pill: 'bg-purple-bg text-purple border-purple', dot: 'bg-purple' },
  amber:  { pill: 'bg-amber-bg text-amber border-amber-bg', dot: 'bg-amber' },
}

interface SectionHeaderProps {
  eyebrow: string
  headline: string
  subtext?: string
  color?: AccentColor
  center?: boolean
  className?: string
}

export function SectionHeader({
  eyebrow,
  headline,
  subtext,
  color = 'orange',
  center = true,
  className,
}: SectionHeaderProps) {
  const colors = COLOR_MAP[color]

  return (
    <div className={cn(center ? 'text-center' : '', className)}>
      {/* Eyebrow pill */}
      <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest', colors.pill)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
        {eyebrow}
      </div>

      {/* Headline */}
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {headline}
      </h2>

      {/* Subtext */}
      {subtext && (
        <p className={cn('mt-4 text-base text-muted leading-relaxed', center ? 'mx-auto max-w-2xl' : '')}>
          {subtext}
        </p>
      )}
    </div>
  )
}
