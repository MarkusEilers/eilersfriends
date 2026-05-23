'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Sparkles, Plus, X, Save, Send, Loader2, AlertCircle, EyeOff, Eye } from 'lucide-react'
import { updateOfferAction, suggestSectionAction, setOfferStatusAction } from '@/lib/actions/offers'
import { OfferPreview } from './OfferPreview'

interface Goal { v: string }
interface UnderstandingData { title?: string; goals?: string[]; challenges?: string[] }
interface EmpathyData { title?: string; statement?: string; successMessage?: string }
interface EconomicResultData { icon?: 'target'|'users'|'trending-up'|'shield'|'zap'|'star'; title: string; description?: string }
interface PricingOptData { type?: 'DIY'|'DWY'|'DFY'; title: string; description?: string; price: number; monthlyDuration?: number; features?: string[]; recommended?: boolean }
interface ProgramData { id?: string; title: string; subtitle?: string; description?: string; pricing?: PricingOptData[] }

export interface OfferEditorState {
  id: string
  title: string
  subtitle: string
  tagline: string
  customerName: string
  customerCompany: string
  customerEmail: string
  understanding: UnderstandingData
  empathy: EmpathyData
  economic: EconomicResultData[]
  programs: ProgramData[]
  status: string
}

export function OfferEditor({ initial, accessSalt, offerNumber }: { initial: OfferEditorState; accessSalt?: string; offerNumber?: string }) {
  const [s, setS] = useState<OfferEditorState>(initial)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [suggesting, setSuggesting] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const router = useRouter()

  function patch<K extends keyof OfferEditorState>(key: K, value: OfferEditorState[K]) {
    setS((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    setError(null)
    startTransition(async () => {
      try {
        await updateOfferAction(s.id, {
          title: s.title, subtitle: s.subtitle || null, tagline: s.tagline || null,
          customerName: s.customerName, customerCompany: s.customerCompany || null, customerEmail: s.customerEmail || null,
          understandingSection: s.understanding, empathySection: s.empathy,
          economicResults: s.economic, programs: s.programs,
        })
        setSavedAt(Date.now())
      } catch (e) { setError(String(e)) }
    })
  }

  function markSent() {
    startTransition(async () => {
      try { await setOfferStatusAction(s.id, 'sent'); patch('status', 'sent') } catch (e) { setError(String(e)) }
    })
  }

  async function suggest(section: 'title' | 'understanding' | 'empathy' | 'economic' | 'pricing', extra?: string) {
    setSuggesting(section); setError(null)
    try {
      const res = await suggestSectionAction({ offerId: s.id, section, customPrompt: extra })
      if (!res.ok) { setError(res.error); return }
      const sug = res.suggestion as Record<string, unknown> | unknown[]
      if (section === 'title' && !Array.isArray(sug)) {
        const o = sug as { title?: string; subtitle?: string; tagline?: string }
        setS((p) => ({ ...p, title: o.title ?? p.title, subtitle: o.subtitle ?? p.subtitle, tagline: o.tagline ?? p.tagline }))
      } else if (section === 'understanding') {
        patch('understanding', sug as UnderstandingData)
      } else if (section === 'empathy') {
        patch('empathy', sug as EmpathyData)
      } else if (section === 'economic') {
        if (Array.isArray(sug)) patch('economic', sug as EconomicResultData[])
      } else if (section === 'pricing') {
        if (Array.isArray(sug)) {
          // Wrap into a single program if no programs exist
          setS((p) => ({
            ...p,
            programs: p.programs.length
              ? p.programs.map((prog, i) => i === 0 ? { ...prog, pricing: sug as PricingOptData[] } : prog)
              : [{ title: p.title || 'Programm', pricing: sug as PricingOptData[] }],
          }))
        }
      }
    } catch (e) { setError(String(e)) }
    finally { setSuggesting(null) }
  }

  const formSections = (
    <div className="space-y-6">
      {/* Customer */}
      <Section label="Kunde">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Name" value={s.customerName} onChange={(v) => patch('customerName', v)} />
          <Field label="Firma" value={s.customerCompany} onChange={(v) => patch('customerCompany', v)} />
          <Field label="E-Mail" value={s.customerEmail} onChange={(v) => patch('customerEmail', v)} />
        </div>
      </Section>

      {/* Hero / Title */}
      <Section label="Hero · Titel" onSuggest={() => suggest('title')} suggesting={suggesting === 'title'}>
        <Field label="Tagline" value={s.tagline} onChange={(v) => patch('tagline', v)} />
        <Field label="Titel" value={s.title} onChange={(v) => patch('title', v)} />
        <Field label="Subtitle" value={s.subtitle} onChange={(v) => patch('subtitle', v)} multiline />
      </Section>

      {/* Understanding */}
      <Section label="Verständnis · Ziele + Herausforderungen" onSuggest={() => suggest('understanding')} suggesting={suggesting === 'understanding'}>
        <Field label="Titel" value={s.understanding.title ?? ''} onChange={(v) => patch('understanding', { ...s.understanding, title: v })} />
        <StringArray
          label="Ziele"
          items={s.understanding.goals ?? []}
          onChange={(arr) => patch('understanding', { ...s.understanding, goals: arr })}
        />
        <StringArray
          label="Herausforderungen"
          items={s.understanding.challenges ?? []}
          onChange={(arr) => patch('understanding', { ...s.understanding, challenges: arr })}
        />
      </Section>

      {/* Empathy */}
      <Section label="Empathy · Was wir verstanden haben" onSuggest={() => suggest('empathy')} suggesting={suggesting === 'empathy'}>
        <Field label="Statement (großes Zitat)" value={s.empathy.statement ?? ''} onChange={(v) => patch('empathy', { ...s.empathy, statement: v })} multiline />
        <Field label="Success-Message (was Erfolg für uns heißt)" value={s.empathy.successMessage ?? ''} onChange={(v) => patch('empathy', { ...s.empathy, successMessage: v })} multiline />
      </Section>

      {/* Economic Results */}
      <Section label="Ergebnisse · Was Du dadurch erreichst" onSuggest={() => suggest('economic')} suggesting={suggesting === 'economic'}>
        <EconomicEditor items={s.economic} onChange={(arr) => patch('economic', arr)} />
      </Section>

      {/* Pricing */}
      <Section label="Preise · DIY · DWY · DFY" onSuggest={() => suggest('pricing')} suggesting={suggesting === 'pricing'}>
        <PricingEditor programs={s.programs} onChange={(arr) => patch('programs', arr)} />
      </Section>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Sticky Topbar */}
      <div className="sticky top-0 z-30 -mx-6 -mt-6 mb-6 border-b border-gray-200 bg-white/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0"><h2 className="truncate text-xl font-bold text-gray-900">{s.title || 'Neues Angebot erstellen'}</h2>{offerNumber && <p className="truncate text-xs font-mono text-gray-400">{offerNumber}{accessSalt ? " · /offer/" + accessSalt.slice(0,8) + "…" : ""}</p>}</div>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-700">{s.status}</span>
            {savedAt && <span className="hidden text-xs text-gray-500 sm:inline">Gespeichert {new Date(savedAt).toLocaleTimeString('de-DE')}</span>}
            {error && <span className="inline-flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} />{error}</span>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              {showPreview ? <><EyeOff size={13} /> Vorschau ausblenden</> : <><Eye size={13} /> Vorschau anzeigen</>}
            </button>
            <button type="button" onClick={() => router.push('/admin/offers')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <X size={13} /> Abbrechen
            </button>
            {s.status === 'draft' && (
              <button type="button" onClick={markSent} disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                <Send size={11} /> Versenden
              </button>
            )}
            <button type="button" onClick={save} disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Speichern
            </button>
          </div>
        </div>
      </div>

      {/* Layout */}
      {showPreview ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>{formSections}</div>
          <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            {/* Preview */}
            <OfferPreview s={s} />
          </aside>
        </div>
      ) : (
        formSections
      )}
    </div>
  )
}

function Section({ label, children, onSuggest, suggesting }: { label: string; children: React.ReactNode; onSuggest?: () => void; suggesting?: boolean }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">{label}</h2>
        {onSuggest && (
          <button type="button" onClick={onSuggest} disabled={suggesting}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-purple-100 disabled:opacity-50">
            {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Suggest
          </button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
      ) : (
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
      )}
    </div>
  )
}

function StringArray({ label, items, onChange }: { label: string; items: string[]; onChange: (arr: string[]) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item} onChange={(e) => { const a = [...items]; a[i] = e.target.value; onChange(a) }}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="rounded-lg border border-red-200 bg-white px-2.5 text-red-600 hover:bg-red-50"><X size={14} /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ''])}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
          <Plus size={12} /> Eintrag
        </button>
      </div>
    </div>
  )
}

