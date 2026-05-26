'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus, RefreshCw, Save, Search, Sparkles, X } from 'lucide-react'
import type { BusinessContext, ProductOrService, BuildingBlock } from '@/lib/wizard-v2/types'

interface Props {
  draftId: string
  initialBusinessContext?: BusinessContext | null
  initialProduct?: ProductOrService | null
  initialBlocks?: BuildingBlock[]
  onSaved?: () => void
}

const EMPTY_BC: BusinessContext = {
  marketPosition: '',
  targetMarket: '',
  businessModel: 'hybrid',
  competitivePositioning: '',
}

const EMPTY_PRODUCT: ProductOrService = {
  productName: '',
  productType: 'programm',
  productSummary: '',
  productUrl: '',
  productStage: 'pilot',
}

const BUSINESS_MODELS: Array<{ value: BusinessContext['businessModel']; label: string }> = [
  { value: 'saas', label: 'SaaS' },
  { value: 'service', label: 'Service' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'course', label: 'Kurs' },
  { value: 'membership', label: 'Membership' },
  { value: 'lizenz', label: 'Lizenz' },
]

const PRODUCT_TYPES: Array<{ value: ProductOrService['productType']; label: string }> = [
  { value: 'programm', label: 'Programm' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'software', label: 'Software' },
  { value: 'lizenz', label: 'Lizenz' },
  { value: 'membership', label: 'Membership' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'service', label: 'Service' },
  { value: 'beratung', label: 'Beratung' },
]

const PRODUCT_STAGES: Array<{ value: ProductOrService['productStage']; label: string }> = [
  { value: 'idee', label: 'Idee' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'live', label: 'Live' },
  { value: 'skalierung', label: 'Skalierung' },
]

