'use client'

import { useEffect, useMemo, useState } from 'react'
import { RadarMap, type RadarLead } from './RadarMap'
import { RATING, RATINGS, type Rating } from './palette'

interface Summary {
  total: number; last24h: number
  byRating: Array<{ rating: string; count: number; last24h: number }>
  bySource: Array<{ source: string; count: number }>
  byCountry: Array<{ country: string; count: number }>
  topSignals: Array<{ signal_kind: string; count: number }>
  newestAt: string | null
}

const LAND = { DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz' } as const
const SIGNAL_LABEL: Record<string, string> = {
  stellenanzeige: 'Stellenanzeigen', register: 'Registeränderungen', audit: 'Audits und Zertifizierung',
  ausschreibung: 'Zuschläge', bewertung: 'Bewertungen', presse: 'Presse', sonstiges: 'Sonstiges',
}

export function LeadRadar({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [leads, setLeads] = useState<RadarLead[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [filter, setFilter] = useState<Rating[]>([])
  const [hovered, setHovered] = useState<RadarLead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch(`/api/admin/leadradar?companyId=${companyId}`)
      .then((r) => r.json())
      .then((d) => { if (alive && d.ok) { setLeads(d.leads); setSummary(d.summary) } })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [companyId])

  const fresh = useMemo(
    () => leads.filter((l) => Date.now() - new Date(l.found_at).getTime() < 24 * 3600 * 1000),
    [leads],
  )
  const toggle = (r: Rating) => setFilter((f) => (f.includes(r) ? f.filter((x) => x !== r) : [...f, r]))
  const count = (r: string) => summary?.byRating.find((x) => x.rating === r) ?? { count: 0, last24h: 0 }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      {/* Zusammenfassung */}
      <aside className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#070E14] p-4 text-white">
          <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Letzte 24 Stunden</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums">{summary?.last24h ?? (loading ? '·' : 0)}</span>
            <span className="text-sm text-white/50">neue Signale</span>
          </div>
          <div className="mt-1 text-[11px] text-white/40">
            {summary?.total ?? 0} im Bestand · {companyName}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#070E14] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/45">Bewertung</span>
            {filter.length > 0 && (
              <button onClick={() => setFilter([])} className="text-[10px] text-emerald-400 hover:underline">
                Filter zurücksetzen
              </button>
            )}
          </div>
          <div className="space-y-2">
            {RATINGS.map((r) => {
              const cfg = RATING[r]
              const c = count(r)
              const share = summary?.total ? (c.count / summary.total) * 100 : 0
              const on = filter.length === 0 || filter.includes(r)
              return (
                <button
                  key={r}
                  onClick={() => toggle(r)}
                  className="w-full rounded-lg px-2 py-2 text-left transition hover:bg-white/5"
                  style={{ opacity: on ? 1 : 0.35 }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[12px] font-black text-black"
                      style={{ background: cfg.color }}
                    >
                      {r}
                    </span>
                    <span className="flex-1 text-[12px] text-white/75">{cfg.label}</span>
                    <span className="tabular-nums text-[13px] font-bold text-white">{c.count}</span>
                    {c.last24h > 0 && (
                      <span
                        className="rounded px-1 text-[10px] font-bold"
                        style={{ background: `${cfg.color}22`, color: cfg.color }}
                      >
                        +{c.last24h}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full" style={{ width: `${share}%`, background: cfg.color }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#070E14] p-4 text-white">
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/45">Woher die Signale kamen</div>
          <div className="mt-2.5 space-y-1.5">
            {(summary?.topSignals ?? []).map((s) => (
              <div key={s.signal_kind} className="flex items-center justify-between text-[12px]">
                <span className="text-white/70">{SIGNAL_LABEL[s.signal_kind] ?? s.signal_kind}</span>
                <span className="tabular-nums font-semibold">{s.count}</span>
              </div>
            ))}
            {!summary?.topSignals?.length && (
              <div className="text-[11px] text-white/35">In den letzten 24 Stunden nichts Neues.</div>
            )}
          </div>
          <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
            {(summary?.byCountry ?? []).map((c) => (
              <div key={c.country} className="flex-1 rounded-lg bg-white/5 px-2 py-1.5 text-center">
                <div className="text-[15px] font-bold tabular-nums">{c.count}</div>
                <div className="text-[10px] text-white/45">{LAND[c.country as keyof typeof LAND] ?? c.country}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#070E14] p-4 text-white">
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/45">
            Frisch auf dem Schirm
          </div>
          <div className="mt-2 max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
            {fresh.slice(0, 12).map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition"
                style={{ background: hovered?.id === l.id ? 'rgba(255,255,255,0.07)' : 'transparent' }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: RATING[l.rating]?.color }} />
                <span className="flex-1 truncate text-[12px] text-white/80">{l.org_name}</span>
                <span className="shrink-0 text-[10px] text-white/35">{l.city}</span>
              </div>
            ))}
            {!fresh.length && !loading && (
              <div className="text-[11px] text-white/35">Heute noch nichts hereingekommen.</div>
            )}
          </div>
        </div>
      </aside>

      {/* Karte */}
      <div className="h-[720px] min-h-[520px]">
        <RadarMap leads={leads} selected={filter.length ? filter : null} onHover={setHovered} />
      </div>
    </div>
  )
}
