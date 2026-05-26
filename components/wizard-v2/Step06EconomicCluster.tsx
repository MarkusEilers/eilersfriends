'use client'

import { useState } from 'react'
import { Loader2, Plus, Save, Sparkles, X } from 'lucide-react'
import type { EconomicCluster, EconomicUnit, MaximumBudget } from '@/lib/wizard-v2/types'

interface Props {
  draftId: string
  initialClusters?: EconomicCluster[]
  initialMaximumBudget?: MaximumBudget | null
  onSaved?: () => void
}

const UNITS: Array<{ value: EconomicUnit; label: string }> = [
  { value: 'user/quarter', label: 'pro User/Quartal' },
  { value: 'user/year', label: 'pro User/Jahr' },
  { value: 'department/quarter', label: 'pro Abteilung/Quartal' },
  { value: 'department/year', label: 'pro Abteilung/Jahr' },
  { value: 'company/quarter', label: 'pro Company/Quartal' },
  { value: 'company/year', label: 'pro Company/Jahr' },
]

function formatEUR(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function computeBudget(clusters: EconomicCluster[]): MaximumBudget {
  const byUnit: Partial<Record<EconomicUnit, number>> = {}
  for (const c of clusters) {
    byUnit[c.unit] = (byUnit[c.unit] ?? 0) + c.economicValuePerUnit
  }
  // Pick primary: highest aggregated
  let primaryUnit: EconomicUnit = 'company/year'
  let primaryValue = 0
  for (const [u, v] of Object.entries(byUnit)) {
    if ((v ?? 0) > primaryValue) { primaryUnit = u as EconomicUnit; primaryValue = v ?? 0 }
  }
  return { primaryUnit, primaryValue, byUnit }
}

export function Step06EconomicCluster({ draftId, initialClusters = [], onSaved }: Props) {
  const [clusters, setClusters] = useState<EconomicCluster[]>(initialClusters)
  const [suggesting, setSuggesting] = useState(false)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    setSuggesting(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step06/suggest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'AI-Suggest fehlgeschlagen.'); return }
      const incoming = (data.clusters as EconomicCluster[]) ?? []
      setClusters(incoming.map((c, i) => ({ ...c, id: crypto.randomUUID(), order: i, containedCards: c.containedCards ?? [], createdBy: 'ai' as const })))
    } catch (e) { setError(String(e)) }
    finally { setSuggesting(false) }
  }

  function updateCluster(id: string, patch: Partial<EconomicCluster>) {
    setClusters((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }
  function removeCluster(id: string) { setClusters((prev) => prev.filter((x) => x.id !== id)) }
  function addManual() {
    setClusters((prev) => [...prev, { id: crypto.randomUUID(), clusterName: '', economicValuePerUnit: 0, unit: 'company/year' as EconomicUnit, confidenceLevel: 'hypothese' as const, methodology: '', containedCards: [], order: prev.length, createdBy: 'user' as const }])
  }

  async function saveAll() {
    setSaving('saving'); setError(null)
    const maximumBudget = computeBudget(clusters)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step06`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusters, maximumBudget }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Speichern fehlgeschlagen.'); setSaving('idle'); return }
      setSaving('saved'); setTimeout(() => setSaving('idle'), 2000); onSaved?.()
    } catch (e) { setError(String(e)); setSaving('idle') }
  }

  const budget = computeBudget(clusters)
  const primaryLabel = UNITS.find((u) => u.value === budget.primaryUnit)?.label ?? budget.primaryUnit

  return (
    <section className="bg-cream px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" />
            Schritt 06
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Wirtschaftliche Bewertung.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Wenn alle Welleneffekte greifen — was ist das wirtschaftlich wert? Das theoretische Maximalbudget pro User, Abteilung oder Company. Die obere Grenze, bis zu der dieser Kauf für den Kunden ökonomisch sinnvoll ist. Wer das nicht kennt, verkauft unter Wert.
          </p>
        </div>

        {/* Markus-Lehre */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">Markus' Lehre</span>
            <span className="rounded-full bg-blue-bg px-2 py-0.5 text-[10px] font-bold uppercase text-blue">Wien IT-Security · 10k €/MA</span>
          </div>
          <blockquote className="font-serif text-lg italic leading-relaxed text-gray-800">
            „Wir haben aus der Zahl einen Cluster gebaut: Customer-Avg 10.000 €/MA/Jahr · Range 4.000–18.000 €/MA · belegt aus 7 Implementierungen. Im nächsten Pitch hat er die Tabelle gezeigt und gesagt: ‚Bei 200 MA wären das 2 Mio €/Jahr — selbst im Pessimistik-Korridor noch 800k.'
            <br /><br />
            Der CFO im Raum hat die Tabelle abfotografiert. Drei Wochen Sales-Cycle. Nicht 14. Drei."
          </blockquote>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-blue-border bg-white p-5 shadow-sm">
          <button onClick={suggest} disabled={suggesting}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue/90 disabled:opacity-50">
            {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {suggesting ? 'AI clustert…' : 'AI: Cluster vorschlagen aus Step 03+04+05'}
          </button>
          <p className="text-xs italic text-muted">AI zieht WHY-Karten + Future-Solved + Herausforderungen zusammen, gruppiert in 3–5 Cluster mit €-Bewertung.</p>
        </div>

        {clusters.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm italic text-muted">
            Noch keine Cluster. Klick AI-Suggest oder leg manuell los.
          </p>
        )}

        {clusters.map((c) => (
          <div key={c.id} className="mb-3 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <input type="text" value={c.clusterName} onChange={(e) => updateCluster(c.id, { clusterName: e.target.value })}
                placeholder="Cluster-Name (max 4 Worte)"
                className="flex-1 border-0 bg-transparent font-serif text-xl text-ink focus:outline-none" />
              <button onClick={() => removeCluster(c.id)} className="text-gray-400 hover:text-red"><X size={14} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Wert (€)</span>
                <input type="number" value={c.economicValuePerUnit} onChange={(e) => updateCluster(c.id, { economicValuePerUnit: Number(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Einheit</span>
                <select value={c.unit} onChange={(e) => updateCluster(c.id, { unit: e.target.value as EconomicUnit })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                  {UNITS.map((u) => (<option key={u.value} value={u.value}>{u.label}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Confidence</span>
                <select value={c.confidenceLevel} onChange={(e) => updateCluster(c.id, { confidenceLevel: e.target.value as EconomicCluster['confidenceLevel'] })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                  <option value="belegt">Belegt</option>
                  <option value="hypothese">Hypothese</option>
                  <option value="branchen-anker">Branchen-Anker</option>
                </select>
              </label>
            </div>
            <textarea value={c.methodology} onChange={(e) => updateCluster(c.id, { methodology: e.target.value })}
              placeholder="Methodik (z.B. „3 FTE × 4h/Wo × 47 Wo × 90 €/h = 50.760 €") — Pflicht bei Hypothese"
              rows={2}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700" />
          </div>
        ))}

        <button onClick={addManual} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
          <Plus size={12} /> Cluster manuell
        </button>

        {/* Maximalbudget Hero */}
        {clusters.length > 0 && (
          <div className="mt-8 rounded-2xl bg-[#0A0D14] p-8 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Maximalbudget · {primaryLabel}</p>
            <p className="mt-2 font-serif text-5xl">{formatEUR(budget.primaryValue)}</p>
            <p className="mt-2 text-sm opacity-70">Obere Grenze, bis zu der dieser Kauf für den Kunden ökonomisch sinnvoll ist.</p>
            <div className="mt-4 grid gap-2 text-xs opacity-80 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(budget.byUnit).map(([u, v]) => (
                <div key={u} className="rounded bg-white/10 px-3 py-2">
                  <p className="opacity-60">{UNITS.find((x) => x.value === u)?.label ?? u}</p>
                  <p className="font-mono">{formatEUR(v ?? 0)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red">{error}</p>}

        <div className="mt-8 flex items-center justify-end gap-3">
          <button onClick={saveAll} disabled={saving === 'saving'}
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0D14] px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50">
            {saving === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving === 'saved' ? 'Gespeichert ✓' : 'Speichern · Schritt abschliessen'}
          </button>
        </div>
      </div>
    </section>
  )
}
