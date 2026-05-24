'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { Save, CheckCircle2, AlertCircle, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { saveFrameworkMetaAction, suggestFrameworkMetaAction, type SaveFrameworkMetaState } from '@/lib/actions/framework-meta'
import type { Deliverable, CardMeta } from '@/lib/db/queries/framework-meta'

const ICON_OPTIONS: Deliverable['icon'][] = ['FileDown', 'Video', 'ClipboardList', 'Wand2', 'BookOpen', 'Sparkles']

interface Props {
  slug: string
  meta: CardMeta
  liveHref: string
}

interface FormState {
  posterTitle: string
  posterSubtitle: string
  agentLabel: string
  tagline: string
  toneFrom: string
  toneTo: string
  toneAccent: string
  deliverables: Deliverable[]
}

function metaToState(meta: CardMeta): FormState {
  const d = [...(meta.deliverables ?? [])]
  while (d.length < 5) d.push({ icon: 'FileDown', label: '' })
  return {
    posterTitle: meta.posterTitle ?? '',
    posterSubtitle: meta.posterSubtitle ?? '',
    agentLabel: meta.agentLabel ?? '',
    tagline: meta.tagline ?? '',
    toneFrom: meta.tone?.from ?? '#0F1E3A',
    toneTo: meta.tone?.to ?? '#1A5FD4',
    toneAccent: meta.tone?.accent ?? '#5DDBF5',
    deliverables: d.slice(0, 5),
  }
}

