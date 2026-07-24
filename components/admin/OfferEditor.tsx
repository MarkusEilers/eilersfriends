'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CustomerLogoUpload } from './CustomerLogoUpload'
import { Sparkles, Plus, X, Save, Send, Loader2, AlertCircle, EyeOff, Eye } from 'lucide-react'
import { updateOfferAction, suggestSectionAction, setOfferStatusAction, generateOfferFromPromptAction } from '@/lib/actions/offers'
import { OfferPreview } from './OfferPreview'
import { SectionOrderEditor, DEFAULT_SECTIONS, type SectionOrderItem } from './SectionOrderEditor'
import { UNDERSTANDING_PRESETS, EMPATHY_PRESETS, GUARANTEE_PRESETS } from '@/lib/offer/presets'
import { TEAM } from '@/lib/offer/team'

interface Goal { v: string }
interface UnderstandingData { title?: string; goals?: string[]; challenges?: string[] }
interface EmpathyData { title?: string; statement?: string; successMessage?: string }
interface TrackStepE { title: string; durationH?: number | string; description?: string; teams?: string[]; inputs?: string[]; outputs?: string[] }
interface TrackPhaseE { name: string; goal?: string; steps?: TrackStepE[] }
interface EconomicResultData { icon?: 'target'|'users'|'trending-up'|'shield'|'zap'|'star'; title: string; description?: string }
interface PricingOptData { type?: 'DIY'|'DWY'|'DFY'; title: string; description?: string; price: number; monthlyDuration?: number; features?: string[]; recommended?: boolean }
interface ProgramData { id?: string; title: string; subtitle?: string; description?: string; pricing?: PricingOptData[] }

export interface ProgramOption { id: string; name: string; slug: string; status: string; track?: TrackPhaseE[] }

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
  sectionOrder?: SectionOrderItem[]
  status: string
  recipientRole?: string
  meetingNotes?: string
  programId?: string | null
  aiPrompt?: string
  sweatEquityEnabled?: boolean
  sweatEquityPercent?: number | null
  // Wave 2.F
  customerLogoUrl?: string | null
  guaranteeText?: string | null
  track?: TrackPhaseE[]
  teamMembers?: string[]
  teamHeading?: string | null
  heroImageUrl?: string | null
  // Wave 3 — Zahlung & Annahme
  paymentCardEnabled?: boolean
  paymentInvoiceEnabled?: boolean
  rhythmMonthlyEnabled?: boolean
  rhythmUpfrontEnabled?: boolean
  upfrontDiscountPct?: number | null
}

