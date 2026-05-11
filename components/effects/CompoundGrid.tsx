'use client'

/**
 * Compound-Grid — Hero-background animation.
 *
 * Subtle navy dot-grid on cream. Every 2-3 s, two random nodes pulse coral
 * briefly before fading back to navy. The cursor has an influence radius
 * (~110 px) where dots scale up softly. No connecting lines — pure dots.
 *
 * Conveys the SalesMade thesis as ambient texture: a calm grid that
 * occasionally reacts. Never demands attention.
 *
 * Performance: Canvas2D + RAF. ~150 nodes. Respects prefers-reduced-motion
 * (renders static dots only).
 */
import { useEffect, useRef } from 'react'

interface Node { x: number; y: number; pulseT: number }

export function CompoundGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let nodes: Node[] = []
    const mouse = { x: -1000, y: -1000 }
    let lastNewEdgeT = 0
    let raf = 0

    function resize() {
      if (!canvas || !ctx) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const SPACING = 56
      const cols = Math.max(2, Math.floor(rect.width / SPACING))
      const rows = Math.max(2, Math.floor(rect.height / SPACING))
      const offX = (rect.width - (cols - 1) * SPACING) / 2
      const offY = (rect.height - (rows - 1) * SPACING) / 2
      nodes = []
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          nodes.push({ x: offX + x * SPACING, y: offY + y * SPACING, pulseT: 0 })
        }
      }
    }

    function onMove(e: MouseEvent) {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    function onLeave() {
      mouse.x = -1000
      mouse.y = -1000
    }

    function frame(t: number) {
      if (!ctx || !canvas) return
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      if (!reduced && t - lastNewEdgeT > 2200 + Math.random() * 1500) {
        if (nodes.length > 1) {
          // Two random pulses per cadence, no connecting line — keeps the
          // 'system reacting' feel without the visual noise of arcs.
          const idx = Math.floor(Math.random() * nodes.length)
          nodes[idx].pulseT = t
          const idx2 = Math.floor(Math.random() * nodes.length)
          if (idx2 !== idx) nodes[idx2].pulseT = t
          lastNewEdgeT = t
        }
      }

      for (const n of nodes) {
        const dx = n.x - mouse.x
        const dy = n.y - mouse.y
        const d = Math.sqrt(dx * dx + dy * dy)
        const cursorBoost = Math.max(0, 1 - d / 110)
        const pulseAge = (t - n.pulseT) / 1000
        const pulse = pulseAge >= 0 && pulseAge < 1.6 ? 1 - pulseAge / 1.6 : 0
        const r = 1.3 + cursorBoost * 1.6 + pulse * 1.0
        const opacity = 0.16 + cursorBoost * 0.40 + pulse * 0.28
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = pulse > 0
          ? `rgba(240,90,26,${opacity.toFixed(3)})`
          : `rgba(15,30,58,${opacity.toFixed(3)})`
        ctx.fill()
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseout', onLeave)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{ display: 'block' }}
    />
  )
}
