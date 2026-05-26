'use client'

import { useState } from 'react'
import { Loader2, Plus, Save, Search, X } from 'lucide-react'
import type { ICP, ICPCurrency, ICPPainGain, ICPDemographics } from '@/lib/wizard-v2/types'

interface PillSuggestion {
  text: string
  meta?: string
}

interface PillsState {
  roles: PillSuggestion[]
  whereToMeet: PillSuggestion[]
  currencies: Array<{ metric: string; unit?: string; rangeLabel: string }>
  pains: Array<{ topic: string; reality: string; economicImpact: string; kpi: string; linkedCurrencyMetric?: string }>
  gains: Array<{ topic: string; reality: string; economicImpact: string; kpi: string; linkedCurrencyMetric?: string }>
}

interface Props {
  draftId: string
  initialICP?: ICP | null
  onSaved?: () => void
}

const EMPTY_DEMO: ICPDemographics = {
  name: '',
  role: '',
  responsibilities: '',
  whereToMeet: [],
}

export function Step02ICP({ draftId, initialICP, onSaved }: Props) {
  const [demographics, setDemographics] = useState<ICPDemographics>(initialICP?.demographics ?? EMPTY_DEMO)
  const [currencies, setCurrencies] = useState<ICPCurrency[]>(initialICP?.currencies ?? [])
  const [painsGains, setPainsGains] = useState<ICPPainGain[]>(initialICP?.painsGains ?? [])

  const [researching, setResearching] = useState(false)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pills, setPills] = useState<PillsState>({ roles: [], whereToMeet: [], currencies: [], pains: [], gains: [] })

  async function research() {
    setResearching(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step02/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingCurrencies: currencies, existingPainsGains: painsGains }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Recherche fehlgeschlagen.'); return }
      setPills({
        roles: Array.isArray(data.pills?.roles) ? data.pills.roles : [],
        whereToMeet: Array.isArray(data.pills?.whereToMeet) ? data.pills.whereToMeet : [],
        currencies: Array.isArray(data.pills?.currencies) ? data.pills.currencies : [],
        pains: Array.isArray(data.pills?.pains) ? data.pills.pains : [],
        gains: Array.isArray(data.pills?.gains) ? data.pills.gains : [],
      })
    } catch (e) { setError(String(e)) }
    finally { setResearching(false) }
  }

  function acceptRolePill(p: PillSuggestion) {
    setDemographics((d) => ({ ...d, role: p.text }))
    setPills((s) => ({ ...s, roles: s.roles.filter((x) => x.text !== p.text) }))
  }
  function acceptWhereToMeetPill(p: PillSuggestion) {
    setDemographics((d) => ({ ...d, whereToMeet: [...(d.whereToMeet ?? []), p.text] }))
    setPills((s) => ({ ...s, whereToMeet: s.whereToMeet.filter((x) => x.text !== p.text) }))
  }
  function acceptCurrencyPill(p: { metric: string; unit?: string; rangeLabel: string }) {
    setCurrencies((c) => [...c, { id: crypto.randomUUID(), metric: p.metric, unit: p.unit, rangeLabel: p.rangeLabel }])
    setPills((s) => ({ ...s, currencies: s.currencies.filter((x) => x.metric !== p.metric) }))
  }
  function acceptPainPill(p: PillsState['pains'][number]) {
    const linkedCurrencyId = p.linkedCurrencyMetric
      ? currencies.find((c) => c.metric === p.linkedCurrencyMetric)?.id
      : undefined
    setPainsGains((pg) => [...pg, {
      id: crypto.randomUUID(),
      type: 'pain',
      topic: p.topic,
      reality: p.reality,
      economicImpact: p.economicImpact,
      kpi: p.kpi,
      linkedCurrencyId,
      order: pg.length,
      createdBy: 'ai',
    } as ICPPainGain])
    setPills((s) => ({ ...s, pains: s.pains.filter((x) => x.topic !== p.topic) }))
  }
  function acceptGainPill(p: PillsState['gains'][number]) {
    const linkedCurrencyId = p.linkedCurrencyMetric
      ? currencies.find((c) => c.metric === p.linkedCurrencyMetric)?.id
      : undefined
    setPainsGains((pg) => [...pg, {
      id: crypto.randomUUID(),
      type: 'gain',
      topic: p.topic,
      reality: p.reality,
      economicImpact: p.economicImpact,
      kpi: p.kpi,
      linkedCurrencyId,
      order: pg.length,
      createdBy: 'ai',
    } as ICPPainGain])
    setPills((s) => ({ ...s, gains: s.gains.filter((x) => x.topic !== p.topic) }))
  }

  function removeCurrency(id: string) { setCurrencies((c) => c.filter((x) => x.id !== id)) }
  function removePainGain(id: string) { setPainsGains((pg) => pg.filter((x) => x.id !== id)) }

  async function saveAll() {
    setSaving('saving'); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step02`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demographics, currencies, painsGains }),
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
            Schritt 02
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">ICP — Ideal Customer Profile.</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Wer leidet täglich, wer beurteilt das Angebot, wer entscheidet zu kaufen? Drei Rollen, eine Reihenfolge. Manchmal dieselbe Person, oft drei. Wir füllen alle Felder mit Pill-Vorschlägen — Du klickst, was passt. Kein Auto-Fill.
          </p>
        </div>

        {/* Markus-Voice */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <blockquote className="border-l-4 border-blue pl-5 font-serif text-lg italic leading-relaxed text-gray-800">
            „CFO-Sprache ist nicht VP-Sales-Sprache. Wenn Du nicht weißt, wie ein VP Sales über Pipeline-Coverage spricht, verkaufst Du an die falsche Person."
          </blockquote>
        </div>

        {/* Recherche-Trigger */}
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-blue-border bg-white p-5 shadow-sm">
          <button
            onClick={research}
            disabled={researching}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue/90 disabled:opacity-50"
          >
            {researching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {researching ? 'Recherchiere…' : 'Recherchieren & Pills vorschlagen'}
          </button>
          <p className="text-xs italic text-muted">Ein Klick — AI scant ICP, schlägt Demographics, Currencies, Pains und Gains als anklickbare Pills.</p>
        </div>

        {/* A · Demographics */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">A</span>
            <h3 className="text-xl font-bold text-ink">Demographics</h3>
          </div>
          <Field label="Persona-Name (optional)">
            <input type="text" value={demographics.name ?? ''} onChange={(e) => setDemographics({ ...demographics, name: e.target.value })} placeholder={'z.B. „Lena, die Pipeline-Pragmatikerin“'} className="input-base" />
          </Field>
          <Field label="Rolle / Job-Titel" help="Konkrete Rolle, nicht „Sales-Leader".">
            <input type="text" value={demographics.role} onChange={(e) => setDemographics({ ...demographics, role: e.target.value })} placeholder={'z.B. „VP Sales B2B SaaS“'} className="input-base" />
          </Field>
          {pills.roles.length > 0 && (
            <PillRow label="AI-Vorschläge für Rolle" pills={pills.roles} onAccept={acceptRolePill} />
          )}
          <Field label="Verantwortung (1–2 Sätze)">
            <textarea value={demographics.responsibilities} onChange={(e) => setDemographics({ ...demographics, responsibilities: e.target.value })} rows={2} placeholder="Was macht diese Rolle täglich?" className="input-base" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <Field label="Firma ab (MA)">
              <input type="number" value={demographics.companySizeMin ?? ''} onChange={(e) => setDemographics({ ...demographics, companySizeMin: Number(e.target.value) || undefined })} className="input-base" />
            </Field>
            <Field label="Firma bis (MA)">
              <input type="number" value={demographics.companySizeMax ?? ''} onChange={(e) => setDemographics({ ...demographics, companySizeMax: Number(e.target.value) || undefined })} className="input-base" />
            </Field>
          </div>
          <Field label="Wo treffen" help="Konferenzen, Communities, Plattformen.">
            <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2 min-h-[44px]">
              {(demographics.whereToMeet ?? []).map((w, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                  {w}
                  <button onClick={() => setDemographics({ ...demographics, whereToMeet: (demographics.whereToMeet ?? []).filter((_, idx) => idx !== i) })} className="text-gray-500 hover:text-red">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </Field>
          {pills.whereToMeet.length > 0 && (
            <PillRow label="AI-Vorschläge Treffpunkte" pills={pills.whereToMeet} onAccept={acceptWhereToMeetPill} />
          )}
        </div>

        {/* B · Currencies */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">B</span>
            <h3 className="text-xl font-bold text-ink">Worauf es für diese Person ankommt</h3>
          </div>
          <p className="mb-4 text-sm text-muted">3-5 KPIs, an denen sich diese Person messen lässt — und wofür sie Quartal für Quartal kämpft.</p>

          {currencies.length > 0 ? (
            <ol className="mb-4 space-y-2">
              {currencies.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue text-xs font-bold text-white">{i + 1}</span>
                  <span className="flex-1 font-semibold text-ink">{c.metric}</span>
                  <span className="rounded bg-orange-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange">
                    {c.unit ? c.unit + ' · ' : ''}{c.rangeLabel}
                  </span>
                  <button onClick={() => removeCurrency(c.id)} className="text-gray-400 hover:text-red"><X size={14} /></button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mb-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm italic text-muted">
              Klick „Recherchieren" oben — AI schlägt 3-5 KPIs als Pills vor.
            </p>
          )}

          {pills.currencies.length > 0 && (
            <PillRow
              label="AI-Vorschläge Currencies"
              pills={pills.currencies.map((c) => ({ text: c.metric, meta: (c.unit ? c.unit + ' · ' : '') + c.rangeLabel }))}
              onAccept={(p) => {
                const original = pills.currencies.find((c) => c.metric === p.text)
                if (original) acceptCurrencyPill(original)
              }}
            />
          )}
        </div>

        {/* C · Pains + Gains */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">C</span>
            <h3 className="text-xl font-bold text-ink">Was sie heute frisst — und was sie stattdessen will</h3>
          </div>
          <p className="mb-4 text-sm text-muted">3-7 tägliche Schmerzen + 2-4 Wunsch-Ergebnisse. Jeweils mit Currency-Anker an die KPIs oben.</p>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red">Pains · heute</p>
          {painsGains.filter((p) => p.type === 'pain').length === 0 && (
            <p className="mb-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-center text-xs italic text-muted">
              Pills laden via „Recherchieren" — oder selbst eintragen.
            </p>
          )}
          {painsGains.filter((p) => p.type === 'pain').map((p) => {
            const linkedCurrency = currencies.find((c) => c.id === p.linkedCurrencyId)
            return (
              <div key={p.id} className="mb-2 rounded-lg border border-l-4 border-gray-200 border-l-red bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{p.topic}</span>
                      {linkedCurrency && (
                        <span className="rounded bg-orange-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange">
                          {linkedCurrency.metric}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{p.reality}</p>
                    <p className="mt-2 text-xs text-gray-500"><strong>Impact:</strong> {p.economicImpact} · <strong>KPI:</strong> {p.kpi}</p>
                  </div>
                  <button onClick={() => removePainGain(p.id)} className="text-gray-400 hover:text-red mt-1"><X size={14} /></button>
                </div>
              </div>
            )
          })}
          {pills.pains.length > 0 && (
            <PillRow
              label="AI-Vorschläge Pains"
              pills={pills.pains.map((p) => ({ text: p.topic, meta: p.linkedCurrencyMetric }))}
              onAccept={(p) => {
                const original = pills.pains.find((x) => x.topic === p.text)
                if (original) acceptPainPill(original)
              }}
            />
          )}

          <p className="mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-green-700">Gains · erhofft</p>
          {painsGains.filter((p) => p.type === 'gain').map((p) => {
            const linkedCurrency = currencies.find((c) => c.id === p.linkedCurrencyId)
            return (
              <div key={p.id} className="mb-2 rounded-lg border border-l-4 border-gray-200 border-l-green-600 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{p.topic}</span>
                      {linkedCurrency && (
                        <span className="rounded bg-orange-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange">
                          {linkedCurrency.metric}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{p.reality}</p>
                    <p className="mt-2 text-xs text-gray-500"><strong>Wert:</strong> {p.economicImpact} · <strong>KPI:</strong> {p.kpi}</p>
                  </div>
                  <button onClick={() => removePainGain(p.id)} className="text-gray-400 hover:text-red mt-1"><X size={14} /></button>
                </div>
              </div>
            )
          })}
          {pills.gains.length > 0 && (
            <PillRow
              label="AI-Vorschläge Gains"
              pills={pills.gains.map((p) => ({ text: p.topic, meta: p.linkedCurrencyMetric }))}
              onAccept={(p) => {
                const original = pills.gains.find((x) => x.topic === p.text)
                if (original) acceptGainPill(original)
              }}
            />
          )}
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

      <style jsx>{`
        :global(.input-base) {
          width: 100%; border-radius: 0.75rem; border: 1px solid #E5E7EB;
          background: #fff; padding: 0.625rem 0.875rem; font-size: 0.875rem; color: #0D0D0B;
        }
        :global(.input-base:focus) { outline: none; border-color: #1A5FD4; box-shadow: 0 0 0 3px #EBF1FF; }
      `}</style>
    </section>
  )
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block mt-4">
      <span className="mb-1 block text-xs font-semibold text-gray-700">{label}</span>
      {help && <span className="mb-1.5 block text-[11px] italic text-muted">{help}</span>}
      {children}
    </label>
  )
}

function PillRow({ label, pills, onAccept }: { label: string; pills: PillSuggestion[]; onAccept: (p: PillSuggestion) => void }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-blue-border bg-blue-bg p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue">{label}</p>
      <div className="flex flex-wrap gap-2">
        {pills.map((p, i) => (
          <button
            key={i}
            onClick={() => onAccept(p)}
            className="inline-flex items-center gap-1 rounded-full border border-blue-border bg-white px-3 py-1 text-xs text-blue hover:bg-blue hover:text-white"
          >
            <Plus size={11} />
            {p.text}
            {p.meta && <span className="ml-1 rounded bg-orange-bg px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange">{p.meta}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
