'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { saveFrameworkMetaAction, type SaveFrameworkMetaState } from '@/lib/actions/framework-meta'
import type { Deliverable, CardMeta } from '@/lib/db/queries/framework-meta'

const ICON_OPTIONS: Deliverable['icon'][] = ['FileDown', 'Video', 'ClipboardList', 'Wand2', 'BookOpen', 'Sparkles']

interface Props {
  slug: string
  meta: CardMeta
  liveHref: string
}

export function FrameworkMetaForm({ slug, meta, liveHref }: Props) {
  const [state, formAction, pending] = useActionState<SaveFrameworkMetaState, FormData>(
    saveFrameworkMetaAction,
    null,
  )

  // Pad deliverables to 5 for the form
  const deliverables: Deliverable[] = [...(meta.deliverables ?? [])]
  while (deliverables.length < 5) deliverables.push({ icon: 'FileDown', label: '' })

  // Banner auto-fade after 4s
  const [bannerVisible, setBannerVisible] = useState(false)
  useEffect(() => {
    if (state) {
      setBannerVisible(true)
      const t = setTimeout(() => setBannerVisible(false), 4000)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />

      {/* Poster section */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
          Poster auf der Card
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          Diese Texte erscheinen auf dem Cover-Bild — auf der Startseite, der /frameworks-Liste und der Detail-Seite.
        </p>

        <Field label="Poster-Titel (Bold UPPERCASE — Zeilenumbruch mit \n)" name="posterTitle" type="textarea" rows={2} defaultValue={meta.posterTitle ?? ''} mono />
        <Field label="Poster-Subtitle (kleinere UPPERCASE-Zeile darunter)" name="posterSubtitle" defaultValue={meta.posterSubtitle ?? ''} />
        <Field label="Agent-Label (Glass-Pill oben links auf der Card)" name="agentLabel" defaultValue={meta.agentLabel ?? ''} />
        <Field label="Tagline (kleine Zeile unter dem Card-Body-Titel)" name="tagline" defaultValue={meta.tagline ?? ''} />
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
          <ColorField label="From" name="toneFrom" defaultValue={meta.tone?.from ?? '#0F1E3A'} />
          <ColorField label="To" name="toneTo" defaultValue={meta.tone?.to ?? '#1A5FD4'} />
          <ColorField label="Accent" name="toneAccent" defaultValue={meta.tone?.accent ?? '#5DDBF5'} />
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
          {deliverables.map((d, i) => (
            <div key={i} className="flex gap-2">
              <select
                name={`deliverable_${i}_icon`}
                defaultValue={d.icon}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                type="text"
                name={`deliverable_${i}_label`}
                defaultValue={d.label}
                placeholder={`Deliverable ${i + 1} (leer = ausblenden)`}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Save bar — sticky on mobile, inline on desktop */}
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

        {/* Live banner */}
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
  label, name, defaultValue, type = 'text', rows = 1, mono,
}: {
  label: string
  name: string
  defaultValue: string
  type?: 'text' | 'textarea'
  rows?: number
  mono?: boolean
}) {
  const cls = `mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 ${mono ? 'font-mono' : ''}`
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-700">{label}</label>
      {type === 'textarea' ? (
        <textarea name={name} defaultValue={defaultValue} rows={rows} className={cls} />
      ) : (
        <input type="text" name={name} defaultValue={defaultValue} className={cls} />
      )}
    </div>
  )
}

function ColorField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  // Controlled — Picker und Hex schreiben in den gleichen State,
  // damit Drehen am Picker auch das submittete Text-Feld aktualisiert.
  const [value, setValue] = useState(defaultValue)
  const normalized = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</label>
      <div className="flex gap-1.5 items-center">
        <input
          type="color"
          value={normalized}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          className="h-9 w-9 rounded border border-gray-200 cursor-pointer"
          aria-label={`${label} Color-Picker`}
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-mono"
          placeholder="#RRGGBB"
        />
      </div>
    </div>
  )
}