export function OfferEditor({ initial, accessSalt, offerNumber, programOptions = [] }: { initial: OfferEditorState; accessSalt?: string; offerNumber?: string; programOptions?: ProgramOption[] }) {
  const [s, setS] = useState<OfferEditorState>(initial)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [suggesting, setSuggesting] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [generating, setGenerating] = useState(false)
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
          recipientRole: s.recipientRole ?? null,
          meetingNotes: s.meetingNotes ?? null,
          programId: s.programId ?? null,
          aiPrompt: s.aiPrompt ?? null,
          sweatEquityEnabled: s.sweatEquityEnabled,
          sweatEquityPercent: s.sweatEquityPercent ?? null,
          customerLogoUrl: s.customerLogoUrl ?? null,
          guaranteeText: s.guaranteeText ?? null,
          paymentCardEnabled: s.paymentCardEnabled ?? false,
          paymentInvoiceEnabled: s.paymentInvoiceEnabled ?? true,
          rhythmMonthlyEnabled: s.rhythmMonthlyEnabled ?? true,
          rhythmUpfrontEnabled: s.rhythmUpfrontEnabled ?? true,
          upfrontDiscountPct: s.upfrontDiscountPct ?? 0,
          track: s.track ?? [],
          teamMembers: s.teamMembers ?? ['markus', 'aljona'],
          teamHeading: s.teamHeading ?? null,
          heroImageUrl: s.heroImageUrl ?? null,
          sectionOrder: s.sectionOrder && s.sectionOrder.length ? s.sectionOrder : DEFAULT_SECTIONS,
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

  const STATUSES = ['draft', 'sent', 'signed', 'paid', 'expired', 'cancelled'] as const
  function changeStatus(next: string) {
    startTransition(async () => {
      try { await setOfferStatusAction(s.id, next as (typeof STATUSES)[number]); patch('status', next) } catch (e) { setError(String(e)) }
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

  async function generateOffer() {
    setError(null); setGenerating(true)
    try {
      const res = await generateOfferFromPromptAction(s.id, {
        prompt: s.aiPrompt ?? '',
        recipientRole: s.recipientRole,
        meetingNotes: s.meetingNotes,
        programId: s.programId ?? null,
      })
      if (!res.ok) { setError(res.error); return }
      // Reload — the action patched the DB; easiest path is hard refresh
      router.refresh()
    } catch (e) {
      setError(String(e))
    } finally {
      setGenerating(false)
    }
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

      {/* Customer Branding */}
      <Section label="Kunden-Branding">
        <p className="mb-3 text-xs text-gray-500">
          Logo erscheint im Hero des Angebots — invertiert auf Navy. Wird automatisch in BW konvertiert.
        </p>
        <CustomerLogoUpload
          offerId={s.id}
          initialUrl={s.customerLogoUrl ?? null}
          onUploaded={(url) => patch('customerLogoUrl', url || null)}
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const dom = (s.customerEmail?.split('@')[1] || '').toLowerCase().trim()
              if (!dom) { setError('Keine Kunden-E-Mail/Domain hinterlegt — für Auto-Logo bitte zuerst die E-Mail setzen.'); return }
              patch('customerLogoUrl', `https://icon.horse/icon/${dom}`)
            }}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Logo per Domain finden
          </button>
          <span className="text-xs text-gray-400">Sucht das Logo über die Kunden-Domain (aus der E-Mail). Danach Speichern.</span>
        </div>
      </Section>

      {/* Team im Angebot */}
      <Section label="Team im Angebot">
        <p className="mb-3 text-xs text-gray-500">Wer im „Wer hinter diesem Angebot steht"-Block mit Kurzbio erscheint — in der gewählten Reihenfolge.</p>
        <Field label="Überschrift des Blocks (optional)" value={s.teamHeading ?? ''} onChange={(v) => patch('teamHeading', v)} placeholder="z.B. Zwei Menschen. Eine Mission." />
        <p className="mb-2 mt-4 text-xs font-semibold text-gray-600">Auswählen</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEAM.map((m) => {
            const on = (s.teamMembers ?? ['markus', 'aljona']).includes(m.key)
            return (
              <label key={m.key} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <input type="checkbox" checked={on} className="h-4 w-4"
                  onChange={(e) => {
                    const cur = s.teamMembers ?? ['markus', 'aljona']
                    patch('teamMembers', e.target.checked ? [...cur.filter((k) => k !== m.key), m.key] : cur.filter((k) => k !== m.key))
                  }} />
                <span className="font-semibold text-gray-800">{m.name}</span>
                <span className="text-xs text-gray-400">· {m.role}</span>
              </label>
            )
          })}
        </div>
        {(s.teamMembers ?? ['markus', 'aljona']).length > 1 && (
          <>
            <p className="mb-2 mt-4 text-xs font-semibold text-gray-600">Reihenfolge</p>
            <ol className="space-y-2">
              {(s.teamMembers ?? ['markus', 'aljona']).map((key, i, arr) => {
                const m = TEAM.find((t) => t.key === key)
                if (!m) return null
                const move = (dir: -1 | 1) => {
                  const next = [...arr]
                  const j = i + dir
                  if (j < 0 || j >= next.length) return
                  ;[next[i], next[j]] = [next[j], next[i]]
                  patch('teamMembers', next)
                }
                return (
                  <li key={key} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
                    <span className="font-semibold text-gray-800">{m.name}</span>
                    <span className="text-xs text-gray-400">· {m.role}</span>
                    <span className="ml-auto flex gap-1">
                      <button type="button" onClick={() => move(-1)} disabled={i === 0} className="rounded-md border border-gray-200 px-2 py-0.5 text-xs disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => move(1)} disabled={i === arr.length - 1} className="rounded-md border border-gray-200 px-2 py-0.5 text-xs disabled:opacity-30">↓</button>
                    </span>
                  </li>
                )
              })}
            </ol>
          </>
        )}
        <div className="mt-5 border-t border-gray-100 pt-4">
          <Field label="Hero-Hintergrundbild (URL, optional)" value={s.heroImageUrl ?? ''} onChange={(v) => patch('heroImageUrl', v)} placeholder="/offer-hero.jpg" />
          <p className="mt-1 text-xs text-gray-400">Wird im Hero hinter einem 75%-Blau-Overlay angezeigt. Leer = ohne Bild.</p>
        </div>
      </Section>

      {/* KI-Assistent */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/40 to-purple-50/30 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-700">KI-Assistent</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Rolle des Empfängers" value={s.recipientRole ?? ''} onChange={(v) => patch('recipientRole', v)} />
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Programm (optional)</label>
            <select
              value={s.programId ?? ''}
              onChange={(e) => patch('programId', e.target.value || null)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">— Kein Programm zuordnen —</option>
              {programOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name} {p.status === 'draft' ? '(Draft)' : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <Field label="Gesprächsnotizen" value={s.meetingNotes ?? ''} onChange={(v) => patch('meetingNotes', v)} multiline />
        </div>
        <div className="mt-3">
          <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Briefing für das Angebot</label>
          <textarea
            value={s.aiPrompt ?? ''}
            onChange={(e) => patch('aiPrompt', e.target.value)}
            rows={4}
            placeholder="Beschreiben Sie das Angebot, das Sie erstellen möchten. Z.B.: 'Erstelle ein Angebot für die Musterfirma GmbH, die ihre B2B-Kundenakquise verbessern möchte. Sie haben Probleme mit langen Verkaufszyklen und möchten mehr qualifizierte Leads generieren.'"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={generateOffer}
          disabled={generating || !s.aiPrompt?.trim()}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Angebot generieren
        </button>
      </section>

      {/* Hero / Title */}
      <Section label="Hero · Titel" onSuggest={() => suggest('title')} suggesting={suggesting === 'title'}>
        <Field label="Tagline" value={s.tagline} onChange={(v) => patch('tagline', v)} />
        <Field label="Titel" value={s.title} onChange={(v) => patch('title', v)} />
        <Field label="Subtitle" value={s.subtitle} onChange={(v) => patch('subtitle', v)} multiline />
      </Section>

      {/* Understanding */}
      <Section label="Verständnis · Ziele + Herausforderungen" onSuggest={() => suggest('understanding')} suggesting={suggesting === 'understanding'}>
        <PresetSelect label="Vorlage einfügen" options={UNDERSTANDING_PRESETS.map((v) => v.label)} onPick={(i) => { const v = UNDERSTANDING_PRESETS[i]; patch('understanding', { title: v.title, goals: v.goals, challenges: v.challenges }) }} />
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
        <PresetSelect label="Vorlage einfügen" options={EMPATHY_PRESETS.map((v) => v.label)} onPick={(i) => { const v = EMPATHY_PRESETS[i]; patch('empathy', { ...s.empathy, statement: v.statement, successMessage: v.successMessage }) }} />
        <Field label="Statement (großes Zitat)" value={s.empathy.statement ?? ''} onChange={(v) => patch('empathy', { ...s.empathy, statement: v })} multiline />
        <Field label="Success-Message (was Erfolg für uns heißt)" value={s.empathy.successMessage ?? ''} onChange={(v) => patch('empathy', { ...s.empathy, successMessage: v })} multiline />
      </Section>

      {/* Bausteine-Track */}
      <Section label="Bausteine-Track · Phasen & Schritte">
        <p className="mb-3 text-xs text-gray-500">Phasen mit Schritten (Dauer, Teams, Nötiger Input, Output). Erscheint als eigener Block (Reihenfolge über „Abschnitte"). Tipp: Track eines Programms übernehmen und dann anpassen.</p>
        {programOptions.some((p) => (p.track?.length ?? 0) > 0) && (
          <div className="mb-3 flex items-center gap-2">
            <select
              defaultValue=""
              onChange={(e) => {
                const prog = programOptions.find((p) => p.id === e.target.value)
                if (prog?.track?.length) patch('track', [...(s.track ?? []), ...prog.track])
                e.target.value = ''
              }}
              className="w-full rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-3 py-2 text-xs text-blue-700 outline-none focus:border-blue-400"
            >
              <option value="">+ Programm-Track hinzufügen …</option>
              {programOptions.filter((p) => (p.track?.length ?? 0) > 0).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.track!.length} Phasen){p.status !== 'published' ? ' · unsichtbar' : ''}</option>
              ))}
            </select>
          </div>
        )}
        <TrackEditor phases={s.track ?? []} onChange={(t) => patch('track', t)} />
      </Section>

      {/* Economic Results */}
      <Section label="Ergebnisse · Was Du dadurch erreichst" onSuggest={() => suggest('economic')} suggesting={suggesting === 'economic'}>
        <EconomicEditor items={s.economic} onChange={(arr) => patch('economic', arr)} />
      </Section>

      {/* Sweat Equity */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Sweat Equity</h2>
            <p className="mt-1 text-xs text-gray-500">Ein Teil des Auftragswertes wird in Stock Options umgewandelt</p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={s.sweatEquityEnabled ?? false}
              onChange={(e) => patch('sweatEquityEnabled', e.target.checked)}
              className="sr-only peer" />
            <span className="relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 transition-colors">
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </span>
          </label>
        </div>
        {s.sweatEquityEnabled && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Anteil (%)</label>
              <input
                type="number" min={0} max={100}
                value={s.sweatEquityPercent ?? 0}
                onChange={(e) => patch('sweatEquityPercent', Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </section>

      {/* Garantie-Text */}
      <Section label="Garantie">
        <p className="mb-3 text-xs text-gray-500">
          Erscheint vor dem Pricing als „Whatever-it-takes"-Box. Leer = Default-Text wird verwendet.
        </p>
        <PresetSelect label="Vorlage einfügen" options={GUARANTEE_PRESETS.map((v) => v.label)} onPick={(i) => patch('guaranteeText', GUARANTEE_PRESETS[i].text)} />
        <textarea
          rows={4}
          placeholder="Wir bleiben dabei, bis es funktioniert..."
          value={s.guaranteeText ?? ''}
          onChange={(e) => patch('guaranteeText', e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300"
        />
      </Section>

      {/* Pricing */}
      <Section label="Preise · DIY · DWY · DFY" onSuggest={() => suggest('pricing')} suggesting={suggesting === 'pricing'}>
        <PricingEditor programs={s.programs} onChange={(arr) => patch('programs', arr)} />
      </Section>

      {/* Zahlung & Annahme */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Zahlung &amp; Annahme</h3>
        <p className="mt-1 mb-4 text-xs text-gray-500">Welche Zahlweisen der Kunde im Warenkorb wählen kann. Rechnung → E-Mail-Bestätigung (Domain-geprüft) + Nachweis; Kreditkarte → Stripe.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            <input type="checkbox" checked={s.paymentInvoiceEnabled ?? true} onChange={(e) => patch('paymentInvoiceEnabled', e.target.checked)} className="h-4 w-4" />
            Per Rechnung
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            <input type="checkbox" checked={s.paymentCardEnabled ?? false} onChange={(e) => patch('paymentCardEnabled', e.target.checked)} className="h-4 w-4" />
            Per Kreditkarte (Stripe)
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            <input type="checkbox" checked={s.rhythmMonthlyEnabled ?? true} onChange={(e) => patch('rhythmMonthlyEnabled', e.target.checked)} className="h-4 w-4" />
            Monatliche Zahlung
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
            <input type="checkbox" checked={s.rhythmUpfrontEnabled ?? true} onChange={(e) => patch('rhythmUpfrontEnabled', e.target.checked)} className="h-4 w-4" />
            Einmalzahlung (Upfront)
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-xs text-gray-500">Upfront-Rabatt (%)</label>
          <input type="number" min={0} max={100} value={s.upfrontDiscountPct ?? 0}
            onChange={(e) => patch('upfrontDiscountPct', Number(e.target.value))}
            className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300" />
          <span className="text-xs text-gray-400">Rabatt auf den Gesamtbetrag bei Einmalzahlung.</span>
        </div>
      </section>

      {/* Abschnitte D&D */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Abschnitte</h2>
            <p className="mt-1 text-xs text-gray-500">Drag &amp; Drop zum Sortieren · Augen-Icon zum Aus-/Einblenden</p>
          </div>
        </div>
        <SectionOrderEditor
          items={(s.sectionOrder && s.sectionOrder.length) ? s.sectionOrder : DEFAULT_SECTIONS}
          onChange={(next) => patch('sectionOrder', next)}
        />
      </section>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Sticky Topbar */}
      <div className="sticky top-0 z-30 -mx-6 -mt-6 mb-6 border-b border-gray-200 bg-white/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0"><h2 className="truncate text-xl font-bold text-gray-900">{s.title || 'Neues Angebot erstellen'}</h2>{offerNumber && <p className="truncate text-xs font-mono text-gray-400">{offerNumber}{accessSalt ? " · /offer/" + accessSalt.slice(0,8) + "…" : ""}</p>}</div>
            <select value={s.status} onChange={(e) => changeStatus(e.target.value)} disabled={pending}
              className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-700 outline-none focus:border-blue-300"
              title="Status ändern (z.B. Bestätigung zurücknehmen)">
              {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
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

function Field({ label, value, onChange, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</label>
      {multiline ? (
        <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
      ) : (
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
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


function PresetSelect({ label, options, onPick }: { label: string; options: string[]; onPick: (index: number) => void }) {
  return (
    <div className="mb-3">
      <select
        defaultValue=""
        onChange={(e) => { const i = Number(e.target.value); if (!Number.isNaN(i) && e.target.value !== '') { onPick(i); e.target.value = '' } }}
        className="w-full rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-3 py-2 text-xs text-blue-700 outline-none focus:border-blue-400"
      >
        <option value="">— {label} —</option>
        {options.map((o, i) => (<option key={i} value={i}>{o}</option>))}
      </select>
    </div>
  )
}


function TrackEditor({ phases, onChange }: { phases: TrackPhaseE[]; onChange: (p: TrackPhaseE[]) => void }) {
  const csv = (a?: string[]) => (a ?? []).join(', ')
  const toArr = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean)
  const updPhase = (i: number, patch: Partial<TrackPhaseE>) => onChange(phases.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  const updStep = (pi: number, si: number, patch: Partial<TrackStepE>) => onChange(phases.map((p, idx) => idx === pi ? { ...p, steps: (p.steps ?? []).map((st, j) => j === si ? { ...st, ...patch } : st) } : p))
  const addPhase = () => onChange([...phases, { name: 'Neue Phase', steps: [] }])
  const delPhase = (i: number) => onChange(phases.filter((_, idx) => idx !== i))
  const addStep = (pi: number) => onChange(phases.map((p, idx) => idx === pi ? { ...p, steps: [...(p.steps ?? []), { title: 'Neuer Baustein' }] } : p))
  const delStep = (pi: number, si: number) => onChange(phases.map((p, idx) => idx === pi ? { ...p, steps: (p.steps ?? []).filter((_, j) => j !== si) } : p))
  return (
    <div className="space-y-4">
      {phases.map((ph, pi) => (
        <div key={pi} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
          <div className="flex items-center gap-2">
            <input value={ph.name} onChange={(e) => updPhase(pi, { name: e.target.value })} placeholder="Phasen-Name" className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-blue-300" />
            <button type="button" onClick={() => delPhase(pi)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
          </div>
          <input value={ph.goal ?? ''} onChange={(e) => updPhase(pi, { goal: e.target.value })} placeholder="Ziel der Phase (optional)" className="mt-2 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300" />
          <div className="mt-3 space-y-2 border-l-2 border-blue-100 pl-3">
            {(ph.steps ?? []).map((st, si) => (
              <div key={si} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <input value={st.title} onChange={(e) => updStep(pi, si, { title: e.target.value })} placeholder="Baustein-Titel" className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-300" />
                  <input type="number" value={st.durationH ?? ''} onChange={(e) => updStep(pi, si, { durationH: e.target.value })} placeholder="Std." className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-300" />
                  <button type="button" onClick={() => delStep(pi, si)} className="text-gray-400 hover:text-red-500"><X size={13} /></button>
                </div>
                <textarea value={st.description ?? ''} onChange={(e) => updStep(pi, si, { description: e.target.value })} placeholder="Kurzbeschreibung" rows={2} className="mt-2 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300" />
                <input value={csv(st.teams)} onChange={(e) => updStep(pi, si, { teams: toArr(e.target.value) })} placeholder="Teams (Komma: GP Team, E+F Strategie)" className="mt-2 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300" />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input value={csv(st.inputs)} onChange={(e) => updStep(pi, si, { inputs: toArr(e.target.value) })} placeholder="Nötiger Input (Komma)" className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300" />
                  <input value={csv(st.outputs)} onChange={(e) => updStep(pi, si, { outputs: toArr(e.target.value) })} placeholder="Output (Komma)" className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-300" />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => addStep(pi)} className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-white"><Plus size={11} /> Baustein</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addPhase} className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90"><Plus size={12} /> Phase hinzufügen</button>
    </div>
  )
}
