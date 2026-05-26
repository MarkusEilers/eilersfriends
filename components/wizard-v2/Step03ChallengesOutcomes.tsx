'use client'

import { useState } from 'react'
import { Loader2, Plus, Save, Search, X } from 'lucide-react'
import type { ChallengeOrOutcome } from '@/lib/wizard-v2/types'

interface Props {
  draftId: string
  initialItems?: ChallengeOrOutcome[]
  onSaved?: () => void
}

export function Step03ChallengesOutcomes({ draftId, initialItems = [], onSaved }: Props) {
  const [items, setItems] = useState<ChallengeOrOutcome[]>(initialItems)
  const [researching, setResearching] = useState(false)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pills, setPills] = useState<{ challenges: Array<Omit<ChallengeOrOutcome, 'id' | 'order' | 'createdBy' | 'bauplanId' | 'type'>>; outcomes: Array<Omit<ChallengeOrOutcome, 'id' | 'order' | 'createdBy' | 'bauplanId' | 'type'>> }>({ challenges: [], outcomes: [] })

  async function research() {
    setResearching(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step03/research`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingItems: items }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Recherche fehlgeschlagen.'); return }
      setPills({
        challenges: Array.isArray(data.pills?.challenges) ? data.pills.challenges : [],
        outcomes: Array.isArray(data.pills?.outcomes) ? data.pills.outcomes : [],
      })
    } catch (e) { setError(String(e)) }
    finally { setResearching(false) }
  }

  function acceptPill(type: 'challenge' | 'outcome', p: { topic: string; reality: string; economicImpact: string; kpi: string }) {
    const id = crypto.randomUUID()
    setItems((prev) => [
      ...prev,
      { id, type, topic: p.topic, reality: p.reality, economicImpact: p.economicImpact, kpi: p.kpi, order: prev.length, createdBy: 'ai' } as ChallengeOrOutcome,
    ])
    setPills((s) => ({
      ...s,
      [type === 'challenge' ? 'challenges' : 'outcomes']: s[type === 'challenge' ? 'challenges' : 'outcomes'].filter((x) => x.topic !== p.topic),
    }))
  }

  function removeItem(id: string) { setItems((prev) => prev.filter((x) => x.id !== id)) }
  function addManual(type: 'challenge' | 'outcome') {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, topic: '', reality: '', economicImpact: '', kpi: '', order: prev.length, createdBy: 'user' } as ChallengeOrOutcome,
    ])
  }
  function updateItem(id: string, patch: Partial<ChallengeOrOutcome>) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  async function saveAll() {
    setSaving('saving'); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step03`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Speichern fehlgeschlagen.'); setSaving('idle'); return }
      setSaving('saved')
      setTimeout(() => setSaving('idle'), 2000)
      onSaved?.()
    } catch (e) { setError(String(e)); setSaving('idle') }
  }

  const challenges = items.filter((i) => i.type === 'challenge')
  const outcomes = items.filter((i) => i.type === 'outcome')

  return (
    <section className="bg-cream px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" />
            Schritt 03
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Aktuelle Herausforderungen<br />und erhoffte neue Ergebnisse.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Welche fünf bis sieben Herausforderungen spürt der Kunde heute, und welche drei bis fünf neuen Ergebnisse erhofft er sich daraus? Zwei parallele Listen — Schmerz heute, Ziel morgen.
          </p>
        </div>

        {/* Markus-Lehre */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">Markus' Lehre</span>
            <span className="rounded-full bg-blue-bg px-2 py-0.5 text-[10px] font-bold uppercase text-blue">IT-Service · Compliance · Margin</span>
          </div>
          <blockquote className="font-serif text-lg italic leading-relaxed text-gray-800">
            „Ein IT-Service-Anbieter für den Mittelstand hat mich vor drei Jahren angerufen: ‚Markus, unser Angebot wird vergleichbar mit drei anderen. Margin-Druck. Was machen wir?'
            <br /><br />
            Wir haben uns sein Angebot angeschaut. Er löste lauter Heute-Probleme — Server-Wartung, Update-Zyklen, Ticket-Bearbeitung. Genau das, was alle anderen auch lösten. Kein Wunder, dass der Kunde nur noch auf den Preis schaute. Heute-Schmerz alleine ist kommodifiziert."
          </blockquote>
        </div>

        {/* Struggle */}
        <div className="mb-8 rounded-2xl border border-red-border bg-red-bg p-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red">Hier wird's unbequem</p>
          <p className="text-sm leading-relaxed text-gray-700">
            Beim Schreiben merkst Du, dass Du viele Herausforderungen kennst, sie aber nie sauber dokumentiert hast. Du wirst Dich fragen, ob das alles ist. Ist es nicht. Aber die Top 5–7, die Du jetzt hinkriegst, sind die Schmerz-Vektoren für Beef-Radar. Mehr brauchen wir hier nicht.
          </p>
          <p className="mt-3 text-xs italic text-gray-600">
            Wording: NIE „Probleme" — immer „Herausforderungen" (heute) bzw. „erhoffte Ergebnisse" (Wunsch).
          </p>
        </div>

        {/* Recherche-Trigger */}
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-blue-border bg-white p-5 shadow-sm">
          <button
            onClick={research}
            disabled={researching}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue/90 disabled:opacity-50"
          >
            {researching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {researching ? 'Recherchiere…' : 'Recherchieren & beide Listen vorschlagen'}
          </button>
          <p className="text-xs italic text-muted">AI nutzt Welcome-Profile + ICP, schlägt Pills für beide Spalten vor.</p>
        </div>

        {/* Two-column grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* A · Challenges */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 border-b-2 border-red pb-2 text-[11px] font-bold uppercase tracking-widest text-red">
              A · Aktuelle Herausforderungen
            </h3>

            {challenges.length === 0 && (
              <p className="mb-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-center text-xs italic text-muted">
                Klick „Recherchieren" oben — oder selbst eintragen.
              </p>
            )}

            {challenges.map((c) => (
              <ItemCard key={c.id} item={c} variant="challenge" onRemove={() => removeItem(c.id)} onUpdate={(patch) => updateItem(c.id, patch)} />
            ))}

            {pills.challenges.length > 0 && (
              <PillList label="AI-Vorschläge Herausforderungen" items={pills.challenges} variant="challenge" onAccept={(p) => acceptPill('challenge', p)} />
            )}

            <button onClick={() => addManual('challenge')} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-bg px-3 py-1.5 text-xs font-semibold text-red hover:bg-red-bg/70">
              <Plus size={12} /> Herausforderung manuell
            </button>
          </div>

          {/* B · Outcomes */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 border-b-2 border-green-600 pb-2 text-[11px] font-bold uppercase tracking-widest text-green-700">
              B · Erhoffte neue Ergebnisse
            </h3>

            {outcomes.length === 0 && (
              <p className="mb-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-center text-xs italic text-muted">
                Klick „Recherchieren" — oder eintragen.
              </p>
            )}

            {outcomes.map((o) => (
              <ItemCard key={o.id} item={o} variant="outcome" onRemove={() => removeItem(o.id)} onUpdate={(patch) => updateItem(o.id, patch)} />
            ))}

            {pills.outcomes.length > 0 && (
              <PillList label="AI-Vorschläge Ergebnisse" items={pills.outcomes} variant="outcome" onAccept={(p) => acceptPill('outcome', p)} />
            )}

            <button onClick={() => addManual('outcome')} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100/70">
              <Plus size={12} /> Ergebnis manuell
            </button>
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

function ItemCard({ item, variant, onRemove, onUpdate }: { item: ChallengeOrOutcome; variant: 'challenge' | 'outcome'; onRemove: () => void; onUpdate: (patch: Partial<ChallengeOrOutcome>) => void }) {
  const borderColor = variant === 'challenge' ? 'border-l-red' : 'border-l-green-600'
  const valueLabel = variant === 'challenge' ? 'Impact' : 'Wert'
  return (
    <div className={`mb-3 rounded-lg border border-l-4 border-gray-200 ${borderColor} bg-white p-4`}>
      <div className="flex items-start justify-between gap-2">
        <input
          type="text"
          value={item.topic}
          onChange={(e) => onUpdate({ topic: e.target.value })}
          placeholder="Topic (max 6 Worte)"
          className="flex-1 border-0 bg-transparent text-sm font-semibold text-ink focus:outline-none"
        />
        <button onClick={onRemove} className="text-gray-400 hover:text-red"><X size={14} /></button>
      </div>
      <textarea
        value={item.reality}
        onChange={(e) => onUpdate({ reality: e.target.value })}
        placeholder="Reality (1-2 Sätze)"
        rows={2}
        className="mt-1 w-full resize-none border-0 bg-transparent text-sm text-gray-600 focus:outline-none"
      />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          value={item.economicImpact}
          onChange={(e) => onUpdate({ economicImpact: e.target.value })}
          placeholder={valueLabel + ' (€/% pro Q/Jahr)'}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
        />
        <input
          type="text"
          value={item.kpi}
          onChange={(e) => onUpdate({ kpi: e.target.value })}
          placeholder="KPI"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
        />
      </div>
    </div>
  )
}

function PillList({ label, items, variant, onAccept }: {
  label: string
  items: Array<{ topic: string; reality: string; economicImpact: string; kpi: string }>
  variant: 'challenge' | 'outcome'
  onAccept: (p: { topic: string; reality: string; economicImpact: string; kpi: string }) => void
}) {
  const colors = variant === 'challenge'
    ? { bg: 'bg-red-bg', border: 'border-red-border', text: 'text-red', hover: 'hover:bg-red' }
    : { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', hover: 'hover:bg-green-600' }
  return (
    <div className={`mt-3 rounded-xl border border-dashed ${colors.border} ${colors.bg} p-3`}>
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((p, i) => (
          <button
            key={i}
            onClick={() => onAccept(p)}
            className={`inline-flex items-center gap-1 rounded-full border ${colors.border} bg-white px-3 py-1 text-xs ${colors.text} ${colors.hover} hover:text-white`}
            title={p.reality + ' · ' + p.economicImpact}
          >
            <Plus size={11} />
            {p.topic}
          </button>
        ))}
      </div>
    </div>
  )
}