export function FrameworkMetaForm({ slug, meta, liveHref }: Props) {
  const [state, formAction, pending] = useActionState<SaveFrameworkMetaState, FormData>(
    saveFrameworkMetaAction,
    null,
  )
  const [f, setF] = useState<FormState>(() => metaToState(meta))

  // AI-Suggest state
  const [brief, setBrief] = useState('')
  const [aiPending, setAiPending] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Banner auto-fade after 4s
  const [bannerVisible, setBannerVisible] = useState(false)
  useEffect(() => {
    if (state) {
      setBannerVisible(true)
      const t = setTimeout(() => setBannerVisible(false), 4000)
      return () => clearTimeout(t)
    }
  }, [state])

  async function runSuggest() {
    if (!brief.trim()) return
    setAiPending(true); setAiError(null)
    try {
      const res = await suggestFrameworkMetaAction(brief, slug)
      if (!res.ok) { setAiError(res.error); return }
      const s = res.suggestion
      setF((prev) => ({
        ...prev,
        posterTitle: s.posterTitle ?? prev.posterTitle,
        posterSubtitle: s.posterSubtitle ?? prev.posterSubtitle,
        agentLabel: s.agentLabel ?? prev.agentLabel,
        tagline: s.tagline ?? prev.tagline,
        toneFrom: s.tone?.from ?? prev.toneFrom,
        toneTo: s.tone?.to ?? prev.toneTo,
        toneAccent: s.tone?.accent ?? prev.toneAccent,
        deliverables: s.deliverables && s.deliverables.length
          ? [...s.deliverables, ...Array(Math.max(0, 5 - s.deliverables.length)).fill({ icon: 'FileDown', label: '' })].slice(0, 5)
          : prev.deliverables,
      }))
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setAiPending(false)
    }
  }

  function setDeliverable(i: number, patch: Partial<Deliverable>) {
    setF((prev) => {
      const next = [...prev.deliverables]
      next[i] = { ...next[i], ...patch }
      return { ...prev, deliverables: next }
    })
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />

      {/* AI-Suggest Big Input */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/40 to-purple-50/30 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-blue-700">
            KI-Vorschlag
          </h2>
        </div>
        <p className="mb-3 text-xs text-blue-900/70">
          Beschreib locker, was das Framework macht und für wen — die KI generiert Titel, Subtitle, Tone-Palette und Deliverables in einem Rutsch. Du kannst danach alles editieren.
        </p>
        <textarea
          rows={5}
          placeholder="z.B. 'Beef Radar erkennt unausgesprochene Konflikte in Vorstandsgesprächen, bevor sie zum Eklat werden. Zielgruppe: C-Level, Founder. Liefert ein Worksheet mit 7 Signalen + ein 12-Min-Video.'"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-blue-400"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={runSuggest}
            disabled={aiPending || !brief.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {aiPending ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {aiPending ? 'Generiere…' : 'Vorschlag generieren'}
          </button>
          {aiError && (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-700">
              <AlertCircle size={12} /> {aiError}
            </span>
          )}
          <span className="ml-auto text-[10px] uppercase tracking-widest text-blue-400">
            Felder unten werden befüllt
          </span>
        </div>
      </section>

      {/* Poster section */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
          Poster auf der Card
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          Diese Texte erscheinen auf dem Cover-Bild — auf der Startseite, der /frameworks-Liste und der Detail-Seite.
        </p>

        <Field
          label="Poster-Titel (Bold UPPERCASE — Zeilenumbruch mit \n)"
          name="posterTitle"
          type="textarea"
          rows={2}
          value={f.posterTitle}
          onChange={(v) => setF((p) => ({ ...p, posterTitle: v }))}
          mono
        />
        <Field label="Poster-Subtitle (kleinere UPPERCASE-Zeile darunter)" name="posterSubtitle" value={f.posterSubtitle} onChange={(v) => setF((p) => ({ ...p, posterSubtitle: v }))} />
        <Field label="Agent-Label (Glass-Pill oben links auf der Card)" name="agentLabel" value={f.agentLabel} onChange={(v) => setF((p) => ({ ...p, agentLabel: v }))} />
        <Field label="Tagline (kleine Zeile unter dem Card-Body-Titel)" name="tagline" value={f.tagline} onChange={(v) => setF((p) => ({ ...p, tagline: v }))} />
      </section>

      {/* Tone palette */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
          Farben (Tone-Palette)
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          Verlauf auf der Card: tone.from → tone.to. Accent wird für die Sub-Zeile und das Eck-Glow genutzt.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <ColorField label="From" name="toneFrom" value={f.toneFrom} onChange={(v) => setF((p) => ({ ...p, toneFrom: v }))} />
          <ColorField label="To" name="toneTo" value={f.toneTo} onChange={(v) => setF((p) => ({ ...p, toneTo: v }))} />
          <ColorField label="Accent" name="toneAccent" value={f.toneAccent} onChange={(v) => setF((p) => ({ ...p, toneAccent: v }))} />
        </div>
      </section>

      {/* Deliverables */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
          Deliverables auf /frameworks
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          Bis zu 5 Bullet-Items mit Icon + Label. Werden auf der /frameworks-Listing-Card als „Was Du bekommst" angezeigt.
        </p>
        <div className="space-y-3">
          {f.deliverables.map((d, i) => (
            <div key={i} className="flex gap-2">
              <select
                name={`deliverable_${i}_icon`}
                value={d.icon}
                onChange={(e) => setDeliverable(i, { icon: e.target.value as Deliverable['icon'] })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                type="text"
                name={`deliverable_${i}_label`}
                value={d.label}
                onChange={(e) => setDeliverable(i, { label: e.target.value })}
                placeholder={`Deliverable ${i + 1} (leer = ausblenden)`}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur lg:static lg:bg-transparent lg:border-0 lg:shadow-none lg:p-0">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#1A5FD4' }}
        >
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Speichere…
            </>
          ) : (
            <>
              <Save size={14} /> Speichern
            </>
          )}
        </button>

        {state && bannerVisible && state.ok && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} /> Gespeichert
          </div>
        )}
        {state && bannerVisible && !state.ok && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200">
            <AlertCircle size={12} /> {state.error}
          </div>
        )}

        <Link
          href={liveHref}
          target="_blank"
          className="text-xs font-semibold text-gray-500 underline hover:text-gray-900 ml-auto"
        >
          Auf der Live-Seite ansehen ↗
        </Link>
      </div>
    </form>
  )
}

function Field({
  label, name, value, onChange, type = 'text', rows = 1, mono,
}: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'textarea'
  rows?: number
  mono?: boolean
}) {
  const cls = `mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 ${mono ? 'font-mono' : ''}`
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-700">{label}</label>
      {type === 'textarea' ? (
        <textarea name={name} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={cls} />
      ) : (
        <input type="text" name={name} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  )
}

function ColorField({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (v: string) => void }) {
  const normalized = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</label>
      <div className="flex gap-1.5 items-center">
        <div className="relative h-9 w-9 flex-shrink-0">
          <div
            className="h-9 w-9 rounded-lg border border-gray-200 shadow-sm"
            style={{ backgroundColor: normalized }}
            aria-hidden
          />
          <input
            type="color"
            value={normalized}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} Color-Picker`}
            title={`${label} ändern`}
          />
        </div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-mono"
          placeholder="#RRGGBB"
        />
      </div>
    </div>
  )
}
