'use client'

import { useState } from 'react'
import { Info, Loader2, Save, Sparkles, X } from 'lucide-react'
import type { BeefRadarCard, BuildingBlock } from '@/lib/wizard-v2/types'

interface Props {
  draftId: string
  buildingBlocks: BuildingBlock[]
  initialCards?: BeefRadarCard[]
  onSaved?: () => void
}

/** Anti-pattern table — collapsed by default, expands when user clicks „Bullshit-Detector". */
const ANTI_PATTERN_TABLE: Array<{ floskel: string; beef: string }> = [
  { floskel: 'Mehr Effizienz', beef: '−45 Min/Tag pro Behandler' },
  { floskel: 'Schneller im Markt', beef: 'Sales-Cycle 6 → 3 Mo' },
  { floskel: 'Bessere Qualität', beef: 'Bug-Rate ø 0,3/100 Story-Points' },
  { floskel: 'Mehr Umsatz', beef: '+15 MQLs pro Monat' },
  { floskel: 'Höhere Zufriedenheit', beef: 'NPS +18 nach 90 Tagen' },
  { floskel: 'Skalierbarkeit', beef: 'Ramp-Up 12 → 4 Wochen' },
  { floskel: 'Mehr Sichtbarkeit', beef: 'Marketing-Budget +25 % vor Board verteidigbar' },
  { floskel: 'Bessere Entscheidungen', beef: 'Forecast-Accuracy +25 %' },
]

interface BeefRow {
  blockId: string
  blockName: string
  blockDescription: string
  how: string
  why: string
  isBonus: boolean
}

function buildRowsFromCards(blocks: BuildingBlock[], cards: BeefRadarCard[]): BeefRow[] {
  return blocks.map((b) => {
    const how = cards.find((c) => c.buildingBlockId === b.id && c.column === 'how')?.text ?? ''
    const why = cards.find((c) => c.buildingBlockId === b.id && c.column === 'why')?.text ?? ''
    return { blockId: b.id, blockName: b.name, blockDescription: b.description, how, why, isBonus: b.isBonus }
  })
}

