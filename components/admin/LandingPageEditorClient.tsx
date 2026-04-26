'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Eye, Plus, GripVertical, Trash2, ChevronDown, ChevronUp,
  Save, Globe, FileText, Archive, Loader2, ExternalLink,
} from 'lucide-react'
import {
  updateLandingPageMeta,
  upsertSection,
  deleteSection,
  reorderSections,
  toggleSectionVisibility,
  publishLandingPage,
} from '@/lib/actions/landing-pages'

type LandingPage = {
  id: string
  slug: string
  title: string
  metaDescription: string | null
  status: 'draft' | 'published' | 'archived'
  emailList: string | null
  accentColor: string | null
  locale: string
}

type Section = {
  id: string
  type: string
  order: number
  isVisible: boolean
  content: Record<string, unknown>
}

const SECTION_TYPES = [
  { value: 'hero', label: '🚀 Hero', desc: 'Headline + Subtext + CTA oder Email-Form' },
  { value: 'video', label: '🎥 Video', desc: 'VSL oder Erklär-Video (YouTube/Vimeo)' },
  { value: 'social_proof', label: '⭐ Social Proof', desc: 'Logos, Zahlen, Medien-Erwähnungen' },
  { value: 'problem', label: '⚡ Problem', desc: 'Schmerz-Punkte und Herausforderungen' },
  { value: 'solution', label: '✅ Lösung', desc: 'Was du bekommst / Transformations-Versprechen' },
  { value: 'features', label: '📋 Features', desc: 'Bullet-Liste mit Icons und Texten' },
  { value: 'how_it_works', label: '🔢 So funktioniert es', desc: 'Schritt-für-Schritt Prozess' },
  { value: 'testimonials', label: '💬 Testimonials', desc: 'Kunden-Stimmen mit Name und Bild' },
  { value: 'offer', label: '💎 Angebot', desc: 'Was ist enthalten + Preis + CTA' },
  { value: 'faq', label: '❓ FAQ', desc: 'Häufige Fragen und Antworten' },
  { value: 'email_capture', label: '📧 Email-Formular', desc: 'Standalone Lead-Magnet / Opt-In' },
  { value: 'cta', label: '🎯 Call to Action', desc: 'Finaler Aufruf zum Handeln' },
  { value: 'coach_bio', label: '👤 Coach-Vorstellung', desc: 'Markus oder Aljona Profil' },
]

interface LandingPageEditorClientProps {
  page: LandingPage
  sections: Section[]
}

