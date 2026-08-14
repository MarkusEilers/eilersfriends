'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Package, X } from 'lucide-react'
import { createProductAction } from '@/lib/actions/strategy'

interface P { id: string; name: string; slug: string }

/** Produkt-Umschalter — die 13 Schritte laufen je Produkt. */
export function ProductSwitcher({ products, activeId, basePath = '/dashboard/strategie' }:
  { products: P[]; activeId?: string | null; basePath?: string }) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()
  const active = products.find((p) => p.id === activeId) ?? products[0]

  function create() {
    if (!name.trim()) return
    start(async () => {
      const p = await createProductAction(name)
      setName(''); setCreating(false); setOpen(false)
      router.push(`${basePath}?product=${p.id}`)
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50">
        <Package size={15} style={{ color: '#1A5FD4' }} />
        {active?.name ?? 'Produkt wählen'}
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="max-h-64 overflow-auto py-1">
              {products.length === 0 && (
                <p className="px-4 py-3 text-xs text-gray-400">Noch kein Produkt angelegt.</p>
              )}
              {products.map((p) => (
                <button key={p.id} type="button"
                  onClick={() => { setOpen(false); router.push(`${basePath}?product=${p.id}`); router.refresh() }}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${p.id === active?.id ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                  <Package size={14} className={p.id === active?.id ? 'text-blue-600' : 'text-gray-400'} />
                  {p.name}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 p-2">
              {creating ? (
                <div className="flex items-center gap-1.5">
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setCreating(false) }}
                    placeholder="Name des Produkts"
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-400" />
                  <button type="button" onClick={create} disabled={pending || !name.trim()}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    style={{ backgroundColor: '#1A5FD4' }}>OK</button>
                  <button type="button" onClick={() => setCreating(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
                  <Plus size={14} /> Produkt hinzufügen
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
