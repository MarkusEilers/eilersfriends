'use client'

import { useState } from 'react'
import { GripVertical, Trash2, Pencil, Plus, History } from 'lucide-react'

/**
 * Modulübersicht für Landing- und Checkout-Seiten: nummerierte Karten mit
 * Mini-Skizze, Häkchen = sichtbar, per Drag & Drop sortieren, Module aus der
 * Palette an beliebiger Stelle einfügen, löschen, zum Bearbeiten öffnen.
 * Neue Module starten mit der zuletzt gespeicherten Fassung ihres Typs.
 */

export interface BoardSection { id: string; type: string; isVisible: boolean; content: Record<string, unknown>; dirty?: boolean }
export interface BoardType { value: string; label: string }
export interface LibraryInfo { type: string; content: Record<string, unknown>; page_slug: string | null; updated_at: string }

const W = {
  bar: (w: string, c = '#DADDE3', h = 5) => <i style={{ display: 'block', width: w, height: h, borderRadius: 3, background: c, marginBottom: 4 }} />,
}
const BL = '#1A5FD4', INK = '#0D0D0B', IMG = '#D9D7D4', PN = '#F2F2F0', TINT = '#EBF1FF', NAVY = '#0E1733', RED = '#EB0028'

/** Kleine Skizze je Modultyp (wie in der Abhak-Liste). */
function Sketch({ type }: { type: string }) {
  const box = (children: React.ReactNode, bg = '#fff') => (
    <div style={{ height: 64, width: 96, flex: 'none', borderRadius: 8, border: '1px solid #E5E7EB', background: bg, padding: 6, overflow: 'hidden' }}>{children}</div>
  )
  const row = (...c: React.ReactNode[]) => <div style={{ display: 'flex', gap: 4 }}>{c.map((x, i) => <div key={i} style={{ flex: 1 }}>{x}</div>)}</div>
  const blk = (bg: string, h: number, r = 4) => <div style={{ background: bg, height: h, borderRadius: r }} />
  switch (type) {
    case 'story_topnav': case 'cta': return box(<>{W.bar('100%', BL, 6)}<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>{W.bar('30%')}{W.bar('28%', BL, 8)}</div></>)
    case 'story_hero_optin': case 'hero': return box(row(<>{W.bar('60%')}{W.bar('90%', INK, 7)}{W.bar('70%', INK, 7)}{blk(NAVY, 16)}</>, blk(IMG, 50)))
    case 'story_logos': case 'social_proof': return box(<><div style={{ textAlign: 'center' }}>{W.bar('50%')}</div><div style={{ display: 'flex', gap: 4, marginTop: 14 }}>{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ flex: 1, height: 6, background: '#C9CDD4', borderRadius: 2 }} />)}</div></>)
    case 'story_findings': case 'problem': return box(row(blk(INK, 50, 5), <>{[0, 1, 2, 3].map((i) => <div key={i} style={{ display: 'flex', gap: 3, marginBottom: 5 }}><i style={{ width: 7, height: 7, borderRadius: 9, background: RED }} />{W.bar('70%')}</div>)}</>))
    case 'story_tiles': case 'features': case 'solution': case 'how_it_works': case 'framework_steps': return box(<>{W.bar('50%', INK)}{row(blk(TINT, 38), blk(TINT, 38), blk(TINT, 38))}</>)
    case 'story_quote_author': case 'testimonials': case 'tweet_wall': return box(row(<div style={{ background: BL, borderRadius: 5, height: 50, padding: 5 }}>{W.bar('90%', '#fff', 5)}{W.bar('70%', '#fff', 5)}</div>, <div style={{ background: PN, borderRadius: 5, height: 50, padding: 5 }}><i style={{ display: 'block', width: 12, height: 12, borderRadius: 9, background: IMG, marginBottom: 4 }} />{W.bar('80%')}</div>))
    case 'story_optin_close': case 'email_capture': case 'lead_magnet': return box(row(<>{W.bar('60%', '#6FA3FF')}{W.bar('90%', '#fff', 6)}</>, <>{W.bar('100%', '#22305A', 8)}{W.bar('100%', '#2563FF', 8)}</>), NAVY)
    case 'story_checkout_vsl': case 'video': case 'pricing_card': return box(row(<div style={{ flex: 2 }}>{blk(IMG, 34)}<div style={{ display: 'flex', gap: 2, marginTop: 4 }}>{[0, 1, 2, 3].map((i) => <i key={i} style={{ flex: 1, height: 3, background: i < 2 ? BL : '#DADDE3' }} />)}</div></div>, <div style={{ border: '1px solid #E5E7EB', borderRadius: 4, padding: 3, height: 50 }}>{W.bar('60%', INK)}{W.bar('100%')}{W.bar('100%')}{W.bar('100%', BL, 7)}</div>))
    case 'story_bento_offer': case 'offer': case 'bonus_deliverables': case 'curriculum': return box(<>{row(blk(PN, 24), <div style={{ flex: 2 }}>{blk(PN, 24)}</div>)}<div style={{ height: 4 }} />{row(blk(PN, 22), blk(TINT, 22), blk(BL, 22))}</>)
    case 'story_dark_band': case 'risk_reversal': return box(<div style={{ background: INK, borderRadius: 5, height: 40, marginTop: 6, padding: 7, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ width: '55%' }}>{W.bar('40%', '#8FB4FF')}{W.bar('100%', '#fff', 6)}</div><i style={{ width: '28%', height: 9, borderRadius: 5, background: BL }} /></div>)
    case 'story_faq': case 'faq': case 'fit_check': return box(row(<>{W.bar('80%', INK, 7)}</>, <>{[0, 1, 2].map((i) => <div key={i} style={{ background: PN, height: 10, borderRadius: 3, marginBottom: 3 }} />)}</>))
    case 'story_mobile_cta': return box(<div style={{ marginTop: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: 5 }}>{W.bar('45%')}<i style={{ width: '30%', height: 8, borderRadius: 5, background: BL }} /></div>)
    case 'coach_bio': case 'origin_story': return box(<div style={{ background: PN, borderRadius: 5, height: 50, padding: 5, display: 'flex', gap: 5 }}><i style={{ width: 22, height: 36, borderRadius: 4, background: IMG }} /><div style={{ flex: 1 }}>{W.bar('50%', INK)}{W.bar('100%')}{W.bar('80%')}</div></div>)
    default: return box(<>{W.bar('60%', INK)}{W.bar('100%')}{W.bar('90%')}{W.bar('70%')}</>)
  }
}