export function Step04BeefRadar({ draftId, buildingBlocks, initialCards = [], onSaved }: Props) {
  const [rows, setRows] = useState<BeefRow[]>(() => buildRowsFromCards(buildingBlocks, initialCards))
  const [suggesting, setSuggesting] = useState(false)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showAntiPattern, setShowAntiPattern] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function suggestAll() {
    setSuggesting(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step04/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: buildingBlocks }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'AI-Suggest fehlgeschlagen.'); return }
      const incoming: Array<{ buildingBlockId: string; how: string; why: string }> = data.cards ?? []
      setRows((prev) => prev.map((r) => {
        const match = incoming.find((c) => c.buildingBlockId === r.blockId)
        if (!match) return r
        return { ...r, how: r.how || match.how || '', why: r.why || match.why || '' }
      }))
    } catch (e) { setError(String(e)) }
    finally { setSuggesting(false) }
  }

  async function suggestRow(blockId: string) {
    setSuggesting(true); setError(null)
    try {
      const block = buildingBlocks.find((b) => b.id === blockId)
      if (!block) return
      const res = await fetch(`/api/wizard/v2/${draftId}/step04/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: [block], onlyOne: true }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'AI-Suggest fehlgeschlagen.'); return }
      const incoming: Array<{ buildingBlockId: string; how: string; why: string }> = data.cards ?? []
      setRows((prev) => prev.map((r) => {
        if (r.blockId !== blockId) return r
        const match = incoming.find((c) => c.buildingBlockId === blockId)
        if (!match) return r
        return { ...r, how: match.how ?? '', why: match.why ?? '' }
      }))
    } catch (e) { setError(String(e)) }
    finally { setSuggesting(false) }
  }

  function updateRow(blockId: string, patch: Partial<BeefRow>) {
    setRows((prev) => prev.map((r) => (r.blockId === blockId ? { ...r, ...patch } : r)))
  }

  async function saveAll() {
    setSaving('saving'); setError(null)
    try {
      const cards: Array<Partial<BeefRadarCard>> = []
      for (const r of rows) {
        if (r.how.trim()) cards.push({ buildingBlockId: r.blockId, column: 'how', text: r.how.trim() })
        if (r.why.trim()) cards.push({ buildingBlockId: r.blockId, column: 'why', text: r.why.trim() })
      }
      const res = await fetch(`/api/wizard/v2/${draftId}/step04`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Speichern fehlgeschlagen.'); setSaving('idle'); return }
      setSaving('saved')
      setTimeout(() => setSaving('idle'), 2000)
      onSaved?.()
    } catch (e) { setError(String(e)); setSaving('idle') }
  }

  if (buildingBlocks.length === 0) {
    return (
      <section className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" />
            Schritt 04
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">Beef-Radar.</h2>
          <div className="mt-8 rounded-2xl border border-amber bg-amber-bg p-6 text-amber">
            <p className="font-semibold">Bausteine fehlen.</p>
            <p className="mt-2 text-sm">
              Trag erst in Schritt 01 Deine Top 5 Bausteine ein — der Beef-Radar braucht sie als Spalte 1.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-cream px-6 py-20">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" />
            Schritt 04
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">Beef-Radar.</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Was bewirkt jeder Baustein konkret — und welche zweite Welle löst das aus? Typische B2B-Angebote verkaufen Features. Kunden kaufen Effekte und Welleneffekte. WHAT (grau) ist Deine Baustein-Spalte aus Schritt 01. HOW (blau) ist der direkte Effekt. WHY (orange) ist das Beef — die messbare Welleneffekt-Wirkung.
          </p>
        </div>

        {/* Markus-Lehre (✓ verified) */}
        <div className="mb-10 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">Markus' Lehre</span>
            <span className="rounded-full bg-blue-bg px-2 py-0.5 text-[10px] font-bold uppercase text-blue">14 Features → Beef</span>
          </div>
          <blockquote className="font-serif text-lg italic leading-relaxed text-gray-800">
            „In den ersten zehn Jahren in meinem Systemhaus haben wir Angebote mit vierzehn Features geschrieben. Jedes Feature war stolz erkämpft, jedes hatte seinen Platz. Bis ein Kunde, mit dem ich gerade unterschrieb, mir am Tisch sagte: ‚Markus, jetzt mal ehrlich — was bedeutet das alles für meine Firma? Konkret?'
            <br /><br />
            Ich konnte es nicht in einem Satz sagen.
            <br /><br />
            Das war der Tag, an dem das Beef-Radar entstanden ist. Die Regel ist seitdem: Wenn ich bei einem Baustein nicht in einem Satz sagen kann, was er beim Kunden auslöst, gehört er entweder neu gedacht — oder raus. Das hat unsere Angebote kürzer gemacht. Und kürzere Angebote werden öfter unterschrieben."
          </blockquote>
        </div>

        {/* Struggle-Anerkennung */}
        <div className="mb-8 rounded-2xl border border-red-border bg-red-bg p-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red">Hier wird's unbequem</p>
          <p className="text-sm leading-relaxed text-gray-700">
            Beim Schreiben merkst Du, dass Du für manche Bausteine keinen echten Effekt formulieren kannst. Dass Du Dich an Floskeln festhältst wie „professionelle Betreuung" oder „umfassendes Knowhow", weil Dir die konkrete Wirkung fehlt. <strong>Das ist nicht Versagen — das ist Diagnose.</strong> Genau diese Bausteine gehören entweder neu gedacht, anders verpackt oder raus. Kunden zahlen für Effekte, nicht für Deine Mühe.
          </p>
        </div>

        {/* Bullshit-Detector toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowAntiPattern((x) => !x)}
            className="inline-flex items-center gap-2 rounded-full border border-orange-border bg-orange-bg px-4 py-2 text-xs font-semibold text-orange hover:bg-orange-bg/70"
          >
            <Info size={12} />
            {showAntiPattern ? 'Bullshit-Detector schliessen' : 'Bullshit-Detector öffnen — Floskel → Beef'}
          </button>
          {showAntiPattern && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-orange-border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-orange-border bg-orange-bg">
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-orange">Floskel (Anti-Pattern)</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-orange">Mit Beef (Pattern)</th>
                  </tr>
                </thead>
                <tbody>
                  {ANTI_PATTERN_TABLE.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 text-gray-500 italic">{r.floskel}</td>
                      <td className="px-4 py-2 font-medium text-ink">{r.beef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Suggest All */}
        <div className="mb-8">
          <button
            onClick={suggestAll}
            disabled={suggesting}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue/90 disabled:opacity-50"
          >
            {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {suggesting ? 'AI fuellt HOW + WHY…' : 'AI: HOW + WHY pro Baustein vorschlagen'}
          </button>
          <p className="mt-2 text-xs italic text-muted">Nutzt Company-Profile + ICP + Herausforderungen als Anker. Ueberschreibt nichts, was Du schon getippt hast.</p>
        </div>

        {/* Sticky-Notes Grid */}
        <div className="overflow-x-auto">
          <div className="grid min-w-[800px] grid-cols-[1fr_1.4fr_1.6fr] gap-4 sm:gap-6">
            <div>
              <p className="mb-3 border-b-2 border-gray-600 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                WHAT — Baustein
              </p>
              {rows.map((r) => (
                <div
                  key={r.blockId}
                  className="mb-3 rounded-lg border border-[#E5E1D6] bg-[#F4F2EB] p-4 shadow-sm"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-gray-500">{r.blockName.slice(0, 2)}</span>
                    {r.isBonus && (
                      <span className="rounded bg-orange-bg px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-orange">Bonus</span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-ink">{r.blockName}</div>
                  <div className="mt-1 text-xs text-gray-600">{r.blockDescription}</div>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-3 border-b-2 border-blue pb-2 text-[10px] font-bold uppercase tracking-widest text-blue">
                HOW — direkter Effekt
              </p>
              {rows.map((r) => (
                <div
                  key={r.blockId}
                  className="mb-3 rounded-lg border border-blue-border bg-blue-bg p-4 shadow-sm"
                >
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-blue">→ direkter Effekt</p>
                  <textarea
                    value={r.how}
                    onChange={(e) => updateRow(r.blockId, { how: e.target.value })}
                    placeholder="1 Satz: was passiert sofort? (z.B. „Sales-Logik in 2 Tagen verankert.")"
                    rows={2}
                    className="w-full resize-none border-0 bg-transparent text-sm text-gray-700 focus:outline-none"
                  />
                  <button
                    onClick={() => suggestRow(r.blockId)}
                    disabled={suggesting}
                    className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-blue hover:bg-blue/10 disabled:opacity-50"
                  >
                    <Sparkles size={10} /> AI: nur diese Reihe
                  </button>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-3 border-b-2 border-orange pb-2 text-[10px] font-bold uppercase tracking-widest text-orange">
                WHY — Welleneffekt + Beef
              </p>
              {rows.map((r) => (
                <div
                  key={r.blockId}
                  className="mb-3 rounded-lg border border-orange-border bg-orange-bg p-4 shadow-sm"
                >
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-orange">→ Beef · messbar</p>
                  <textarea
                    value={r.why}
                    onChange={(e) => updateRow(r.blockId, { why: e.target.value })}
                    placeholder="1 Satz mit Zahl + Einheit. (z.B. „Ramp-Up neue AEs 90 → 30 Tage. Kosten ↓ 80k €/AE.")"
                    rows={2}
                    className="w-full resize-none border-0 bg-transparent text-sm text-gray-700 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red">{error}</p>}

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            onClick={saveAll}
            disabled={saving === 'saving'}
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0D14] px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50"
          >
            {saving === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving === 'saved' ? 'Gespeichert ✓' : 'Speichern · Schritt abschliessen'}
          </button>
        </div>
      </div>
    </section>
  )
}
