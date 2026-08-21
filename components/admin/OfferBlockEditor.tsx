'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, X, ChevronUp, ChevronDown, Eye, EyeOff, Save, Search, BookOpen } from 'lucide-react'
import { saveOfferBlocksAction, searchFaqLibraryAction, listTrustLogosAction, listProgramsForBlocksAction } from '@/lib/actions/offers'

export interface BlockRow {
  id?: string
  kind: string
  title?: string | null
  subtitle?: string | null
  body?: string | null
  data?: Record<string, unknown>
  is_visible?: boolean
}

const KINDS: { key: string; label: string; hint: string }[] = [
  { key: 'richtext',      label: 'Text',            hint: 'Freier Abschnitt — „Was daran auffällt", „Hinweis"' },
  { key: 'checklist',     label: 'Checkliste',      hint: 'Punkte zum Wiedererkennen' },
  { key: 'bullets',       label: 'Aufzählung',      hint: '„Was Ihr einbringt"' },
  { key: 'metrics',       label: 'Zahlen',          hint: 'Tabellen — Zielrechnung, Refinanzierung' },
  { key: 'quote',         label: 'Zitat-Kasten',    hint: 'Beispiel oder Kundenstimme' },
  { key: 'faq',           label: 'Fragen (FAQ)',    hint: 'Aus der Bibliothek — wächst mit jedem Angebot' },
  { key: 'trustbar',      label: 'Trust-Bar',       hint: 'Logos + Kundenstimmen' },
  { key: 'program_steps', label: 'Programm-Schritte', hint: 'Schritte aus einem Programm — referenziert, nicht kopiert' },
]

function asItems(b: BlockRow): string[] { return ((b.data?.items as string[]) ?? []) }
function asFaq(b: BlockRow) { return ((b.data?.items as { question: string; answer: string }[]) ?? []) }
function asTrust(b: BlockRow) { return ((b.data?.items as { name: string; src?: string; quote?: string; author?: string; result?: string }[]) ?? []) }
function asMetricRows(b: BlockRow) { return (((b.data?.groups as { heading?: string; rows: { label: string; value: string; strong?: boolean }[] }[]) ?? [])) }

