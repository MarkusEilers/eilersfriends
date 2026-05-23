'use client'

import { useEffect, useState } from 'react'

/**
 * Read-Progress-Bar — sticky 2px Strich oben auf der Page,
 * füllt sich mit Scroll-Progress.
 */
export function ReadProgress({ color = '#1A5FD4' }: { color?: string }) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    function onScroll() {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0
      setPct(Math.max(0, Math.min(100, p)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 60,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 80ms linear',
        }}
      />
    </div>
  )
}
