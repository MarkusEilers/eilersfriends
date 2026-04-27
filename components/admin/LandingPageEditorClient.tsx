'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, GripVertical, Trash2, Eye, EyeOff,
  Save, ExternalLink, Loader2, Sparkles, MessageSquare, X,
  Globe, FileText, Archive,
} from 'lucide-react'
import {
  updateLandingPageMeta,
  upsertSection,
  deleteSection,
  reorderSections,
  toggleSectionVisibility,
  publishLandingPage,
} from '@/lib/actions/landing-pages'
import { LpRender, type SimpleSection } from '@/components/lp/LpRender'
import { AiChatPanel } from './AiChatPanel'

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

type EditorSection = {
  id: string
  type: string
  order: number
  isVisible: boolean
  content: Record<string, unknown>
  /** local marker — not yet saved to DB */
  dirty?: boolean
  /** local marker — JSON parse error */
  parseError?: string
}

const SECTION_TYPES = [
  { value: 'hero', label: '🚀 Hero' },
  { value: 'video', label: '🎥 Video' },
  { value: 'social_proof', label: '⭐ Social Proof' },
  { value: 'problem', label: '⚡ Problem' },
  { value: 'origin_story', label: '📖 Origin Story' },
  { value: 'solution', label: '✅ Lösung' },
  { value: 'features', label: '📋 Features' },
  { value: 'how_it_works', label: '🔢 So funktioniert es' },
  { value: 'curriculum', label: '📚 Curriculum' },
  { value: 'bonus_deliverables', label: '🎁 Bonus' },
  { value: 'fit_check', label: '✓✗ Fit Check' },
  { value: 'testimonials', label: '💬 Testimonials' },
  { value: 'tweet_wall', label: '🐦 Tweet-Wall' },
  { value: 'offer', label: '💎 Angebot' },
  { value: 'pricing_card', label: '💰 Pricing-Card' },
  { value: 'risk_reversal', label: '🛡️ Garantie' },
  { value: 'faq', label: '❓ FAQ' },
  { value: 'email_capture', label: '📧 Email-Capture' },
  { value: 'cta', label: '🎯 CTA' },
  { value: 'coach_bio', label: '👤 Coach-Bio' },
  { value: 'spacer', label: '⎯ Spacer' },
]

interface Props {
  page: LandingPage
  sections: EditorSection[]
}

