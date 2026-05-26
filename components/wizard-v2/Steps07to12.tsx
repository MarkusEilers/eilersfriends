'use client'

import { useState } from 'react'
import { Loader2, Plus, Save, Sparkles, X, Map } from 'lucide-react'
import type { BulletproofPlan, BulletproofPhase, PhaseCurrency, PricingTier, PricingSummary, ScarcityElement, ScarcityType, RiskReversal, ReversalType, OfferIdentity, OfferIdentityVariant, BillingFrequency } from '@/lib/wizard-v2/types'

// ════════════════════════════════════════════════════════════
// Step 07 · Bulletproof Plan
// ════════════════════════════════════════════════════════════

const EMPTY_PLAN: BulletproofPlan = {
  name: '', startingPain: '', startSymptoms: [], endGoal: '', endProofPoints: [],
  headlinePromise: '', phases: [],
}

export function Step07BulletproofPlan({ draftId, initialPlan, onSaved }: { draftId: string; initialPlan?: BulletproofPlan | null; onSaved?: () => void }) {
  const [plan, setPlan] = useState<BulletproofPlan>(initialPlan ?? EMPTY_PLAN)
  const [suggesting, setSuggesting] = useState(false)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    setSuggesting(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step07/suggest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'AI-Suggest fehlgeschlagen.'); return }
      if (data.plan) {
        const p = data.plan as BulletproofPlan
        setPlan({ ...p, phases: (p.phases ?? []).map((ph, i) => ({ ...ph, id: crypto.randomUUID(), order: i, steps: (ph.steps ?? []).map((s, j) => ({ ...s, id: crypto.randomUUID(), order: j })) })) })
      }
    } catch (e) { setError(String(e)) }
    finally { setSuggesting(false) }
  }

  async function saveAll() {
    setSaving('saving'); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step07`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save fehlgeschlagen'); setSaving('idle'); return }
      setSaving('saved'); setTimeout(() => setSaving('idle'), 2000); onSaved?.()
    } catch (e) { setError(String(e)); setSaving('idle') }
  }

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
          <span className="h-1.5 w-1.5 rounded-full bg-blue" /> Schritt 07
        </span>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">Optimaler Weg · Bulletproof Plan.</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          In welcher sichtbaren Reise bringen wir den Kunden vom Start- zum End-Zustand? Eine Liste von Bausteinen verkauft nicht. Eine Reise mit benannten Phasen verkauft.
        </p>

        <div className="mt-8 mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">Markus' Lehre</span>
            <span className="rounded-full bg-blue-bg px-2 py-0.5 text-[10px] font-bold uppercase text-blue">München Sales-Coach</span>
          </div>
          <blockquote className="font-serif text-lg italic leading-relaxed text-gray-800">
            „Wir haben die 12 Wochen in drei Phasen zerlegt: Diagnose, Bau, Beweis. Pro Phase: Was geht rein? Was kommt raus? In welcher Währung? Das war ein A4-Blatt. Beim nächsten Pitch hat er das Blatt einfach gezeigt. Der Kunde hat es übernommen und seinem Vorstand vorgelegt. Drei Tage später kam die Zusage. Er hat mir gesagt: ‚Markus, das Blatt hat mehr verkauft als ich.'"
          </blockquote>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-blue-border bg-white p-5 shadow-sm">
          <button onClick={suggest} disabled={suggesting}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue/90 disabled:opacity-50">
            {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Map size={14} />}
            {suggesting ? 'AI plant…' : 'AI: Bulletproof Plan vorschlagen'}
          </button>
          <p className="text-xs italic text-muted">AI nutzt Step 03 (Schmerz/Ziele) + Step 04 (Beef) + Bausteine → schlägt 3 Phasen mit Methodik-Namen vor.</p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-700">Methodik-Name</span>
              <input type="text" value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} placeholder="z.B. Beef-Programm"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-700">Headline-Promise</span>
              <input type="text" value={plan.headlinePromise} onChange={(e) => setPlan({ ...plan, headlinePromise: e.target.value })} placeholder="Von X zu Y in N Wochen"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-l-4 border-gray-200 border-l-red bg-white p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-red">Start-State</p>
              <input type="text" value={plan.startingPain} onChange={(e) => setPlan({ ...plan, startingPain: e.target.value })} placeholder="z.B. Ad-hoc-Pitches"
                className="w-full border-0 bg-transparent font-serif text-lg focus:outline-none" />
              <input type="text" value={plan.startSymptoms.join(' · ')} onChange={(e) => setPlan({ ...plan, startSymptoms: e.target.value.split('·').map((s) => s.trim()).filter(Boolean) })}
                placeholder="Symptome · getrennt durch · Punkte"
                className="mt-2 w-full bg-transparent text-xs text-gray-600 focus:outline-none" />
            </div>
            <div className="rounded-lg border border-l-4 border-gray-200 border-l-green-600 bg-white p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-green-700">End-State</p>
              <input type="text" value={plan.endGoal} onChange={(e) => setPlan({ ...plan, endGoal: e.target.value })} placeholder="z.B. CFO-tauglich"
                className="w-full border-0 bg-transparent font-serif text-lg focus:outline-none" />
              <input type="text" value={plan.endProofPoints.join(' · ')} onChange={(e) => setPlan({ ...plan, endProofPoints: e.target.value.split('·').map((s) => s.trim()).filter(Boolean) })}
                placeholder="Proof Points · getrennt"
                className="mt-2 w-full bg-transparent text-xs text-gray-600 focus:outline-none" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Phasen ({plan.phases.length})</p>
            {plan.phases.map((ph, i) => (
              <div key={ph.id} className="rounded-2xl border border-blue-border bg-blue-bg p-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-deep">Phase {i + 1}</span>
                  <button onClick={() => setPlan({ ...plan, phases: plan.phases.filter((_, idx) => idx !== i) })} className="text-gray-400 hover:text-red"><X size={12} /></button>
                </div>
                <input type="text" value={ph.name} onChange={(e) => { const updated = [...plan.phases]; updated[i] = { ...ph, name: e.target.value }; setPlan({ ...plan, phases: updated }) }}
                  placeholder="Methodik-Phase-Name"
                  className="w-full border-0 bg-transparent font-serif text-xl text-ink focus:outline-none" />
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input type="text" value={ph.fromState} onChange={(e) => { const u = [...plan.phases]; u[i] = { ...ph, fromState: e.target.value }; setPlan({ ...plan, phases: u }) }} placeholder="Von:" className="rounded-lg border border-blue-border bg-white px-3 py-2 text-xs" />
                  <input type="text" value={ph.toState} onChange={(e) => { const u = [...plan.phases]; u[i] = { ...ph, toState: e.target.value }; setPlan({ ...plan, phases: u }) }} placeholder="Zu:" className="rounded-lg border border-blue-border bg-white px-3 py-2 text-xs" />
                </div>
                <ol className="mt-3 list-decimal pl-5 text-xs text-gray-700">
                  {ph.steps.map((s) => (<li key={s.id}>{s.title} <span className="text-gray-500">— {s.fromState} → {s.toState}</span></li>))}
                </ol>
              </div>
            ))}
            <button onClick={() => setPlan({ ...plan, phases: [...plan.phases, { id: crypto.randomUUID(), name: '', fromState: '', toState: '', description: '', steps: [], order: plan.phases.length }] })}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <Plus size={12} /> Phase
            </button>
          </div>
        </div>

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

// ════════════════════════════════════════════════════════════
// Step 08 · Phase Currencies (optional)
// ════════════════════════════════════════════════════════════

export function Step08PhaseCurrencies({ draftId, phases, initialCurrencies = [], onSaved }: {
  draftId: string; phases: BulletproofPhase[]; initialCurrencies?: PhaseCurrency[]; onSaved?: () => void
}) {
  const [items, setItems] = useState<PhaseCurrency[]>(initialCurrencies)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  function addFor(phaseId: string) {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), phaseId, metric: '', unit: '', baseline: '', pessimistic: '', realistic: '', optimistic: '', measuredAt: '', isPrimary: prev.filter((x) => x.phaseId === phaseId).length === 0 }])
  }
  function update(id: string, patch: Partial<PhaseCurrency>) { setItems((prev) => prev.map((x) => x.id === id ? { ...x, ...patch } : x)) }
  function remove(id: string) { setItems((prev) => prev.filter((x) => x.id !== id)) }

  async function saveAll() {
    setSaving('saving'); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step08`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save fehlgeschlagen'); setSaving('idle'); return }
      setSaving('saved'); setTimeout(() => setSaving('idle'), 2000); onSaved?.()
    } catch (e) { setError(String(e)); setSaving('idle') }
  }
  async function skip() {
    await fetch(`/api/wizard/v2/${draftId}/step08`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [], skipped: true }) })
    onSaved?.()
  }

  return (
    <section className="bg-cream px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
          <span className="h-1.5 w-1.5 rounded-full bg-blue" /> Schritt 08 · optional
        </span>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">Currencies pro Phase.</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Pro Phase eine Hauptwährung + Drei-Punkt-Korridor. Optional — eine Phase ohne Mess-Punkt ist eine Hoffnung. Mit Mess-Punkt ist sie ein Vertrag.
        </p>

        <div className="mt-8 mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">Markus' Lehre · SaaS-Gründer 3 Phasen-Zahlen</span>
          <blockquote className="mt-2 font-serif text-base italic leading-relaxed text-gray-800">
            „Phase 1: Time-to-First-Value (Baseline 31 Tage → Ziel ≤14 Tage). Phase 2: Aktivierungs-Rate Kern-Feature (Baseline 38% → Ziel ≥65%). Drei Zahlen, drei Phasen, eine Tabelle. Sales-Cycle: 6 Wochen statt 14."
          </blockquote>
        </div>

        {phases.length === 0 && (
          <div className="rounded-2xl border border-amber bg-amber-bg p-6 text-amber">
            <p className="font-semibold">Phasen fehlen.</p>
            <p className="mt-2 text-sm">Trag erst in Schritt 07 Deine Phasen ein — Currencies werden pro Phase definiert.</p>
          </div>
        )}

        {phases.map((ph) => {
          const phaseItems = items.filter((x) => x.phaseId === ph.id)
          return (
            <div key={ph.id} className="mb-4 rounded-2xl border border-gray-200 bg-white p-5">
              <p className="font-serif text-lg text-ink">{ph.name || 'Phase ohne Namen'}</p>
              {phaseItems.map((it) => (
                <div key={it.id} className="mt-3 grid gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:grid-cols-3">
                  <input value={it.metric} onChange={(e) => update(it.id, { metric: e.target.value })} placeholder="Metric" className="rounded border border-gray-200 px-2 py-1 text-xs" />
                  <input value={it.unit} onChange={(e) => update(it.id, { unit: e.target.value })} placeholder="Unit (x, %, €, Tage)" className="rounded border border-gray-200 px-2 py-1 text-xs" />
                  <input value={it.baseline} onChange={(e) => update(it.id, { baseline: e.target.value })} placeholder="Baseline" className="rounded border border-gray-200 px-2 py-1 text-xs" />
                  <input value={it.pessimistic} onChange={(e) => update(it.id, { pessimistic: e.target.value })} placeholder="Pessimistic" className="rounded border border-gray-200 px-2 py-1 text-xs" />
                  <input value={it.realistic} onChange={(e) => update(it.id, { realistic: e.target.value })} placeholder="Realistic" className="rounded border border-gray-200 px-2 py-1 text-xs" />
                  <input value={it.optimistic} onChange={(e) => update(it.id, { optimistic: e.target.value })} placeholder="Optimistic" className="rounded border border-gray-200 px-2 py-1 text-xs" />
                  <input value={it.measuredAt} onChange={(e) => update(it.id, { measuredAt: e.target.value })} placeholder="Gemessen z.B. „Ende Phase 1"" className="rounded border border-gray-200 px-2 py-1 text-xs sm:col-span-2" />
                  <button onClick={() => remove(it.id)} className="text-xs text-gray-400 hover:text-red"><X size={12} /></button>
                </div>
              ))}
              <button onClick={() => addFor(ph.id)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"><Plus size={11} /> Currency</button>
            </div>
          )
        })}

        {error && <p className="mt-4 text-sm text-red">{error}</p>}
        <div className="mt-8 flex items-center justify-end gap-3">
          <button onClick={skip} className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Überspringen</button>
          <button onClick={saveAll} disabled={saving === 'saving'}
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0D14] px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50">
            {saving === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving === 'saved' ? 'Gespeichert ✓' : 'Speichern'}
          </button>
        </div>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════
// Step 09 · Preis
// ════════════════════════════════════════════════════════════

export function Step09Preis({ draftId, initialPricing, maximumBudget, onSaved }: {
  draftId: string; initialPricing?: PricingSummary | null; maximumBudget?: number; onSaved?: () => void
}) {
  const [tiers, setTiers] = useState<PricingTier[]>(initialPricing?.tiers ?? [
    { id: crypto.randomUUID(), label: 'Standard', price: 4985, currency: 'EUR', billingFrequency: 'lifetime', order: 0 },
  ])
  const [reasoning, setReasoning] = useState(initialPricing?.marktestReasoning ?? '')
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  const antiGlatt = tiers.every((t) => t.price % 1000 !== 0)

  function update(id: string, patch: Partial<PricingTier>) { setTiers((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x)) }
  function add() { setTiers((p) => [...p, { id: crypto.randomUUID(), label: 'Premium', price: 11985, currency: 'EUR', billingFrequency: 'lifetime', order: p.length }]) }
  function remove(id: string) { setTiers((p) => p.filter((x) => x.id !== id)) }

  async function saveAll() {
    setSaving('saving'); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step09`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers, marktestReasoning: reasoning, antiGlattCheck: antiGlatt }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save fehlgeschlagen'); setSaving('idle'); return }
      setSaving('saved'); setTimeout(() => setSaving('idle'), 2000); onSaved?.()
    } catch (e) { setError(String(e)); setSaving('idle') }
  }

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
          <span className="h-1.5 w-1.5 rounded-full bg-blue" /> Schritt 09
        </span>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">Preis.</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Marktest-Preis: starte bewusst zu hoch, korrigiere durch Reaktion. Nie glatt — nie 5000, eher 5485.
          {maximumBudget ? ` Dein Maximalbudget aus Schritt 06: ${new Intl.NumberFormat('de-DE').format(maximumBudget)} €.` : ''}
        </p>

        <div className="mt-8 space-y-3">
          {tiers.map((t) => (
            <div key={t.id} className="grid items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <input value={t.label} onChange={(e) => update(t.id, { label: e.target.value })} placeholder="Tier-Name" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold" />
              <div className="flex items-center gap-1">
                <input type="number" value={t.price} onChange={(e) => update(t.id, { price: Number(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-serif text-xl" />
                <span className="text-sm text-gray-500">€</span>
              </div>
              <select value={t.currency} onChange={(e) => update(t.id, { currency: e.target.value as 'EUR' | 'USD' | 'GBP' })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
                <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
              </select>
              <select value={t.billingFrequency} onChange={(e) => update(t.id, { billingFrequency: e.target.value as BillingFrequency })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
                <option value="einmalig">einmalig</option><option value="monatlich">monatlich</option><option value="jährlich">jährlich</option><option value="lifetime">lifetime</option>
              </select>
              <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-red"><X size={14} /></button>
            </div>
          ))}
          <button onClick={add} className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Plus size={12} /> Tier</button>
        </div>

        <textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)}
          placeholder="Marktest-Reasoning (1–2 Sätze: warum dieser Preis)"
          rows={3}
          className="mt-6 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm" />

        <div className={'mt-4 rounded-2xl p-4 text-sm ' + (antiGlatt ? 'bg-green-50 text-green-800' : 'bg-amber-bg text-amber')}>
          {antiGlatt ? '✓ Anti-Glatt-Check bestanden — alle Preise nicht-glatt.' : '⚠ Anti-Glatt-Check: mindestens ein Preis ist glatt (durch 1000 teilbar). Glatte Preise klingen erfunden — nicht-glatte klingen kalkuliert.'}
        </div>

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

// ════════════════════════════════════════════════════════════
// Step 10 · Scarcity (optional)
// ════════════════════════════════════════════════════════════

const SCARCITY_PATTERNS: Array<{ value: ScarcityType; label: string; example: string }> = [
  { value: 'cohort-size', label: 'Cohort-Size limitiert', example: 'z.B. „Founding 30 Cohort"' },
  { value: 'deadline', label: 'Stichtag', example: 'z.B. „bis 31.07.2026"' },
  { value: 'lifetime-lock', label: 'Lifetime-Lock', example: 'Preis steigt nach Cohort' },
  { value: 'geographic', label: 'Geografische Beschränkung', example: 'z.B. nur DACH' },
  { value: 'industry-exclusive', label: 'Branchen-Exklusivität', example: '1 Kunde pro Branche' },
  { value: 'personal-delivery-cap', label: 'Persönliche Begleitung', example: 'Skalierung kappt sich selbst' },
  { value: 'bonus-slot', label: 'Bonus-Slot', example: 'Nur für die ersten N' },
  { value: 'co-investment', label: 'Co-Investment', example: 'Vorbereitung verlangt Commitment' },
  { value: 'seasonal-window', label: 'Saisonales Window', example: 'z.B. Q4-Programm' },
]

export function Step10Scarcity({ draftId, initialScarcity, onSaved }: { draftId: string; initialScarcity?: ScarcityElement | null; onSaved?: () => void }) {
  const [scarcity, setScarcity] = useState<ScarcityElement>(initialScarcity ?? { scarcityType: 'cohort-size', scarcityReason: '', scarcityProof: {}, isReal: false })
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function saveAll() {
    setSaving('saving')
    await fetch(`/api/wizard/v2/${draftId}/step10`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scarcity) })
    setSaving('saved'); setTimeout(() => setSaving('idle'), 2000); onSaved?.()
  }
  async function skip() {
    await fetch(`/api/wizard/v2/${draftId}/step10`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skipped: true }) })
    onSaved?.()
  }

  return (
    <section className="bg-cream px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
          <span className="h-1.5 w-1.5 rounded-full bg-blue" /> Schritt 10 · optional
        </span>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">Scarcity.</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Knappheit ohne Echtheit ist Bullshit. Echte Scarcity hat einen verteidigbaren Grund — eine Zahl, einen Stichtag, eine Cohort-Größe.
        </p>

        <div className="mt-8 mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Pattern wählen</p>
          <div className="flex flex-wrap gap-2">
            {SCARCITY_PATTERNS.map((p) => (
              <button key={p.value} onClick={() => setScarcity((s) => ({ ...s, scarcityType: p.value }))}
                className={'inline-flex flex-col items-start gap-0.5 rounded-2xl border px-4 py-3 text-left text-xs ' +
                  (scarcity.scarcityType === p.value ? 'border-blue bg-blue text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')}>
                <span className="font-semibold">{p.label}</span>
                <span className={'text-[10px] ' + (scarcity.scarcityType === p.value ? 'text-white/70' : 'text-gray-500')}>{p.example}</span>
              </button>
            ))}
          </div>
        </div>

        <textarea value={scarcity.scarcityReason} onChange={(e) => setScarcity((s) => ({ ...s, scarcityReason: e.target.value }))}
          placeholder="Warum ist diese Knappheit echt? (1 Satz — verteidigbar beim Espresso)" rows={2}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm" />
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={scarcity.isReal} onChange={(e) => setScarcity((s) => ({ ...s, isReal: e.target.checked }))} /> Echtheits-Check bestanden
        </label>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button onClick={skip} className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Überspringen</button>
          <button onClick={saveAll} disabled={saving === 'saving'}
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0D14] px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50">
            {saving === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving === 'saved' ? 'Gespeichert ✓' : 'Speichern'}
          </button>
        </div>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════
// Step 11 · Risk-Reversal (optional)
// ════════════════════════════════════════════════════════════

const REVERSAL_TYPES: Array<{ value: ReversalType; label: string }> = [
  { value: 'result-or-action', label: 'Result-or-Extension' },
  { value: 'conditional-refund', label: 'Bedingte Geld-zurück' },
  { value: 'unconditional-refund', label: 'Unbedingte Geld-zurück' },
  { value: 'time-extension', label: 'Zeit-Extension' },
  { value: 'result-plus-bonus', label: 'Ergebnis + Bonus' },
  { value: 'pay-on-results', label: 'Pay-on-Results' },
]

export function Step11RiskReversal({ draftId, initialReversal, onSaved }: { draftId: string; initialReversal?: RiskReversal | null; onSaved?: () => void }) {
  const [rev, setRev] = useState<RiskReversal>(initialReversal ?? { reversalType: 'result-or-action', triggerCondition: '', consequence: '', espressoTest: false })
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')

  async function saveAll() {
    setSaving('saving')
    await fetch(`/api/wizard/v2/${draftId}/step11`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rev) })
    setSaving('saved'); setTimeout(() => setSaving('idle'), 2000); onSaved?.()
  }
  async function skip() {
    await fetch(`/api/wizard/v2/${draftId}/step11`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skipped: true }) })
    onSaved?.()
  }

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
          <span className="h-1.5 w-1.5 rounded-full bg-blue" /> Schritt 11 · optional
        </span>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">Risk-Reversal.</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Commitment gegen Commitment. Du commitest Dich, ich commite mich. Wenn Du tust, was wir verabredet haben, und es funktioniert nicht — bekomme ich die Konsequenz, nicht Du.
        </p>

        <div className="mt-8 mb-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">Markus' Lehre · Linz Pipeline-15pp</span>
          <blockquote className="mt-2 font-serif text-base italic leading-relaxed text-gray-800">
            „Wenn die Pilot-Pipeline nach 6 Wochen nicht mindestens 15 Prozentpunkte Conversion-Verbesserung gegenüber der Baseline liefert, läuft Phase 3 ohne weitere Rechnung — bis die 15 Punkte stehen. Konkret. Datiert. An Phase und Währung gebunden. Sales-Cycle: −28 % vs. davor."
          </blockquote>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Pattern wählen</p>
          <div className="flex flex-wrap gap-2">
            {REVERSAL_TYPES.map((p) => (
              <button key={p.value} onClick={() => setRev((r) => ({ ...r, reversalType: p.value }))}
                className={'rounded-full border px-4 py-2 text-xs font-semibold ' +
                  (rev.reversalType === p.value ? 'border-blue bg-blue text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <textarea value={rev.triggerCondition} onChange={(e) => setRev((r) => ({ ...r, triggerCondition: e.target.value }))}
          placeholder="Trigger · was der Kunde commitet (z.B. „Alle 12 Sessions wahrgenommen + Reporting eingereicht")" rows={2}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm" />
        <textarea value={rev.consequence} onChange={(e) => setRev((r) => ({ ...r, consequence: e.target.value }))}
          placeholder="Konsequenz · was wir commiten (z.B. „Kostenlose Verlängerung 3 Monate bis Ergebnis")" rows={2}
          className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm" />
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={rev.espressoTest} onChange={(e) => setRev((r) => ({ ...r, espressoTest: e.target.checked }))} /> Espresso-Test bestanden — verteidigbar bei Kollegen ohne Marketing-Sound
        </label>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button onClick={skip} className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Überspringen</button>
          <button onClick={saveAll} disabled={saving === 'saving'}
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0D14] px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50">
            {saving === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving === 'saved' ? 'Gespeichert ✓' : 'Speichern'}
          </button>
        </div>
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════
// Step 12 · Name + Headline
// ════════════════════════════════════════════════════════════

export function Step12NameHeadline({ draftId, initialIdentity, onSaved }: { draftId: string; initialIdentity?: OfferIdentity | null; onSaved?: () => void }) {
  const [identity, setIdentity] = useState<OfferIdentity>(initialIdentity ?? { name: '', subheadline: '', headline: '', cta: '' })
  const [variants, setVariants] = useState<OfferIdentityVariant[]>(initialIdentity?.generatedVariants ?? [])
  const [suggesting, setSuggesting] = useState(false)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    setSuggesting(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step12/suggest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'AI fehlgeschlagen'); return }
      setVariants((data.variants as OfferIdentityVariant[]) ?? [])
    } catch (e) { setError(String(e)) }
    finally { setSuggesting(false) }
  }

  function pickVariant(v: OfferIdentityVariant) {
    setIdentity({ name: v.name, headline: v.headline, cta: v.cta, subheadline: identity.subheadline, ctaSecondary: identity.ctaSecondary, generatedVariants: variants })
  }

  async function saveAll() {
    setSaving('saving'); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step12`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...identity, generatedVariants: variants }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save fehlgeschlagen'); setSaving('idle'); return }
      setSaving('saved'); setTimeout(() => setSaving('idle'), 2000); onSaved?.()
    } catch (e) { setError(String(e)); setSaving('idle') }
  }

  return (
    <section className="bg-cream px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
          <span className="h-1.5 w-1.5 rounded-full bg-blue" /> Schritt 12
        </span>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">Name + Headline.</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Die letzten 20 %. Drei Mikro-Entscheidungen, die aus dem Substanz-Stapel der Schritte 1–11 ein lesbares Angebot machen.
        </p>

        <div className="mt-8 mb-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">Markus' Lehre · Wachstumsmotor Maschinenbau</span>
          <blockquote className="mt-2 font-serif text-base italic leading-relaxed text-gray-800">
            „Endgültiger Name: ‚Der Wachstumsmotor für den Maschinenbau.' Konkret. Branchenscharf. Drei Wochen nach Re-Launch hat der erste Kunde im internen Slack geteilt: ‚Schaut Euch das mal an — der Wachstumsmotor für unsereins.' Das ist Naming-Effekt. Niemand teilt ‚Strategisches Wachstums-Programm 2.0'."
          </blockquote>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-blue-border bg-white p-5 shadow-sm">
          <button onClick={suggest} disabled={suggesting}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue/90 disabled:opacity-50">
            {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {suggesting ? 'AI generiert…' : 'AI: 5 Naming-Patterns generieren'}
          </button>
          <p className="text-xs italic text-muted">Mechanism · Outcome · Time · Anti-Pattern · Inside-Joke</p>
        </div>

        {variants.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {variants.map((v, i) => (
              <button key={i} onClick={() => pickVariant(v)}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left hover:border-blue hover:shadow-md">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue">{v.pattern}</p>
                <p className="font-serif text-2xl text-ink">{v.name}</p>
                <p className="mt-2 text-sm text-gray-700">{v.headline}</p>
                <p className="mt-2 text-xs text-gray-500">CTA: {v.cta}</p>
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-700">Name</span>
            <input value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-serif text-2xl text-ink" /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-700">Subheadline (optional)</span>
            <input value={identity.subheadline ?? ''} onChange={(e) => setIdentity({ ...identity, subheadline: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm" /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-700">Headline (1 Satz, User-Outcome-fokussiert)</span>
            <textarea value={identity.headline} onChange={(e) => setIdentity({ ...identity, headline: e.target.value })} rows={2} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-700">CTA (Mikro-Schritt)</span>
              <input value={identity.cta} onChange={(e) => setIdentity({ ...identity, cta: e.target.value })} placeholder="z.B. „45-Min-Sparring buchen"" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm" /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-700">CTA Sekundär (optional)</span>
              <input value={identity.ctaSecondary ?? ''} onChange={(e) => setIdentity({ ...identity, ctaSecondary: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm" /></label>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red">{error}</p>}
        <div className="mt-8 flex items-center justify-end gap-3">
          <button onClick={saveAll} disabled={saving === 'saving'}
            className="inline-flex items-center gap-2 rounded-full bg-[#0A0D14] px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50">
            {saving === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving === 'saved' ? 'Gespeichert ✓ — Bauplan komplett!' : 'Speichern · Bauplan abschliessen'}
          </button>
        </div>
      </div>
    </section>
  )
}
