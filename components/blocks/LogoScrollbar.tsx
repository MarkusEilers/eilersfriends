'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface Logo {
  name: string
  /** Color version — shown on hover when srcBw is also set */
  src?: string
  /** BW version — shown by default if present */
  srcBw?: string
  /** Per-logo perceptual height adjustment in % (50-150). Default 100. */
  displayScale?: number
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

  // When the doubled set fits the viewport, the marquee is invisible-still →
  // we center on the page using justify-center. When it overflows, the
  // animation kicks in and width:max-content takes precedence.
  const tripled = [...logos, ...logos, ...logos]
  return (
    <div className={cn('overflow-hidden', className)} aria-hidden="true">
      <div
        className="flex gap-12 whitespace-nowrap justify-center mx-auto"
        style={{
          animation: `marquee ${SPEED_MAP[speed]} linear infinite`,
          width: 'max-content',
        }}
      >
        {tripled.map((logo, i) => (
          <div
            key={i}
            className="flex h-12 w-[160px] items-center justify-center px-3"
          >
            <LogoItem logo={logo} />
          </div>
        ))}
      </div>
    </div>
  )
}


function LogoItem({ logo }: { logo: Logo }) {
  const [failed, setFailed] = useState(false)
  if (!logo.src || failed) {
    return (
      <span className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
        {logo.name}
      </span>
    )
  }
  // If BW variant exists, stack two <img>s — BW default, color on hover.
  if (logo.srcBw) {
    return (
      <span className="group relative flex h-10 w-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.srcBw}
          alt={logo.name}
          onError={() => setFailed(true)}
          className="max-h-10 max-w-full object-contain opacity-60 transition-opacity duration-200 group-hover:opacity-0"
          style={{ transform: `scale(${(logo.displayScale ?? 100) / 100})` }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 m-auto max-h-10 max-w-full object-contain opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ transform: `scale(${(logo.displayScale ?? 100) / 100})` }}
        />
      </span>
    )
  }
  // Fallback: single image, CSS grayscale + opacity (legacy SVGs without baked BW)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      alt={logo.name}
      onError={() => setFailed(true)}
      className="max-h-10 max-w-full object-contain opacity-50 grayscale transition-all hover:opacity-90 hover:grayscale-0"
      style={{ transform: `scale(${(logo.displayScale ?? 100) / 100})` }}
    />
  )
}