export function Step01BusinessProductBlocks({
  draftId,
  initialBusinessContext,
  initialProduct,
  initialBlocks,
  onSaved,
}: Props) {
  const [bc, setBc] = useState<BusinessContext>(initialBusinessContext ?? EMPTY_BC)
  const [product, setProduct] = useState<ProductOrService>(initialProduct ?? EMPTY_PRODUCT)
  const [blocks, setBlocks] = useState<BuildingBlock[]>(initialBlocks ?? [])

  const [researching, setResearching] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)
  const autoTried = useRef(false)

  // Auto-suggest blocks on mount if empty AND product is filled
  useEffect(() => {
    if (autoTried.current || blocks.length > 0) return
    if (!product.productName || !product.productSummary) return
    autoTried.current = true
    void suggestBlocks(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runResearch() {
    setResearching(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step01/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingBlocks: blocks }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Recherche fehlgeschlagen.'); return }
      if (data.businessContext) setBc({ ...EMPTY_BC, ...data.businessContext })
      if (data.product) setProduct({ ...EMPTY_PRODUCT, ...data.product })
      if (Array.isArray(data.blocks) && blocks.length === 0) setBlocks(data.blocks)
    } catch (e) { setError(String(e)) }
    finally { setResearching(false) }
  }

  async function suggestBlocks(initial: boolean) {
    setSuggesting(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step01/blocks/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingBlocks: blocks, businessContext: bc, product, initial }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Suggest fehlgeschlagen.'); return }
      if (Array.isArray(data.blocks)) {
        if (initial && blocks.length === 0) setBlocks(data.blocks)
        else {
          // Dedupe-Append
          const norm = (t: string) => (t || '').trim().toLowerCase()
          const seen = new Set(blocks.map((b) => norm(b.name)))
          const fresh = (data.blocks as BuildingBlock[]).filter((b) => !seen.has(norm(b.name)))
          setBlocks([...blocks, ...fresh])
        }
      }
    } catch (e) { setError(String(e)) }
    finally { setSuggesting(false) }
  }

  async function saveAll() {
    setSaving('saving'); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/step01`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessContext: bc, product, blocks }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Speichern fehlgeschlagen.'); setSaving('idle'); return }
      setSaving('saved')
      setTimeout(() => setSaving('idle'), 2000)
      onSaved?.()
    } catch (e) { setError(String(e)); setSaving('idle') }
  }

  function updateBlock(i: number, patch: Partial<BuildingBlock>) {
    setBlocks((p) => p.map((b, idx) => (idx === i ? { ...b, ...patch } : b)))
  }
  function removeBlock(i: number) { setBlocks((p) => p.filter((_, idx) => idx !== i)) }
  function addBlock() {
    setBlocks((p) => [...p, { id: crypto.randomUUID(), name: '', description: '', isBonus: false, order: p.length }])
  }
  function toggleBonus(i: number) {
    setBlocks((p) => p.map((b, idx) => (idx === i ? { ...b, isBonus: !b.isBonus } : b)))
  }

  const nonBonusCount = blocks.filter((b) => !b.isBonus).length

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" />
            Schritt 01
          </span>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Was bauen wir hier —<br />und woraus besteht es.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Welcome erfasst Deine Organisation generell. Hier zoomen wir auf das eine Produkt oder den einen Service, für den dieser Bauplan entsteht. Ein User kann mehrere Bauplaene pro Organisation halten. Ohne Produkt-Fokus baut die AI im Rest des Bauplans unscharf.
          </p>
        </div>

        {/* Recherche-Trigger */}
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-blue-border bg-white p-5 shadow-sm">
          <button
            onClick={runResearch}
            disabled={researching}
            className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50"
          >
            {researching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {researching ? 'Recherchiere…' : 'Business + Produkt recherchieren'}
          </button>
          <p className="text-xs italic text-muted">
            Ein Klick — AI scant Website mit Produkt-Fokus, befüllt 01a + 01b + 5 Bausteine + 1 Bonus.
          </p>
        </div>

        {/* 01a Business-Kontext */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">01a</span>
            <h3 className="text-xl font-bold text-ink">Business-Kontext</h3>
          </div>
          <div className="space-y-5">
            <Field label="Markt-Position" help="1 Satz: Marktführer / Challenger / Nische / neu.">
              <textarea
                value={bc.marketPosition}
                onChange={(e) => setBc({ ...bc, marketPosition: e.target.value })}
                rows={2}
                placeholder="z.B. Challenger im B2B-Sales-Coaching-Markt für DACH-Mid-Market."
                className="input-base"
              />
            </Field>
            <Field label="Zielmarkt" help="1–2 Sätze: Branche, Region, Reifegrad.">
              <textarea
                value={bc.targetMarket}
                onChange={(e) => setBc({ ...bc, targetMarket: e.target.value })}
                rows={2}
                placeholder="z.B. B2B-SaaS- und Service-Gründer 10–100 Mitarbeiter, Pre-Series-A bis Series-B in DACH."
                className="input-base"
              />
            </Field>
            <Field label="Geschäftsmodell">
              <select
                value={bc.businessModel}
                onChange={(e) => setBc({ ...bc, businessModel: e.target.value as BusinessContext['businessModel'] })}
                className="input-base"
              >
                {BUSINESS_MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Kompetitive Positionierung" help="1 Satz: was unterscheidet Dich — nur die Spitze.">
              <textarea
                value={bc.competitivePositioning}
                onChange={(e) => setBc({ ...bc, competitivePositioning: e.target.value })}
                rows={2}
                placeholder="z.B. 25 Jahre operative B2B-Vertriebspraxis vs. Coaches mit Trainings-Hintergrund."
                className="input-base"
              />
            </Field>
          </div>
        </div>

        {/* 01b Produkt / Service */}
        <div className="mb-6 rounded-2xl border-2 border-blue-border bg-white p-8 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">01b · Produkt</span>
            <span className="inline-block rounded-full bg-amber-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber">
              {PRODUCT_STAGES.find((s) => s.value === product.productStage)?.label ?? product.productStage}
            </span>
          </div>
          <Field label="Produkt-Name" help="Max 6 Worte — interner Arbeitstitel.">
            <input
              type="text"
              value={product.productName}
              onChange={(e) => setProduct({ ...product, productName: e.target.value })}
              placeholder="z.B. SalesMade Founding 30"
              className="input-base"
            />
          </Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Typ">
              <select
                value={product.productType}
                onChange={(e) => setProduct({ ...product, productType: e.target.value as ProductOrService['productType'] })}
                className="input-base"
              >
                {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select
                value={product.productStage}
                onChange={(e) => setProduct({ ...product, productStage: e.target.value as ProductOrService['productStage'] })}
                className="input-base"
              >
                {PRODUCT_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Produkt-Summary" help="1–2 Sätze: was es ist und für wen.">
              <textarea
                value={product.productSummary}
                onChange={(e) => setProduct({ ...product, productSummary: e.target.value })}
                rows={3}
                placeholder="z.B. Lifetime-Founding-Member-Cohort für B2B-Gründer mit persönlichem Coaching, Software-Zugang, Playbook-Library, Slack-Sparring und Quartals-Reviews."
                className="input-base"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Produkt-URL (optional)" help="Falls Du eine Landing-Page für dieses Produkt hast.">
              <input
                type="url"
                value={product.productUrl ?? ''}
                onChange={(e) => setProduct({ ...product, productUrl: e.target.value })}
                placeholder="https://salesmade.com/founding-30"
                className="input-base"
              />
            </Field>
          </div>
        </div>

        {/* 01d Bausteine */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-5 flex items-baseline justify-between">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue">01d</span>
              <h3 className="mt-1 text-xl font-bold text-ink">Bausteine — Top 5 + Bonus</h3>
            </div>
            <span className="text-xs text-muted">{nonBonusCount} / 5+ erfasst</span>
          </div>

          <p className="mb-4 border-l-2 border-blue pl-4 font-serif text-base italic text-gray-700">
            „Drei werden gemerkt, fünf gehen, sieben ist die Schmerzgrenze. Wenn die Liste unter fünf bleibt, fehlt nicht Material — fehlt Schärfe."
            <span className="mt-1 block font-sans text-[10px] not-italic uppercase tracking-widest text-muted">Markus' Lehre</span>
          </p>

          <ol className="space-y-3">
            {blocks.map((block, i) => (
              <li key={block.id} className="flex items-start gap-3">
                <button
                  onClick={() => toggleBonus(i)}
                  title={block.isBonus ? 'Bonus → Pflicht' : 'Pflicht → Bonus'}
                  className={
                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ' +
                    (block.isBonus ? 'bg-orange' : 'bg-[#0A0D14]')
                  }
                >
                  {block.isBonus ? '★' : i + 1 - blocks.slice(0, i).filter((b) => b.isBonus).length}
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    value={block.name}
                    onChange={(e) => updateBlock(i, { name: e.target.value })}
                    placeholder="Baustein-Name (z.B. Setup-Workshop)"
                    className="w-full border-b border-gray-200 bg-transparent pb-1 text-sm font-semibold text-ink focus:border-blue focus:outline-none"
                  />
                  <input
                    type="text"
                    value={block.description}
                    onChange={(e) => updateBlock(i, { description: e.target.value })}
                    placeholder="Was er leistet (nicht was er IST). 1 Satz."
                    className="mt-1 w-full bg-transparent text-xs text-gray-600 focus:outline-none"
                  />
                </div>
                {block.isBonus && (
                  <span className="mt-1 rounded bg-orange-bg px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-orange">
                    Bonus
                  </span>
                )}
                <button onClick={() => removeBlock(i)} className="mt-1 text-gray-400 hover:text-red">
                  <X size={14} />
                </button>
              </li>
            ))}
            {blocks.length === 0 && (
              <li className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm italic text-muted">
                Noch keine Bausteine. Klick „Recherchieren" oben — die AI schlägt 5 + 1 Bonus vor.
              </li>
            )}
          </ol>

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={addBlock} className="inline-flex items-center gap-1.5 rounded-full bg-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue/90">
              <Plus size={12} /> Baustein
            </button>
            <button
              onClick={() => suggestBlocks(false)}
              disabled={suggesting}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Mehr vorschlagen
            </button>
            <button
              onClick={() => suggestBlocks(false)}
              disabled={suggesting}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={12} /> Bonus vorschlagen
            </button>
          </div>
        </div>

        {/* Save-Bar */}
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

      {/* Local utility class for inputs (kept inline so it ships with the component) */}
      <style jsx>{`
        :global(.input-base) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #E5E7EB;
          background: #fff;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #0D0D0B;
          line-height: 1.4;
        }
        :global(.input-base:focus) {
          outline: none;
          border-color: #1A5FD4;
          box-shadow: 0 0 0 3px #EBF1FF;
        }
      `}</style>
    </section>
  )
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-700">{label}</span>
      {help && <span className="mb-1.5 block text-[11px] italic text-muted">{help}</span>}
      {children}
    </label>
  )
}