export function LandingPageEditorClient({ page: initialPage, sections: initialSections }: Props) {
  const [page, setPage] = useState(initialPage)
  const [sections, setSections] = useState<EditorSection[]>(initialSections)
  const [selectedId, setSelectedId] = useState<string | null>(initialSections[0]?.id ?? null)
  const [showChat, setShowChat] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selected = sections.find((s) => s.id === selectedId)

  // ─── handlers ──────────────────────────────────────────────────────────
  function patchSection(id: string, patch: Partial<EditorSection>) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, dirty: true } : s)),
    )
  }

  function applyContentJson(id: string, jsonStr: string) {
    try {
      const parsed = JSON.parse(jsonStr)
      patchSection(id, { content: parsed, parseError: undefined })
    } catch (e) {
      // mark error but don't break preview
      setSections((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, parseError: (e as Error).message } : s,
        ),
      )
    }
  }

  async function saveSection(s: EditorSection) {
    startTransition(async () => {
      try {
        await upsertSection({
          id: s.id,
          landingPageId: page.id,
          type: s.type,
          order: s.order,
          isVisible: s.isVisible,
          content: s.content,
        })
        patchSection(s.id, { dirty: false })
      } catch (e) {
        console.error(e)
      }
    })
  }

  async function saveAll() {
    const dirty = sections.filter((s) => s.dirty)
    for (const s of dirty) await saveSection(s)
  }

  async function addSection(type: string) {
    const newId = crypto.randomUUID()
    const newOrder =
      sections.length > 0 ? Math.max(...sections.map((s) => s.order)) + 10 : 0
    const fresh: EditorSection = {
      id: newId,
      type,
      order: newOrder,
      isVisible: true,
      content: {},
      dirty: true,
    }
    setSections((prev) => [...prev, fresh])
    setSelectedId(newId)
  }

  async function removeSection(id: string) {
    if (!confirm('Sektion wirklich löschen?')) return
    setSections((prev) => prev.filter((s) => s.id !== id))
    if (selectedId === id) setSelectedId(null)
    startTransition(async () => {
      try { await deleteSection(id) } catch {}
    })
  }

  async function toggleVisibility(s: EditorSection) {
    patchSection(s.id, { isVisible: !s.isVisible })
    startTransition(async () => {
      try { await toggleSectionVisibility(s.id, !s.isVisible) } catch {}
    })
  }

  async function moveSection(id: string, direction: 'up' | 'down') {
    const idx = sections.findIndex((s) => s.id === id)
    if (idx < 0) return
    const swap = direction === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= sections.length) return
    const next = [...sections]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    // reassign orders 0,10,20…
    next.forEach((s, i) => (s.order = i * 10))
    setSections(next)
    startTransition(async () => {
      try {
        await reorderSections(next.map((s, i) => ({ id: s.id, order: i * 10 })))
      } catch {}
    })
  }

  // ─── AI integration ────────────────────────────────────────────────────
  function applyAiPatchToSelected(content: Record<string, unknown>) {
    if (!selected) return
    patchSection(selected.id, { content })
  }

  function replaceAllSections(newSections: { type: string; content: Record<string, unknown> }[]) {
    const built: EditorSection[] = newSections.map((s, i) => ({
      id: crypto.randomUUID(),
      type: s.type,
      order: i * 10,
      isVisible: true,
      content: s.content,
      dirty: true,
    }))
    setSections(built)
    setSelectedId(built[0]?.id ?? null)
  }

  const renderSections: SimpleSection[] = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        type: s.type,
        isVisible: s.isVisible,
        content: s.content,
      })),
    [sections],
  )

  const accent = page.accentColor ?? '#F05A1A'
  const dirtyCount = sections.filter((s) => s.dirty).length

  return (
    <div className="-m-6 -mt-0 lg:-m-8 lg:-mt-0 grid grid-cols-12 gap-0 min-h-[calc(100vh-3rem)]">

      {/* ─── LEFT: Section list + meta ─────────────────────────────────── */}
      <aside className="col-span-3 border-r border-gray-200 bg-white overflow-y-auto max-h-[calc(100vh-3rem)]">
        <div className="p-4 border-b border-gray-100">
          <Link
            href="/admin/landing-pages"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft size={12} /> Zurück
          </Link>
          <input
            type="text"
            value={page.title}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
            onBlur={() => updateLandingPageMeta({ id: page.id, title: page.title })}
            className="w-full text-base font-bold border-0 outline-none focus:ring-0"
            style={{ color: '#0D0D0B' }}
          />
          <input
            type="text"
            value={page.slug}
            onChange={(e) => setPage({ ...page, slug: e.target.value })}
            onBlur={() => updateLandingPageMeta({ id: page.id, slug: page.slug })}
            className="w-full text-xs text-gray-400 font-mono border-0 outline-none focus:ring-0 mt-1"
          />
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={page.accentColor ?? '#F05A1A'}
              onChange={(e) => setPage({ ...page, accentColor: e.target.value })}
              onBlur={() =>
                updateLandingPageMeta({ id: page.id, accentColor: page.accentColor ?? undefined })
              }
              className="h-7 w-10 rounded cursor-pointer border border-gray-200"
            />
            <select
              value={page.status}
              onChange={(e) => {
                const v = e.target.value as 'draft' | 'published' | 'archived'
                setPage({ ...page, status: v })
                publishLandingPage(page.id, v)
              }}
              className="flex-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {page.status === 'published' && (
            <a
              href={`/lp/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink size={11} /> /lp/{page.slug}
            </a>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Sektionen ({sections.length})
            </h3>
          </div>
          <ul className="space-y-1">
            {sections.map((s, i) => {
              const isSel = s.id === selectedId
              const meta = SECTION_TYPES.find((t) => t.value === s.type)
              return (
                <li key={s.id}>
                  <div
                    className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                      isSel ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <span className="text-xs text-gray-400 font-mono w-6">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`flex-1 text-sm truncate ${s.isVisible ? '' : 'opacity-50 line-through'}`}>
                      {meta?.label ?? s.type}
                    </span>
                    {s.dirty && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" title="Ungespeicherte Änderungen" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(s) }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-700"
                      title={s.isVisible ? 'Ausblenden' : 'Einblenden'}
                    >
                      {s.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(s.id, 'up') }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-700"
                      disabled={i === 0}
                    >▲</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(s.id, 'down') }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-700"
                      disabled={i === sections.length - 1}
                    >▼</button>
                  </div>
                </li>
              )
            })}
          </ul>

          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
              <Plus size={12} /> Sektion hinzufügen
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {SECTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => addSection(t.value)}
                  className="text-left text-xs rounded-md border border-gray-200 bg-white px-2 py-1.5 hover:bg-gray-50"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </details>
        </div>
      </aside>

      {/* ─── MIDDLE: Field editor for selected section ─────────────────── */}
      <section className="col-span-4 border-r border-gray-200 bg-gray-50 overflow-y-auto max-h-[calc(100vh-3rem)]">
        <div className="p-5">
          {!selected ? (
            <div className="text-center text-sm text-gray-500 py-20">
              <p>Wähle eine Sektion links aus.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <select
                  value={selected.type}
                  onChange={(e) => patchSection(selected.id, { type: e.target.value })}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs"
                >
                  {SECTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => removeSection(selected.id)}
                    className="rounded-full p-1.5 text-red-600 hover:bg-red-50"
                    title="Löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => saveSection(selected)}
                    disabled={!selected.dirty || isPending}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-40"
                    style={{ backgroundColor: accent }}
                  >
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Speichern
                  </button>
                </div>
              </div>

              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">
                Inhalt (JSON)
              </label>
              <textarea
                value={JSON.stringify(selected.content, null, 2)}
                onChange={(e) => applyContentJson(selected.id, e.target.value)}
                rows={28}
                spellCheck={false}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-mono outline-none focus:ring-1 ${
                  selected.parseError
                    ? 'border-red-300 focus:ring-red-300'
                    : 'border-gray-200 focus:ring-orange-300'
                }`}
              />
              {selected.parseError && (
                <p className="mt-2 text-xs text-red-600">JSON-Fehler: {selected.parseError}</p>
              )}
              <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                Tipp: Nutze den AI-Chat unten rechts für Vorschläge — markiere diese Sektion und sag z.B.
                „Schreibe 6 Tweet-Wall-Items im Welsh-Stil zum Thema X".
              </p>
            </>
          )}
        </div>
      </section>

      {/* ─── RIGHT: Live Preview ───────────────────────────────────────── */}
      <section className="col-span-5 bg-white overflow-y-auto max-h-[calc(100vh-3rem)] border-l border-gray-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur px-4 py-2 text-xs">
          <span className="font-semibold text-gray-500">LIVE PREVIEW</span>
          <div className="flex items-center gap-2">
            {dirtyCount > 0 && (
              <button
                onClick={saveAll}
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: accent }}
              >
                {dirtyCount} ungespeichert · Alle speichern
              </button>
            )}
          </div>
        </div>
        <div className="origin-top">
          <LpRender sections={renderSections} accent={accent} emailList={page.emailList ?? 'general'} />
        </div>
      </section>

      {/* ─── AI Chat (floating panel) ─────────────────────────────────── */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-xl hover:opacity-90"
        style={{ backgroundColor: accent }}
      >
        <Sparkles size={16} /> AI-Assistent
      </button>

      {showChat && (
        <AiChatPanel
          accent={accent}
          page={page}
          sections={sections.map(s => ({ id: s.id, type: s.type, content: s.content }))}
          selectedSectionId={selectedId}
          onApplySection={applyAiPatchToSelected}
          onReplaceAll={replaceAllSections}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  )
}
