import { cn } from '@/lib/utils/cn'

type TagColor = 'orange' | 'blue' | 'red' | 'purple' | 'amber' | 'gray'

const COLOR_MAP: Record<TagColor, string> = {
  orange: 'bg-orange-bg text-orange border-orange-border',
  blue:   'bg-blue-bg text-blue border-blue-border',
  red:    'bg-red-bg text-red border-red-border',
  purple: 'bg-purple-bg text-purple border-purple',
  amber:  'bg-amber-bg text-amber border-amber-bg',
  gray:   'bg-gray-100 text-gray-600 border-gray-200',
}

interface PillTagProps {
  children: React.ReactNode
  color?: TagColor
  className?: string
}

export function PillTag({ children, color = 'orange', className }: PillTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        COLOR_MAP[color],
        className
      )}
    >
      {children}
    </span>
  )
}
