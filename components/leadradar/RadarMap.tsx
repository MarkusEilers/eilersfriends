'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl, { type Map as MLMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { RATING, RADAR, type Rating } from './palette'

export interface RadarLead {
  id: string; org_name: string; branch: string | null; size_band: string | null
  city: string; country: string; lat: number; lon: number
  source: string; source_url: string | null
  signal: string; signal_kind: string; signal_quote: string | null; signal_at: string | null
  contact_name: string | null; contact_role: string | null
  icp_match: number; icp_reasons: string[]; signal_strength: number
  score: number; rating: Rating; found_at: string
}

/** Der Mittelpunkt des Radars — ungefaehr die Mitte des deutschsprachigen Raums. */
const CENTER: [number, number] = [10.9, 49.6]
const DACH_BOUNDS: [[number, number], [number, number]] = [[5.6, 45.6], [17.4, 55.2]]

/**
 * Ohne Mapbox-Zugangsschluessel laeuft die Karte auf einem freien Stil, der
 * anschliessend eingefaerbt wird. Zwei Umwege lagen dazwischen: ein Stilname,
 * den es nicht gibt, und ein dunkler Stil, dessen Kacheln von aussen nicht
 * erreichbar sind. Hier laufen Stil und Kacheln aus derselben Quelle. Liegt
 * ein Schluessel vor, wird der Mapbox-Stil genommen — die Ueberlagerung mit
 * Radar, Kreisen und Beruehrung bleibt in beiden Faellen dieselbe.
 */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const STYLE = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${MAPBOX_TOKEN}`
  : 'https://tiles.openfreemap.org/styles/positron'

/**
 * Der dunkle Stil ist fuer sich genommen fast schwarz — unter der Radar-Ebene
 * verschwindet er ganz. Statt eines helleren Stils faerben wir die Grenzen
 * gruen ein und daempfen alles andere. Ergebnis: Umrisse wie auf einem Schirm,
 * nicht wie auf einer Strassenkarte.
 */
function radarize(m: MLMap) {
  const style = m.getStyle()
  for (const layer of style?.layers ?? []) {
    const id = layer.id.toLowerCase()
    try {
      if (layer.type === 'background') {
        m.setPaintProperty(layer.id, 'background-color', '#050B10')
      } else if (id.includes('boundary') || id.includes('admin') || id.includes('border')) {
        // Landesgrenzen kraeftig, alles Kleinere nur angedeutet.
        const country = /_?0|country|state/.test(id)
        m.setPaintProperty(layer.id, 'line-color', country ? 'rgba(0,229,160,0.8)' : 'rgba(0,229,160,0.18)')
        m.setPaintProperty(layer.id, 'line-width', country ? 1.3 : 0.5)
        m.setPaintProperty(layer.id, 'line-opacity', 1)
        m.setPaintProperty(layer.id, 'line-dasharray', country ? [1, 0] : [2, 2])
      } else if (id.includes('water') || id.includes('ocean') || id.includes('sea')) {
        if (layer.type === 'fill') m.setPaintProperty(layer.id, 'fill-color', '#01151A')
        if (layer.type === 'line') m.setPaintProperty(layer.id, 'line-color', 'rgba(0,229,160,0.10)')
      } else if (layer.type === 'fill') {
        // Der helle Stil wuerde die Flaechen weiss malen — hier wird alles Land
        // zu einem dunklen Grund, auf dem der Schirm ueberhaupt erst wirkt.
        m.setPaintProperty(layer.id, 'fill-color', '#08131A')
        m.setPaintProperty(layer.id, 'fill-opacity', 0.9)
      } else if (layer.type === 'symbol') {
        const place = id.includes('place') || id.includes('city') || id.includes('country') || id.includes('town')
        if (!place) { m.setLayoutProperty(layer.id, 'visibility', 'none'); continue }
        m.setPaintProperty(layer.id, 'text-color', 'rgba(170,230,210,0.5)')
        m.setPaintProperty(layer.id, 'text-halo-color', 'rgba(0,0,0,0.85)')
        m.setPaintProperty(layer.id, 'text-halo-width', 1.2)
      } else if (layer.type === 'line') {
        m.setPaintProperty(layer.id, 'line-opacity', 0.10)
        m.setPaintProperty(layer.id, 'line-color', 'rgba(120,180,160,0.5)')
      }
    } catch { /* Stile aendern sich; ein Fehlschlag darf die Karte nicht kosten */ }
  }
}

const isFresh = (lead: RadarLead) => Date.now() - new Date(lead.found_at).getTime() < 24 * 3600 * 1000

export function RadarMap({
  leads, onHover, selected,
}: {
  leads: RadarLead[]
  onHover?: (lead: RadarLead | null) => void
  selected?: Rating[] | null
}) {
  const holder = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const map = useRef<MLMap | null>(null)
  const raf = useRef<number>(0)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const placed = useRef<Array<{ lead: RadarLead; x: number; y: number; r: number }>>([])
  const [hover, setHover] = useState<{ lead: RadarLead; x: number; y: number } | null>(null)
  const [ready, setReady] = useState(false)

  const visible = useCallback(
    (l: RadarLead) => !selected?.length || selected.includes(l.rating),
    [selected],
  )

  useEffect(() => {
    if (!holder.current || map.current) return
    const m = new maplibregl.Map({
      container: holder.current,
      style: STYLE,
      center: CENTER,
      zoom: 5.1,
      maxBounds: [[0.5, 41], [24, 58]],
      attributionControl: { compact: true },
    })
    m.on('load', () => {
      m.fitBounds(DACH_BOUNDS, { padding: 40, duration: 0 })
      radarize(m)
      setReady(true)
    })
    map.current = m
    return () => { m.remove(); map.current = null }
  }, [])

  // Radar, Kreise und Beruehrung liegen auf einer eigenen Leinwand ueber der
  // Karte. Hunderte einzelne Marker im DOM waeren langsamer und liessen sich
  // nicht sauber pulsieren.
  useEffect(() => {
    if (!ready) return
    const cv = canvas.current
    const m = map.current
    if (!cv || !m) return

    const draw = (t: number) => {
      const dpr = window.devicePixelRatio || 1
      const w = cv.clientWidth, h = cv.clientHeight
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr; cv.height = h * dpr
      }
      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const c = m.project(CENTER)
      const reach = Math.max(w, h) * 0.78

      // Ringe und Fadenkreuz
      ctx.save()
      ctx.strokeStyle = RADAR.grid
      ctx.lineWidth = 1
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath(); ctx.arc(c.x, c.y, (reach / 4) * i, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.beginPath()
      ctx.moveTo(c.x - reach, c.y); ctx.lineTo(c.x + reach, c.y)
      ctx.moveTo(c.x, c.y - reach); ctx.lineTo(c.x, c.y + reach)
      ctx.stroke()
      ctx.restore()

      // Der Strahl. Eine Umdrehung dauert acht Sekunden — schnell genug, dass
      // man ihn bemerkt, langsam genug, dass er nicht nervt.
      const angle = ((t / 8000) % 1) * Math.PI * 2
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.rotate(angle)
      const grad = ctx.createLinearGradient(0, 0, reach, 0)
      grad.addColorStop(0, 'rgba(0,229,160,0.00)')
      grad.addColorStop(1, 'rgba(0,229,160,0.30)')
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, reach, -0.42, 0)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,229,160,0.85)'
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(reach, 0); ctx.stroke()
      ctx.restore()

      // Punkte
      placed.current = []
      for (const lead of leads) {
        if (!visible(lead)) continue
        const p = m.project([lead.lon, lead.lat])
        if (p.x < -40 || p.y < -40 || p.x > w + 40 || p.y > h + 40) continue
        const cfg = RATING[lead.rating] ?? RATING.D
        const fresh = isFresh(lead)

        if (fresh) {
          // Herzschlag: zwei Schlaege, dann Pause — wie ein Puls, nicht wie ein
          // Blinklicht. Der Versatz je Lead verhindert, dass alles im Gleichtakt
          // zuckt.
          const off = (parseInt(lead.id.slice(0, 8), 16) % 1000) / 1000
          const beat = ((t / 1400) + off) % 1
          const pulse =
            beat < 0.12 ? beat / 0.12 :
            beat < 0.24 ? 1 - (beat - 0.12) / 0.12 :
            beat < 0.36 ? (beat - 0.24) / 0.12 * 0.7 :
            beat < 0.48 ? (1 - (beat - 0.36) / 0.12) * 0.7 : 0
          if (pulse > 0.01) {
            ctx.beginPath()
            ctx.arc(p.x, p.y, cfg.radius + pulse * 16, 0, Math.PI * 2)
            ctx.fillStyle = cfg.glow.replace(/[\d.]+\)$/, `${0.28 * (1 - pulse)})`)
            ctx.fill()
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, cfg.radius, 0, Math.PI * 2)
        ctx.fillStyle = cfg.color
        ctx.globalAlpha = fresh ? 1 : 0.72
        ctx.fill()
        ctx.globalAlpha = 1
        if (fresh) {
          ctx.strokeStyle = 'rgba(255,255,255,0.85)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
        placed.current.push({ lead, x: p.x, y: p.y, r: cfg.radius + 9 })
      }

      // Ortsnamen erscheinen erst bei Beruehrung — sonst ist die Karte zu.
      const pt = pointer.current
      if (pt) {
        let best: { lead: RadarLead; x: number; y: number } | null = null
        let bestD = Infinity
        for (const q of placed.current) {
          const d = Math.hypot(q.x - pt.x, q.y - pt.y)
          if (d < q.r && d < bestD) { bestD = d; best = { lead: q.lead, x: q.x, y: q.y } }
        }
        setHover((prev) => (prev?.lead.id === best?.lead.id ? prev : best))
      } else {
        setHover((prev) => (prev === null ? prev : null))
      }

      raf.current = requestAnimationFrame(draw)
    }
    raf.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf.current)
  }, [ready, leads, visible])

  useEffect(() => { onHover?.(hover?.lead ?? null) }, [hover, onHover])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl" style={{ background: RADAR.bg }}>
      <div ref={holder} className="absolute inset-0" />
      <canvas
        ref={canvas}
        className="absolute inset-0 h-full w-full"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top }
        }}
        onMouseLeave={() => { pointer.current = null }}
      />
      {hover && <LeadCard lead={hover.lead} x={hover.x} y={hover.y} />}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/55 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-300 backdrop-blur">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Radar DACH
      </div>
      {!MAPBOX_TOKEN && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/45 px-2 py-1 text-[10px] text-white/45">
          freier Kartenstil — mit NEXT_PUBLIC_MAPBOX_TOKEN auf Mapbox umschaltbar
        </div>
      )}
    </div>
  )
}

/** Die Karte am Zeiger: Passung, Signal, Ansprechpartner. */
function LeadCard({ lead, x, y }: { lead: RadarLead; x: number; y: number }) {
  const cfg = RATING[lead.rating] ?? RATING.D
  const flip = x > 520
  return (
    <div
      className="pointer-events-none absolute z-20 w-[310px] rounded-lg border p-3 text-white shadow-2xl backdrop-blur"
      style={{
        left: flip ? x - 322 : x + 14, top: Math.max(8, y - 90),
        background: 'rgba(6,14,20,0.94)', borderColor: cfg.color,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-bold leading-tight">{lead.org_name}</div>
          <div className="text-[11px] text-white/55">
            {lead.city} · {lead.branch ?? '—'}{lead.size_band ? ` · ${lead.size_band} MA` : ''}
          </div>
        </div>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-black text-black"
          style={{ background: cfg.color }}
        >
          {lead.rating}
        </span>
      </div>

      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/45">
          <span>ICP-Passung</span><span>{lead.icp_match}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${lead.icp_match}%`, background: cfg.color }} />
        </div>
        {lead.icp_reasons?.length > 0 && (
          <div className="mt-1.5 text-[10px] leading-snug text-white/50">{lead.icp_reasons.slice(0, 2).join(' · ')}</div>
        )}
      </div>

      <div className="mt-2.5 border-t border-white/10 pt-2">
        <div className="text-[10px] uppercase tracking-wider text-white/45">{lead.source}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-white/85">{lead.signal}</div>
        {lead.signal_quote && (
          <div className="mt-1 border-l-2 pl-2 text-[11px] italic leading-snug text-white/60" style={{ borderColor: cfg.color }}>
            {lead.signal_quote}
          </div>
        )}
      </div>

      <div className="mt-2.5 border-t border-white/10 pt-2 text-[11px]">
        {lead.contact_name ? (
          <div>
            <span className="font-semibold text-white">{lead.contact_name}</span>
            <span className="text-white/50"> · {lead.contact_role}</span>
          </div>
        ) : (
          <div className="text-amber-300/80">Ansprechpartner noch offen</div>
        )}
      </div>
    </div>
  )
}
