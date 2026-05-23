'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface Logo {
  name: string
  /** Color version — shown on hover when srcBw is also set */
  src?: string
  /** BW version — shown by default if present */
  srcBw?: string
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
            className="flex h-7 items-center justify-center px-2"
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
      <span className="group relative inline-block h-[18px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.srcBw}
          alt={logo.name}
          onError={() => setFailed(true)}
          className="h-[18px] w-auto object-contain opacity-60 transition-opacity duration-200 group-hover:opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.src}
          alt=""
          aria-hidden="true"
          className="absolute left-0 top-0 h-[18px] w-auto object-contain opacity-0 transition-opacity duration-200 group-hover:opacity-100"
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
      className="h-[18px] w-auto object-contain opacity-40 grayscale transition-all hover:opacity-90 hover:grayscale-0"
    />
  )
}
