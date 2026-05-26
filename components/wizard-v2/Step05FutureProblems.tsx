'use client'

import { useState } from 'react'
import { Loader2, Plus, Save, Search, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { FutureProblem, BuildingBlock } from '@/lib/wizard-v2/types'

interface Props {
  draftId: string
  buildingBlocks: BuildingBlock[]
  initialProblems?: FutureProblem[]
  onSaved?: () => void
}

export function Step05FutureProblems({ draftId, buildingBlocks, initialProblems = [], onSaved }: Props) {
  const [items, setItems] = useState<FutureProblem[]>(initialProblems)
  const [suggesting, setSuggesting] = useState(false)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    setSuggesting(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step05/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingProblems: items }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'AI-Suggest fehlgeschlagen.'); return }
      const incoming = (data.problems as FutureProblem[]) ?? []
      setItems((prev) => [...prev, ...incoming.map((p, i) => ({ ...p, id: crypto.randomUUID(), order: prev.length + i, createdBy: 'ai' as const }))])
    } catch (e) { setError(String(e)) }
    finally { setSuggesting(false) }
  }

  function updateItem(id: string, patch: Partial<FutureProblem>) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }
  function removeItem(id: string) { setItems((prev) => prev.filter((x) => x.id !== id)) }
  function addManual() {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), problem: '', trigger: '', order: prev.length, createdBy: 'user' } as FutureProblem])
  }

  async function saveAll() {
    setSaving('saving'); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step05`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Speichern fehlgeschlagen.'); setSaving('idle'); return }
      setSaving('saved')
      setTimeout(() => setSaving('idle'), 2000)
      onSaved?.()
    } catch (e) { setError(String(e)); setSaving('idle') }
  }

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" />
            Schritt 05
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Future Problems Anticipated.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Welche fünf vorhersehbaren Probleme treffen den Kunden, wenn unser Angebot wirkt — und welche davon lösen wir gleich mit? Der Kunde wird durch Erfolg oder durch den natürlichen Lauf der Dinge auf Herausforderungen treffen, die wir schon kennen. Wenn unser Angebot die auch löst, wird es deutlich teurer wahrgenommen.
          </p>
        </div>

        {/* Markus-Lehre */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">Markus' Lehre</span>
            <span className="rounded-full bg-blue-bg px-2 py-0.5 text-[10px] font-bold uppercase text-blue">Compliance · Morgen-Wissen</span>
          </div>
          <blockquote className="font-serif text-lg italic leading-relaxed text-gray-800">
            „Ich habe gefragt: ‚Was weißt Du über Deine Kunden, das sie selbst noch nicht wissen?' Der IT-Service-Anbieter hat eine Minute überlegt — und dann von einer Compliance-Verschärfung erzählt, die in 12 Monaten kommen würde. Keiner seiner Wettbewerber adressierte das noch.
            <br /><br />
            Wir haben das in den zweiten Layer seines Angebots gemacht. Sechs Monate später war er der einzige Anbieter im Pitch, der das proaktiv mit-anpackte. Margin kam zurück."
          </blockquote>
        </div>

        <div className="mb-8 rounded-2xl border border-red-border bg-red-bg p-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red">Hier wird's unbequem</p>
          <p className="text-sm leading-relaxed text-gray-700">
            Beim Schreiben merkst Du, dass Du das <strong>Morgen-Wissen</strong> noch nicht in Daten hast. Du hast eine Hypothese — aber keinen Beweis. Das fühlt sich nach Vorgriff an. Vielleicht nach Hochstapelei. Ist es nicht. Es ist Branche-Wissen, das Du hast und Dein Kunde noch nicht. Schreib's auf.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-blue-border bg-white p-5 shadow-sm">
          <button
            onClick={suggest}
            disabled={suggesting}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue/90 disabled:opacity-50"
          >
            {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {suggesting ? 'Recherchiere…' : 'AI: 5 Future Problems vorschlagen'}
          </button>
          <p className="text-xs italic text-muted">AI nutzt Bausteine + Welcome-Profile, markiert pro Problem ob ein Baustein es mit-löst.</p>
        </div>

        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm italic text-muted">
            Noch keine Future Problems erfasst. Klick AI-Suggest oder leg manuell los.
          </p>
        )}

        {items.map((p) => {
          const linkedBlock = buildingBlocks.find((b) => b.id === p.solvedThrough)
          const solved = !!linkedBlock
          return (
            <div key={p.id} className={'mb-3 rounded-lg border border-l-4 bg-white p-4 ' + (solved ? 'border-l-green-600 border-gray-200' : 'border-l-amber border-amber-bg')}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {solved ? <CheckCircle2 size={14} className="text-green-700" /> : <AlertTriangle size={14} className="text-amber" />}
                  <input type="text" value={p.problem} onChange={(e) => updateItem(p.id, { problem: e.target.value })} placeholder="Future Problem (1 Satz)"
                    className="flex-1 border-0 bg-transparent text-sm font-semibold text-ink focus:outline-none" />
                </div>
                <button onClick={() => removeItem(p.id)} className="text-gray-400 hover:text-red"><X size={14} /></button>
              </div>
              <input type="text" value={p.trigger} onChange={(e) => updateItem(p.id, { trigger: e.target.value })}
                placeholder="Trigger: warum tritt das auf (Erfolg, Skalierung, Zeit, Markt)"
                className="mt-1 w-full bg-transparent text-xs text-gray-600 focus:outline-none" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <select value={p.solvedThrough ?? ''} onChange={(e) => updateItem(p.id, { solvedThrough: e.target.value || undefined })}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
                  <option value="">— gelöst durch (kein Baustein) —</option>
                  {buildingBlocks.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                </select>
                <input type="text" value={p.marginalCost ?? ''} onChange={(e) => updateItem(p.id, { marginalCost: e.target.value })}
                  placeholder="Marginal-Cost (z.B. 1 Workshop-Tag)"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs" />
              </div>
              {!solved && (
                <p className="mt-2 text-[11px] italic text-amber">
                  Offen — kein Baustein deckt das ab. Hinweis: Bonus in Schritt 01 ergänzen?
                </p>
              )}
            </div>
          )
        })}

        <button onClick={addManual} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
          <Plus size={12} /> Future Problem manuell
        </button>

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