export function LandingPageEditorClient({ page: initialPage, sections: initialSections }: LandingPageEditorClientProps) {
  const [page, setPage] = useState(initialPage)
  const [sections, setSections] = useState(initialSections)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  // ── Meta speichern ────────────────────────────────────────────────────────
  function saveMeta() {
    startTransition(async () => {
      await updateLandingPageMeta({
        id: page.id,
        title: page.title,
        slug: page.slug,
        metaDescription: page.metaDescription ?? '',
        emailList: page.emailList ?? '',
        accentColor: page.accentColor ?? '',
        locale: page.locale,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  // ── Sektion hinzufügen ────────────────────────────────────────────────────
  function addSection(type: string) {
    startTransition(async () => {
      const newSection = await upsertSection({
        landingPageId: page.id,
        type,
        order: sections.length,
        isVisible: true,
        content: getDefaultContent(type),
      })
      setSections((s) => [...s, newSection])
      setShowAddSection(false)
      setEditingSection(newSection.id)
    })
  }

  // ── Sektion speichern ─────────────────────────────────────────────────────
  function saveSection(id: string, content: Record<string, unknown>) {
    startTransition(async () => {
      const section = sections.find((s) => s.id === id)
      if (!section) return
      await upsertSection({ ...section, content, landingPageId: page.id })
      setSections((s) => s.map((sec) => sec.id === id ? { ...sec, content } : sec))
      setEditingSection(null)
    })
  }

  // ── Sektion löschen ───────────────────────────────────────────────────────
  function removeSection(id: string) {
    if (!confirm('Sektion löschen?')) return
    startTransition(async () => {
      await deleteSection(id)
      setSections((s) => s.filter((sec) => sec.id !== id))
    })
  }

  // ── Sichtbarkeit toggle ───────────────────────────────────────────────────
  function toggleVisibility(id: string) {
    startTransition(async () => {
      const section = sections.find((s) => s.id === id)
      if (!section) return
      await toggleSectionVisibility(id, !section.isVisible)
      setSections((s) => s.map((sec) => sec.id === id ? { ...sec, isVisible: !sec.isVisible } : sec))
    })
  }

  // ── Reihenfolge ───────────────────────────────────────────────────────────
  function moveSection(id: string, dir: 'up' | 'down') {
    const idx = sections.findIndex((s) => s.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === sections.length - 1) return
    const newSections = [...sections]
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    ;[newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]]
    const reordered = newSections.map((s, i) => ({ ...s, order: i }))
    setSections(reordered)
    startTransition(async () => {
      await reorderSections(reordered.map((s) => ({ id: s.id, order: s.order })))
    })
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  function handlePublish() {
    startTransition(async () => {
      const newStatus = page.status === 'published' ? 'draft' : 'published'
      await publishLandingPage(page.id, newStatus)
      setPage((p) => ({ ...p, status: newStatus }))
    })
  }

  return (
    <div>
      {/* Topbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/landing-pages" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft size={14} /> Zurück
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">{page.title}</span>
          <StatusBadge status={page.status} />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/lp/${page.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:border-gray-400"
          >
            <ExternalLink size={12} /> Vorschau
          </a>
          <button
            onClick={handlePublish}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: page.status === 'published' ? '#f9fafb' : '#F05A1A',
              color: page.status === 'published' ? '#374151' : '#fff',
              borderColor: page.status === 'published' ? '#e5e7eb' : '#F05A1A',
            }}
          >
            {page.status === 'published' ? (
              <><FileText size={12} /> Zurück zu Entwurf</>
            ) : (
              <><Globe size={12} /> Veröffentlichen</>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ── Linke Spalte: Meta-Daten ─────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-gray-900">Seiten-Einstellungen</p>

            <div className="space-y-4">
              <Field label="Titel" value={page.title} onChange={(v) => setPage((p) => ({ ...p, title: v }))} />
              <Field label="Slug (URL)" value={page.slug} onChange={(v) => setPage((p) => ({ ...p, slug: v }))}
                prefix="/lp/" mono />
              <Field label="Meta-Beschreibung" value={page.metaDescription ?? ''} textarea
                onChange={(v) => setPage((p) => ({ ...p, metaDescription: v }))} />
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Sprache</label>
                <select
                  value={page.locale}
                  onChange={(e) => setPage((p) => ({ ...p, locale: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">Englisch</option>
                  <option value="ru">Russisch</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-gray-900">Email & Sequenz</p>
            <div className="space-y-4">
              <Field
                label="Email-Liste"
                value={page.emailList ?? ''}
                placeholder="z.B. salesmade, liquid-leadership"
                onChange={(v) => setPage((p) => ({ ...p, emailList: v }))}
              />
              <Field
                label="Akzentfarbe"
                value={page.accentColor ?? '#F05A1A'}
                placeholder="#F05A1A"
                onChange={(v) => setPage((p) => ({ ...p, accentColor: v }))}
              />
            </div>
          </div>

          <button
            onClick={saveMeta}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            style={{ backgroundColor: '#0A0D14' }}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? 'Gespeichert ✓' : 'Einstellungen speichern'}
          </button>
        </div>

        {/* ── Rechte Spalte: Sektionen ──────────────────────────────────────── */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Sektionen ({sections.length})</p>
            <button
              onClick={() => setShowAddSection(true)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: '#F05A1A' }}
            >
              <Plus size={14} /> Sektion hinzufügen
            </button>
          </div>

          {/* Sektionen-Liste */}
          <div className="space-y-3">
            {sections.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
                <p className="text-sm text-gray-400">Noch keine Sektionen. Füge deine erste hinzu!</p>
              </div>
            )}

            {sections.map((section, idx) => (
              <SectionCard
                key={section.id}
                section={section}
                idx={idx}
                total={sections.length}
                isEditing={editingSection === section.id}
                onEdit={() => setEditingSection(editingSection === section.id ? null : section.id)}
                onSave={(content) => saveSection(section.id, content)}
                onDelete={() => removeSection(section.id)}
                onMoveUp={() => moveSection(section.id, 'up')}
                onMoveDown={() => moveSection(section.id, 'down')}
                onToggleVisibility={() => toggleVisibility(section.id)}
              />
            ))}
          </div>

          {/* Sektion hinzufügen Modal */}
          {showAddSection && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddSection(false)} />
              <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Sektion hinzufügen</h3>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                  {SECTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => addSection(type.value)}
                      disabled={isPending}
                      className="rounded-xl border border-gray-200 p-3 text-left hover:border-orange-300 hover:bg-orange-50 transition-colors disabled:opacity-50"
                    >
                      <p className="text-sm font-semibold text-gray-900">{type.label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{type.desc}</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowAddSection(false)} className="mt-4 w-full rounded-full border border-gray-200 py-2 text-sm text-gray-600 hover:border-gray-400">
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Hilfs-Komponenten ─────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, prefix, mono, textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  prefix?: string
  mono?: boolean
  textarea?: boolean
}) {
  const cls = `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none ${mono ? 'font-mono' : ''}`
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</label>
      {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} placeholder={placeholder} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-green-50 text-green-700',
    draft: 'bg-orange-50 text-orange-700',
    archived: 'bg-gray-100 text-gray-600',
  }
  const labels: Record<string, string> = { published: 'Live', draft: 'Entwurf', archived: 'Archiviert' }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}

function SectionCard({
  section, idx, total, isEditing, onEdit, onSave, onDelete, onMoveUp, onMoveDown, onToggleVisibility,
}: {
  section: Section
  idx: number
  total: number
  isEditing: boolean
  onEdit: () => void
  onSave: (content: Record<string, unknown>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleVisibility: () => void
}) {
  const typeInfo = SECTION_TYPES.find((t) => t.value === section.type)
  const [localContent, setLocalContent] = useState(section.content)

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all ${section.isVisible ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-60'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={16} className="text-gray-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{typeInfo?.label ?? section.type}</p>
          <p className="text-xs text-gray-400">{typeInfo?.desc}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onMoveUp} disabled={idx === 0} className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-30">
            <ChevronUp size={14} />
          </button>
          <button onClick={onMoveDown} disabled={idx === total - 1} className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-30">
            <ChevronDown size={14} />
          </button>
          <button onClick={onToggleVisibility} className="p-1.5 text-gray-400 hover:text-gray-900">
            <Eye size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-red-300 hover:text-red-600">
            <Trash2 size={14} />
          </button>
          <button
            onClick={onEdit}
            className="ml-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-gray-400"
          >
            {isEditing ? 'Schließen' : 'Bearbeiten'}
          </button>
        </div>
      </div>

      {/* Inline-Editor */}
      {isEditing && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-4">
          <SectionContentEditor
            type={section.type}
            content={localContent}
            onChange={setLocalContent}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => onSave(localContent)}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: '#F05A1A' }}
            >
              Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sektion-Content-Editor (typ-abhängig) ─────────────────────────────────────
function SectionContentEditor({
  type, content, onChange,
}: {
  type: string
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  function set(key: string, value: unknown) {
    onChange({ ...content, [key]: value })
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none'
  const labelCls = 'mb-1.5 block text-xs font-semibold text-gray-700'

  switch (type) {
    case 'hero':
      return (
        <div className="space-y-4">
          <div><label className={labelCls}>Headline</label><input className={inputCls} value={(content.headline as string) ?? ''} onChange={(e) => set('headline', e.target.value)} placeholder="Dein Winning Team für planbares Wachstum" /></div>
          <div><label className={labelCls}>Subheadline</label><textarea className={inputCls} rows={2} value={(content.subheadline as string) ?? ''} onChange={(e) => set('subheadline', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>CTA-Text</label><input className={inputCls} value={(content.ctaLabel as string) ?? ''} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="Jetzt anmelden" /></div>
            <div><label className={labelCls}>CTA-Link</label><input className={inputCls} value={(content.ctaHref as string) ?? ''} onChange={(e) => set('ctaHref', e.target.value)} placeholder="#email-form" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={!!(content.showEmailForm)} onChange={(e) => set('showEmailForm', e.target.checked)} />
            Email-Formular direkt im Hero anzeigen
          </label>
        </div>
      )

    case 'video':
      return (
        <div className="space-y-4">
          <div><label className={labelCls}>Video-URL (YouTube/Vimeo Embed)</label><input className={inputCls} value={(content.embedUrl as string) ?? ''} onChange={(e) => set('embedUrl', e.target.value)} placeholder="https://www.youtube.com/embed/..." /></div>
          <div><label className={labelCls}>Headline über Video (optional)</label><input className={inputCls} value={(content.headline as string) ?? ''} onChange={(e) => set('headline', e.target.value)} /></div>
        </div>
      )

    case 'email_capture':
      return (
        <div className="space-y-4">
          <div><label className={labelCls}>Headline</label><input className={inputCls} value={(content.headline as string) ?? ''} onChange={(e) => set('headline', e.target.value)} placeholder="Sichere dir deinen Platz" /></div>
          <div><label className={labelCls}>Subtext</label><textarea className={inputCls} rows={2} value={(content.subtext as string) ?? ''} onChange={(e) => set('subtext', e.target.value)} /></div>
          <div><label className={labelCls}>Button-Text</label><input className={inputCls} value={(content.buttonLabel as string) ?? ''} onChange={(e) => set('buttonLabel', e.target.value)} placeholder="Kostenlos anmelden ih�" /></div>
          <div><label className={labelCls}>Datenschutz-Hinweis</label><input className={inputCls} value={(content.privacyNote as string) ?? ''} onChange={(e) => set('privacyNote', e.target.value)} placeholder="Kein Spam. Jederzeit abmeldbar." /></div>
        </div>
      )

    case 'testimonials': {
      const items = (content.items as Array<{ name: string; role: string; text: string }>) ?? []
      return (
        <div className="space-y-4">
          <div><label className={labelCls}>Überschrift</label><input className={inputCls} value={(content.headline as string) ?? ''} onChange={(e) => set('headline', e.target.value)} /></div>
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Name</label><input className={inputCls} value={item.name} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], name: e.target.value }; set('items', n) }} /></div>
                <div><label className={labelCls}>Rolle / Firma</label><input className={inputCls} value={item.role} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], role: e.target.value }; set('items', n) }} /></div>
              </div>
              <div><label className={labelCls}>Aussage</label><textarea className={inputCls} rows={2} value={item.text} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], text: e.target.value }; set('items', n) }} /></div>
              <button onClick={() => { const n = items.filter((_, j) => j !== i); set('items', n) }} className="text-xs text-red-500 hover:text-red-700">Entfernen</button>
            </div>
          ))}
          <button onClick={() => set('items', [...items, { name: '', role: '', text: '' }])} className="text-xs font-semibold text-orange-600 hover:text-orange-800">+ Testimonial hinzufügen</button>
        </div>
      )
    }

    case 'faq': {
      const items = (content.items as Array<{ question: string; answer: string }>) ?? []
      return (
        <div className="space-y-4">
          <div><label className={labelCls}>Überschrift</label><input className={inputCls} value={(content.headline as string) ?? ''} onChange={(e) => set('headline', e.target.value)} /></div>
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-2">
              <div><label className={labelCls}>Frage</label><input className={inputCls} value={item.question} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], question: e.target.value }; set('items', n) }} /></div>
              <div><label className={labelCls}>Antwort</label><textarea className={inputCls} rows={3} value={item.answer} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], answer: e.target.value }; set('items', n) }} /></div>
              <button onClick={() => { const n = items.filter((_, j) => j !== i); set('items', n) }} className="text-xs text-red-500">Entfernen</button>
            </div>
          ))}
          <button onClick={() => set('items', [...items, { question: '', answer: '' }])} className="text-xs font-semibold text-orange-600 hover:text-orange-800">+ Frage hinzufügen</button>
        </div>
      )
    }

    default:
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Überschrift</label><input className={inputCls} value={(content.headline as string) ?? ''} onChange={(e) => set('headline', e.target.value)} /></div>
          <div><label className={labelCls}>Text / Inhalt</label><textarea className={inputCls} rows={4} value={(content.body as string) ?? ''} onChange={(e) => set('body', e.target.value)} /></div>
        </div>
      )
  }
}

