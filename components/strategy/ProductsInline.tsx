'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Package, Pencil, Plus, Trash2, X } from 'lucide-react'
import { archiveProductAction, createProductAction, updateProductAction } from '@/lib/actions/strategy'

/**
 * Produkte direkt auf der Strategie-Seite — anlegen, umbenennen, auswählen,
 * ohne Dropdown und ohne Seitenwechsel. Muster aus der GTM Engine
 * (ProductsSection): Karte anklicken = auswählen, Stift = inline bearbeiten,
 * Enter speichert, Escape bricht ab.
 */

interface P { id: string; name: string; slug: string; description?: string | null }

export function ProductsInline({ products, activeId, canEdit = true }: { products: P[]; activeId?: string | null; canEdit?: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [adding, setAdding] = useState(products.length === 0)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [err, setErr] = useState('')

  const select = (id: string) => { router.push(`/dashboard/strategie?product=${id}` as '/'); router.refresh() }
  const add = () => {
    if (!name.trim()) { setErr('Bitte einen Namen eingeben.'); return }
    start(async () => {
      try {
        const p = await createProductAction(name.trim(), desc.trim() || undefined)
        setName(''); setDesc(''); setErr(''); setAdding(false)
        select(p.id)
      } catch (e) { setErr((e as Error).message) }
    })
  }

  // Leerer Zustand: das Anlegen ist der Inhalt, nicht ein Knopf daneben
  if (products.length === 0) {
    return (
      <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold text-gray-900">Womit fangt Ihr an?</p>
        <p className="mt-1 max-w-lg text-sm text-gray-500">Die Schritte laufen je Produkt — so bleibt jede Strategie sauber getrennt. Ein Name reicht, alles andere kommt in den Schritten.</p>
        {canEdit ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }}
              placeholder="Name des Produkts, z. B. OpenTAS 365" className="rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400" />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }}
              placeholder="In einem Satz: was es ist (optional)" className="rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400" />
            <button type="button" onClick={add} disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#1A5FD4' }}>
              <Plus size={14} /> Anlegen
            </button>
          </div>
        ) : <p className="mt-4 text-xs text-gray-400">Produkte legt Euer Admin oder Eilers+Friends an.</p>}
        {err && <p className="mt-2 text-xs font-medium text-red-600">{err}</p>}
      </div>
    )
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => <ProductCard key={p.id} p={p} active={p.id === activeId} onSelect={() => select(p.id)} canEdit={canEdit} />)}

      {canEdit && (adding ? (
        <div className="rounded-2xl border border-blue-200 bg-white p-3" onKeyDown={(e) => { if (e.key === 'Escape') { setAdding(false); setName(''); setDesc('') } }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }}
            placeholder="Name des Produkts" className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-blue-400" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }}
            placeholder="Beschreibung (optional)" className="mt-1.5 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400" />
          <div className="mt-2 flex items-center gap-1.5">
            <button type="button" onClick={add} disabled={pending} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#1A5FD4' }}><Check size={12} /> Anlegen</button>
            <button type="button" onClick={() => { setAdding(false); setName(''); setDesc('') }} className="rounded-full px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"><X size={12} /></button>
            {err && <span className="text-[11px] text-red-600">{err}</span>}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="flex min-h-[76px] items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 text-sm font-semibold text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-700">
          <Plus size={15} /> Produkt hinzufügen
        </button>
      ))}
    </div>
  )
}

function ProductCard({ p, active, onSelect, canEdit }: { p: P; active: boolean; onSelect: () => void; canEdit: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(p.name)
  const [desc, setDesc] = useState(p.description ?? '')
  const [pending, start] = useTransition()

  const save = () => {
    if (!name.trim()) return
    start(async () => { await updateProductAction(p.id, name.trim(), desc.trim() || null); setEditing(false); router.refresh() })
  }
  const cancel = () => { setName(p.name); setDesc(p.description ?? ''); setEditing(false) }
  const remove = () => {
    if (!confirm(`„${p.name}" archivieren? Die erarbeiteten Schritte bleiben gespeichert.`)) return
    start(async () => { await archiveProductAction(p.id); router.push('/dashboard/strategie' as '/'); router.refresh() })
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-blue-300 bg-white p-3" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() } if (e.key === 'Escape') cancel() }}>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-blue-400" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Beschreibung (optional)" className="mt-1.5 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400" />
        <div className="mt-2 flex gap-1.5">
          <button type="button" onClick={save} disabled={pending} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: '#1A5FD4' }}><Check size={12} /> Speichern</button>
          <button type="button" onClick={cancel} className="rounded-full px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100">Abbrechen</button>
        </div>
      </div>
    )
  }
  return (
    <div onClick={onSelect} role="button"
      className={`group relative cursor-pointer rounded-2xl border bg-white p-4 transition-all hover:-translate-y-px hover:shadow-sm ${active ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}><Package size={16} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-gray-900">{p.name}</h3>
          {p.description ? <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{p.description}</p> : canEdit ? <p className="mt-0.5 text-xs text-gray-300">Beschreibung ergänzen …</p> : null}
        </div>
        {canEdit && (
          <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(true) }} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Bearbeiten"><Pencil size={13} /></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); remove() }} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Archivieren"><Trash2 size={13} /></button>
          </span>
        )}
      </div>
    </div>
  )
}