function titleOf(c: Record<string, unknown>) {
  const t = c.headline ?? c.title ?? c.eyebrow ?? c.quote ?? c.text ?? c.product
  return typeof t === 'string' ? t.replace(/<[^>]+>/g, '') : ''
}

export function ModuleBoard({ sections, types, library, onReorder, onToggle, onDelete, onSelect, onInsert }: {
  sections: BoardSection[]
  types: BoardType[]
  library: LibraryInfo[]
  onReorder: (ids: string[]) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  onInsert: (type: string, index: number) => void
}) {
  const [drag, setDrag] = useState<{ kind: 'card'; id: string } | { kind: 'new'; type: string } | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const [filter, setFilter] = useState<'story' | 'all'>('story')
  const lib = new Map(library.map((l) => [l.type, l]))
  const palette = types.filter((t) => filter === 'all' || t.value.startsWith('story_'))

  function drop(index: number) {
    if (!drag) return
    if (drag.kind === 'new') onInsert(drag.type, index)
    else {
      const ids = sections.map((s) => s.id)
      const from = ids.indexOf(drag.id)
      if (from < 0) return
      ids.splice(from, 1)
      ids.splice(from < index ? index - 1 : index, 0, drag.id)
      onReorder(ids)
    }
    setDrag(null); setOver(null)
  }

  const gap = (i: number) => (
    <div key={`gap-${i}`}
      onDragOver={(e) => { e.preventDefault(); setOver(i) }}
      onDragLeave={() => setOver((o) => (o === i ? null : o))}
      onDrop={(e) => { e.preventDefault(); drop(i) }}
      className="transition-all"
      style={{ height: over === i ? 44 : drag ? 14 : 6, borderRadius: 10, border: over === i ? '2px dashed #1A5FD4' : '2px dashed transparent', background: over === i ? '#EBF1FF' : 'transparent' }} />
  )

  return (
    <div className="grid grid-cols-[1fr_240px] gap-4 p-4">
      <div>
        <p className="mb-2 text-xs text-gray-500">Ziehen zum Sortieren · Häkchen = sichtbar · Modul aus der Palette an die gewünschte Stelle ziehen oder mit + anhängen.</p>
        {gap(0)}
        {sections.map((s, i) => {
          const label = types.find((t) => t.value === s.type)?.label ?? s.type
          return (
            <div key={s.id}>
              <div draggable onDragStart={() => setDrag({ kind: 'card', id: s.id })} onDragEnd={() => { setDrag(null); setOver(null) }}
                onDragOver={(e) => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setOver(e.clientY < r.top + r.height / 2 ? i : i + 1) }}
                onDrop={(e) => { e.preventDefault(); drop(over ?? i) }}
                className={`group flex items-center gap-3 rounded-xl border bg-white p-2.5 ${s.isVisible ? 'border-blue-200' : 'border-gray-200 opacity-55'} ${drag?.kind === 'card' && drag.id === s.id ? 'opacity-30' : ''}`}>
                <GripVertical size={16} className="flex-none cursor-grab text-gray-300" />
                <button type="button" onClick={() => onToggle(s.id)} title={s.isVisible ? 'Ausblenden' : 'Einblenden'}
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg border-2 text-xs font-bold ${s.isVisible ? 'border-[#1A5FD4] bg-[#1A5FD4] text-white' : 'border-gray-300 text-gray-400'}`}>
                  {s.isVisible ? '✓' : i + 1}
                </button>
                <Sketch type={s.type} />
                <button type="button" onClick={() => onSelect(s.id)} className="min-w-0 flex-1 text-left">
                  <span className="block text-[11px] font-semibold text-gray-500">{String(i + 1).padStart(2, '0')} · {label.replace(/^[^A-Za-zÄÖÜ]+/, '')}{s.dirty ? ' · ungespeichert' : ''}</span>
                  <span className="block truncate text-sm font-semibold text-gray-900">{titleOf(s.content) || <i className="font-normal text-gray-400">ohne Inhalt</i>}</span>
                </button>
                <button type="button" onClick={() => onSelect(s.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Bearbeiten"><Pencil size={14} /></button>
                <button type="button" onClick={() => onDelete(s.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Löschen"><Trash2 size={14} /></button>
              </div>
              {gap(i + 1)}
            </div>
          )
        })}
        {sections.length === 0 && <div onDragOver={(e) => e.preventDefault()} onDrop={() => drop(0)} className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">Noch keine Module. Zieht eins aus der Palette hierher.</div>}
      </div>

      <aside className="sticky top-12 self-start rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Module</span>
          <div className="flex gap-1 text-[10px] font-semibold">
            <button type="button" onClick={() => setFilter('story')} className={`rounded-full px-2 py-0.5 ${filter === 'story' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>Story</button>
            <button type="button" onClick={() => setFilter('all')} className={`rounded-full px-2 py-0.5 ${filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>Alle</button>
          </div>
        </div>
        <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-2 overflow-y-auto pr-1">
          {palette.map((t) => {
            const last = lib.get(t.value)
            return (
              <div key={t.value} draggable onDragStart={() => setDrag({ kind: 'new', type: t.value })} onDragEnd={() => { setDrag(null); setOver(null) }}
                className="flex cursor-grab items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 hover:border-blue-300">
                <div style={{ transform: 'scale(.62)', transformOrigin: 'left center', width: 60, height: 40 }}><Sketch type={t.value} /></div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-gray-800">{t.label.replace(/^[^A-Za-zÄÖÜ]+/, '').replace('Story · ', '')}</span>
                  {last && <span className="flex items-center gap-1 truncate text-[10px] text-gray-500" title={`Zuletzt gespeichert auf ${last.page_slug ?? '–'}`}><History size={9} /> {titleOf(last.content) || 'letzte Fassung'}</span>}
                </div>
                <button type="button" onClick={() => onInsert(t.value, sections.length)} className="rounded-md p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-700" title="Am Ende einfügen"><Plus size={14} /></button>
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
