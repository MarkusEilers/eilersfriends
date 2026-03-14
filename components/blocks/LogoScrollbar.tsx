'use client'

import { cn } from '@/lib/utils/cn'

interface Logo {
  name: string
  /** Either a URL string or just text */
  src?: string
}

interface LogoScrollbarProps {
  logos: Logo[]
  speed?: 'slow' | 'normal' | 'fast'
  className?: string
}

const SPEED_MAP = {
  slow: '40s',
  normal: '25s',
  fast: '15s',
}

export function LogoScrollbar({ logos, speed = 'normal', className }: LogoScrollbarProps) {
  // Duplicate for seamless loop
  const doubled = [...logos, ...logos]

  return (
    <div className={cn('overflow-hidden', className)} aria-hidden="true">
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{
          animation: `marquee ${SPEED_MAP[speed]} linear infinite`,
          width: 'max-content',
        }}
      >
        {doubled.map((logo, i) => (
          <div
            key={i}
            className="flex h-10 items-center justify-center px-2"
          >
            {logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo.src}
                alt={logo.name}
                className="h-7 w-auto object-contain opacity-40 grayscale transition-opacity hover:opacity-70"
              />
            ) : (
              <span className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
                {logo.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