/** Blöcke eines Angebots verwalten. */
export function OfferBlockEditor({ offerId, initial }: { offerId: string; initial: BlockRow[] }) {
  const [rows, setRows] = useState<BlockRow[]>(initial ?? [])
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [faqSearch, setFaqSearch] = useState('')
  const [faqHits, setFaqHits] = useState<{ id: string; question: string; answer: string; usage_count: number }[]>([])
  const [logos, setLogos] = useState<{ slug: string; name: string; src: string | null; src_bw: string | null }[]>([])
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([])
  const [openFaqPicker, setOpenFaqPicker] = useState<number | null>(null)

  useEffect(() => {
    listTrustLogosAction().then(setLogos).catch(() => {})
    listProgramsForBlocksAction().then(setPrograms).catch(() => {})
  }, [])

  function upd(i: number, patch: Partial<BlockRow>) { setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x))) }
  function updData(i: number, patch: Record<string, unknown>) { setRows((r) => r.map((x, j) => (j === i ? { ...x, data: { ...(x.data ?? {}), ...patch } } : x))) }
  function move(i: number, dir: -1 | 1) {
    setRows((r) => { const n = [...r]; const j = i + dir; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n })
  }

  function save() {
    setErr(null); setMsg(null)
    start(async () => {
      try {
        const saved = await saveOfferBlocksAction(offerId, rows.map((b) => ({
          id: b.id, kind: b.kind, title: b.title ?? null, subtitle: b.subtitle ?? null,
          body: b.body ?? null, data: b.data ?? {}, isVisible: b.is_visible !== false,
        })))
        setRows(saved as BlockRow[]); setMsg('Blöcke gespeichert. FAQ-Fragen sind in die Bibliothek übernommen.')
      } catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
    })
  }

  async function findFaqs(q: string) {
    setFaqSearch(q)
    try { setFaqHits(await searchFaqLibraryAction(q)) } catch { /* still */ }
  }

  const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400'

  return (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        Freie Abschnitte für dieses Angebot. Sie erscheinen unter den festen Sektionen, in dieser Reihenfolge.
      </p>

      <div className="space-y-3">
        {rows.map((b, i) => {
          const meta = KINDS.find((k) => k.key === b.kind)
          return (
            <div key={b.id ?? i} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>{meta?.label ?? b.kind}</span>
                <input value={b.title ?? ''} onChange={(e) => upd(i, { title: e.target.value })} placeholder="Überschrift"
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-400" />
                <button type="button" onClick={() => upd(i, { is_visible: !(b.is_visible !== false) })}
                  className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500" title="Sichtbarkeit">
                  {b.is_visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 disabled:opacity-30"><ChevronUp size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 disabled:opacity-30"><ChevronDown size={14} /></button>
                <button type="button" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} className="rounded-lg border border-red-200 bg-white p-1.5 text-red-600"><X size={14} /></button>
              </div>
              {meta?.hint && <p className="mt-1 text-[11px] text-gray-400">{meta.hint}</p>}

              {/* Freitext für alle Typen, die Text tragen */}
              {['richtext', 'quote', 'bullets', 'checklist', 'metrics', 'trustbar', 'program_steps'].includes(b.kind) && (
                <textarea value={b.body ?? ''} onChange={(e) => upd(i, { body: e.target.value })} rows={b.kind === 'richtext' ? 5 : 2}
                  placeholder={b.kind === 'richtext' ? 'Text — Leerzeile trennt Absätze' : 'Einleitender Text (optional)'}
                  className={`mt-2 ${input}`} />
              )}

              {/* Checkliste / Aufzählung */}
              {(b.kind === 'checklist' || b.kind === 'bullets') && (
                <div className="mt-2 space-y-1.5">
                  {asItems(b).map((it, k) => (
                    <div key={k} className="flex gap-1.5">
                      <input value={typeof it === 'string' ? it : ''} onChange={(e) => {
                        const arr = [...asItems(b)]; arr[k] = e.target.value; updData(i, { items: arr })
                      }} placeholder={`Punkt ${k + 1}`} className={input} />
                      <button type="button" onClick={() => updData(i, { items: asItems(b).filter((_, j) => j !== k) })}
                        className="rounded-lg border border-red-200 bg-white px-2 text-red-600"><X size={13} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updData(i, { items: [...asItems(b), ''] })}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">+ Punkt</button>
                  {b.kind === 'checklist' && (
                    <input value={String(b.data?.note ?? '')} onChange={(e) => updData(i, { note: e.target.value })}
                      placeholder="Schlusssatz, z.B. Wenn drei Punkte zutreffen ..." className={`mt-1 ${input}`} />
                  )}
                </div>
              )}

              {/* Zahlen */}
              {b.kind === 'metrics' && (
                <div className="mt-2 space-y-3">
                  {asMetricRows(b).map((g, gi) => (
                    <div key={gi} className="rounded-xl border border-gray-200 bg-white p-3">
                      <input value={g.heading ?? ''} onChange={(e) => {
                        const gs = [...asMetricRows(b)]; gs[gi] = { ...g, heading: e.target.value }; updData(i, { groups: gs })
                      }} placeholder="Zwischenüberschrift" className={`${input} mb-2 font-semibold`} />
                      {(g.rows ?? []).map((r, ri) => (
                        <div key={ri} className="mb-1.5 flex gap-1.5">
                          <input value={r.label} onChange={(e) => {
                            const gs = [...asMetricRows(b)]; const rr = [...(g.rows ?? [])]; rr[ri] = { ...r, label: e.target.value }
                            gs[gi] = { ...g, rows: rr }; updData(i, { groups: gs })
                          }} placeholder="Bezeichnung" className={input} />
                          <input value={r.value} onChange={(e) => {
                            const gs = [...asMetricRows(b)]; const rr = [...(g.rows ?? [])]; rr[ri] = { ...r, value: e.target.value }
                            gs[gi] = { ...g, rows: rr }; updData(i, { groups: gs })
                          }} placeholder="Wert" className="w-40 rounded-lg border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-blue-400" />
                          <label className="flex items-center gap-1 text-[11px] text-gray-500">
                            <input type="checkbox" checked={!!r.strong} onChange={(e) => {
                              const gs = [...asMetricRows(b)]; const rr = [...(g.rows ?? [])]; rr[ri] = { ...r, strong: e.target.checked }
                              gs[gi] = { ...g, rows: rr }; updData(i, { groups: gs })
                            }} /> fett
                          </label>
                        </div>
                      ))}
                      <button type="button" onClick={() => {
                        const gs = [...asMetricRows(b)]; gs[gi] = { ...g, rows: [...(g.rows ?? []), { label: '', value: '' }] }; updData(i, { groups: gs })
                      }} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">+ Zeile</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updData(i, { groups: [...asMetricRows(b), { heading: '', rows: [] }] })}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">+ Tabelle</button>
                </div>
              )}

              {/* FAQ mit Bibliothek */}
              {b.kind === 'faq' && (
                <div className="mt-2 space-y-2">
                  {asFaq(b).map((f, k) => (
                    <div key={k} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex gap-1.5">
                        <input value={f.question} onChange={(e) => {
                          const arr = [...asFaq(b)]; arr[k] = { ...f, question: e.target.value }; updData(i, { items: arr })
                        }} placeholder="Frage" className={`${input} font-semibold`} />
                        <button type="button" onClick={() => updData(i, { items: asFaq(b).filter((_, j) => j !== k) })}
                          className="rounded-lg border border-red-200 bg-white px-2 text-red-600"><X size={13} /></button>
                      </div>
                      <textarea value={f.answer} onChange={(e) => {
                        const arr = [...asFaq(b)]; arr[k] = { ...f, answer: e.target.value }; updData(i, { items: arr })
                      }} rows={2} placeholder="Antwort" className={`mt-1.5 ${input}`} />
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => updData(i, { items: [...asFaq(b), { question: '', answer: '' }] })}
                      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">+ Frage</button>
                    <button type="button" onClick={() => { setOpenFaqPicker(openFaqPicker === i ? null : i); findFaqs('') }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      <BookOpen size={12} /> Aus Bibliothek
                    </button>
                  </div>
                  {openFaqPicker === i && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                      <div className="flex items-center gap-1.5">
                        <Search size={13} className="text-gray-400" />
                        <input value={faqSearch} onChange={(e) => findFaqs(e.target.value)} placeholder="Frage suchen …" className={input} />
                      </div>
                      <div className="mt-2 max-h-44 space-y-1 overflow-auto">
                        {faqHits.length === 0 && <p className="px-1 py-2 text-xs text-gray-400">Noch keine Einträge — gespeicherte FAQ-Blöcke füllen die Bibliothek.</p>}
                        {faqHits.map((h) => (
                          <button key={h.id} type="button"
                            onClick={() => { updData(i, { items: [...asFaq(b), { question: h.question, answer: h.answer }] }); setOpenFaqPicker(null) }}
                            className="block w-full rounded-lg bg-white px-3 py-2 text-left text-xs hover:bg-blue-50">
                            <span className="font-semibold text-gray-800">{h.question}</span>
                            <span className="ml-2 text-[10px] text-gray-400">{h.usage_count}× genutzt</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trust-Bar */}
              {b.kind === 'trustbar' && (
                <div className="mt-2 space-y-2">
                  {asTrust(b).map((t, k) => (
                    <div key={k} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex gap-1.5">
                        <select value={t.name} onChange={(e) => {
                          const lg = logos.find((l) => l.name === e.target.value)
                          const arr = [...asTrust(b)]; arr[k] = { ...t, name: e.target.value, src: lg?.src ?? lg?.src_bw ?? undefined }; updData(i, { items: arr })
                        }} className={input}>
                          <option value="">— Logo wählen —</option>
                          {logos.map((l) => <option key={l.slug} value={l.name}>{l.name}</option>)}
                        </select>
                        <button type="button" onClick={() => updData(i, { items: asTrust(b).filter((_, j) => j !== k) })}
                          className="rounded-lg border border-red-200 bg-white px-2 text-red-600"><X size={13} /></button>
                      </div>
                      <input value={t.result ?? ''} onChange={(e) => { const arr = [...asTrust(b)]; arr[k] = { ...t, result: e.target.value }; updData(i, { items: arr }) }}
                        placeholder="Ergebnis (z.B. Von 0,5 auf 1,8 Mio € ARR)" className={`mt-1.5 ${input}`} />
                      <textarea value={t.quote ?? ''} onChange={(e) => { const arr = [...asTrust(b)]; arr[k] = { ...t, quote: e.target.value }; updData(i, { items: arr }) }}
                        rows={2} placeholder="Zitat" className={`mt-1.5 ${input}`} />
                      <input value={t.author ?? ''} onChange={(e) => { const arr = [...asTrust(b)]; arr[k] = { ...t, author: e.target.value }; updData(i, { items: arr }) }}
                        placeholder="Name, Rolle, Firma" className={`mt-1.5 ${input}`} />
                    </div>
                  ))}
                  <button type="button" onClick={() => updData(i, { items: [...asTrust(b), { name: '' }] })}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">+ Referenz</button>
                </div>
              )}

              {/* Programm-Schritte */}
              {b.kind === 'program_steps' && (
                <select value={String(b.data?.programId ?? '')} onChange={(e) => updData(i, { programId: e.target.value })}
                  className={`mt-2 ${input}`}>
                  <option value="">— Programm wählen —</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select onChange={(e) => { if (e.target.value) { setRows((r) => [...r, { kind: e.target.value, data: {}, is_visible: true }]); e.target.value = '' } }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
          <option value="">+ Block hinzufügen …</option>
          {KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
        </select>
        <button type="button" onClick={save} disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: '#1A5FD4' }}>
          <Save size={13} /> {pending ? 'Speichert …' : 'Blöcke speichern'}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs font-semibold text-green-700">{msg}</p>}
      {err && <p className="mt-2 text-xs font-semibold text-red-600">{err}</p>}
    </div>
  )
}