function EconomicEditor({ items, onChange }: { items: EconomicResultData[]; onChange: (arr: EconomicResultData[]) => void }) {
  const icons = ['target', 'users', 'trending-up', 'shield', 'zap', 'star'] as const
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3 grid grid-cols-12 gap-2 items-start">
          <select value={it.icon ?? 'target'} onChange={(e) => { const a = [...items]; a[i] = { ...it, icon: e.target.value as EconomicResultData['icon'] }; onChange(a) }}
            className="col-span-2 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs">
            {icons.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
          </select>
          <input value={it.title} placeholder="Titel" onChange={(e) => { const a = [...items]; a[i] = { ...it, title: e.target.value }; onChange(a) }}
            className="col-span-4 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          <input value={it.description ?? ''} placeholder="Beschreibung" onChange={(e) => { const a = [...items]; a[i] = { ...it, description: e.target.value }; onChange(a) }}
            className="col-span-5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="col-span-1 rounded-lg border border-red-200 bg-white px-2 py-2 text-red-600 hover:bg-red-50"><X size={14} /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { icon: 'target', title: '', description: '' }])}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
        <Plus size={12} /> Ergebnis-Tile
      </button>
    </div>
  )
}

function PricingEditor({ programs, onChange }: { programs: ProgramData[]; onChange: (arr: ProgramData[]) => void }) {
  const prog: ProgramData = programs[0] ?? { title: 'Programm', pricing: [] }
  const pricing = prog.pricing ?? []
  function updatePricing(i: number, patch: Partial<PricingOptData>) {
    const next = [...pricing]; next[i] = { ...next[i], ...patch }
    onChange([{ ...prog, pricing: next }, ...programs.slice(1)])
  }
  function addOption() {
    onChange([{ ...prog, pricing: [...pricing, { type: 'DIY', title: '', description: '', price: 0, monthlyDuration: 1, features: [], recommended: false }] }, ...programs.slice(1)])
  }
  function removeOption(i: number) {
    onChange([{ ...prog, pricing: pricing.filter((_, j) => j !== i) }, ...programs.slice(1)])
  }
  return (
    <div className="space-y-4">
      <Field label="Programm-Titel" value={prog.title} onChange={(v) => onChange([{ ...prog, title: v }, ...programs.slice(1)])} />
      {pricing.map((p, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Option {i + 1}</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500 cursor-pointer">
                <input type="checkbox" checked={p.recommended ?? false} onChange={(e) => updatePricing(i, { recommended: e.target.checked })} className="h-3.5 w-3.5" />
                Empfohlen
              </label>
              <button type="button" onClick={() => removeOption(i)} className="rounded-lg border border-red-200 bg-white px-2 py-1 text-red-600 hover:bg-red-50"><X size={12} /></button>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <select value={p.type ?? 'DIY'} onChange={(e) => updatePricing(i, { type: e.target.value as PricingOptData['type'] })}
              className="col-span-2 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs">
              <option value="DIY">DIY</option>
              <option value="DWY">DWY</option>
              <option value="DFY">DFY</option>
            </select>
            <input value={p.title} placeholder="Titel" onChange={(e) => updatePricing(i, { title: e.target.value })}
              className="col-span-4 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            <input type="number" value={p.price} placeholder="Preis €" onChange={(e) => updatePricing(i, { price: Number(e.target.value) })}
              className="col-span-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            <input type="number" value={p.monthlyDuration ?? 1} placeholder="Monate" onChange={(e) => updatePricing(i, { monthlyDuration: Number(e.target.value) })}
              className="col-span-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <Field label="Beschreibung" value={p.description ?? ''} onChange={(v) => updatePricing(i, { description: v })} multiline />
          <StringArray label="Features" items={p.features ?? []} onChange={(arr) => updatePricing(i, { features: arr })} />
        </div>
      ))}
      <button type="button" onClick={addOption}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
        <Plus size={12} /> Pricing-Option
      </button>
    </div>
  )
}
