'use client'

/**
 * Compound-Grid — Hero-background animation.
 *
 * Subtle navy dot-grid on cream. Periodically a node pulses coral and a thin
 * line draws to its nearest neighbour (~one new edge every 3.5-5 s). The cursor
 * has an influence radius (~110 px) where dots scale up softly.
 *
 * Conveys the SalesMade thesis: predictable revenue is a *system* of small,
 * connected moves — not a hero pitch. Calm cadence, reactive to the user's
 * pointer, never demanding attention.
 *
 * Performance: Canvas2D + RAF. ~150 nodes / max 50 live edges. Respects
 * prefers-reduced-motion (renders static dots only).
 */
import { useEffect, useRef } from 'react'

interface Node { x: number; y: number; pulseT: number }
interface Edge { from: number; to: number; bornT: number }

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
    let edges: Edge[] = []
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
      edges = []
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

    function findNearest(idx: number): number {
      const me = nodes[idx]
      let best = -1
      let bestD = Infinity
      for (let i = 0; i < nodes.length; i++) {
        if (i === idx) continue
        const exists = edges.some(
          (e) => (e.from === idx && e.to === i) || (e.from === i && e.to === idx),
        )
        if (exists) continue
        const dx = nodes[i].x - me.x
        const dy = nodes[i].y - me.y
        const d = dx * dx + dy * dy
        if (d < bestD) { bestD = d; best = i }
      }
      return best
    }

    function frame(t: number) {
      if (!ctx || !canvas) return
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      if (!reduced && t - lastNewEdgeT > 3500 + Math.random() * 1500) {
        if (nodes.length > 1 && edges.length < 50) {
          const idx = Math.floor(Math.random() * nodes.length)
          const tgt = findNearest(idx)
          if (tgt >= 0) {
            edges.push({ from: idx, to: tgt, bornT: t })
            nodes[idx].pulseT = t
            nodes[tgt].pulseT = t
            lastNewEdgeT = t
          }
        }
      }

      for (const e of edges) {
        const age = (t - e.bornT) / 1000
        const draw = Math.min(1, age / 0.6)
        const fade = age < 8 ? 1 : Math.max(0, 1 - (age - 8) / 4)
        const opacity = fade * 0.32
        if (opacity <= 0) continue
        const a = nodes[e.from]
        const b = nodes[e.to]
        ctx.beginPath()
        ctx.strokeStyle = `rgba(26,95,212,${opacity.toFixed(3)})`
        ctx.lineWidth = 1
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(a.x + (b.x - a.x) * draw, a.y + (b.y - a.y) * draw)
        ctx.stroke()
      }
      edges = edges.filter((e) => (t - e.bornT) / 1000 < 14)

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