// ── Default-Inhalte für neue Sektionen ────────────────────────────────────────
function getDefaultContent(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    hero: { headline: '', subheadline: '', ctaLabel: 'Jetzt starten →', ctaHref: '#', showEmailForm: true },
    video: { embedUrl: '', headline: '' },
    social_proof: { headline: 'Wie bekannt aus', logos: [] },
    problem: { headline: 'Erkennst du dich wieder?', items: [] },
    solution: { headline: 'Die Lösung', body: '' },
    features: { headline: 'Was du bekommst', items: [] },
    how_it_works: { headline: 'So funktioniert es', steps: [] },
    testimonials: { headline: 'Was unsere Klienten sagen', items: [] },
    offer: { headline: 'Was ist enthalten', price: '', ctaLabel: 'Jetzt buchen', items: [] },
    faq: { headline: 'Häufige Fragen', items: [] },
    email_capture: { headline: 'Sichere dir deinen Platz', subtext: '', buttonLabel: 'Kostenlos anmelden →', privacyNote: 'Kein Spam. Jederzeit abmeldbar.' },
    cta: { headline: 'Bereit für den nächsten Schritt?', ctaLabel: 'Jetzt starten', ctaHref: '#' },
    coach_bio: { coach: 'markus' },
  }
  return defaults[type] ?? { headline: '', body: '' }
}
