'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronDown, ChevronRight, Package, Plus, Building2, X, Kanban, LayoutGrid } from 'lucide-react'
import { createProductAction, type TreeProduct, type TreeStep } from '@/lib/actions/strategy'

/**
 * Zweite Navigation im Strategie-Bereich: Organisation → Produkte → die
 * 13 Programmschritte. Gruppen aus dem Programm (2 · ICP & Wettbewerb)
 * fassen mehrere Arbeitsbereiche zusammen. „Überholt" erscheint als
 * Bernstein-Punkt, sobald neuer Input oder ein Signal Outputs überholt hat.
 */

function Dot({ s }: { s: TreeStep }) {
  if (s.status === 'approved') return <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-blue-600 text-white"><Check size={12} /></span>
  const p = s.progress ?? 0
  if (s.status === 'submitted' || s.status === 'in_review') return <span className="h-5 w-5 flex-shrink-0 rounded-md border-2 border-blue-600 bg-blue-50" />
  if (p > 0 || s.status === 'in_progress' || s.status === 'changes_requested')
    return <span className="h-5 w-5 flex-shrink-0 rounded-md border-2 border-blue-300" style={{ background: `linear-gradient(to top, #BFDBFE ${p}%, transparent ${p}%)` }} />
  return <span className="h-5 w-5 flex-shrink-0 rounded-md border-2 border-gray-200" />
}

function groupSteps(steps: TreeStep[]) {
  const groups: { n: number | null; title: string; steps: TreeStep[] }[] = []
  for (const s of steps) {
    const g = groups.find((x) => x.n !== null && x.n === s.program_step_n)
    if (g) g.steps.push(s)
    else groups.push({ n: s.program_step_n, title: s.group_title ?? s.title, steps: [s] })
  }
  return groups
}

export function StrategyTree({ company, products }: { company: TreeStep[]; products: TreeProduct[] }) {
  const pathname = usePathname()
  const sp = useSearchParams()
  const router = useRouter()
  const activeKey = pathname.match(/\/dashboard\/strategie\/([^/?]+)/)?.[1] ?? null
  const activeProduct = sp.get('product') ?? (activeKey ? null : products[0]?.id ?? null)
  const [open, setOpen] = useState<Set<string>>(new Set(activeProduct ? [activeProduct] : products[0] ? [products[0].id] : []))
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [pending, start] = useTransition()

  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const href = (key: string, productId?: string) => `/dashboard/strategie/${key}${productId ? `?product=${productId}` : ''}` as '/'
  const isActive = (key: string, productId?: string) => activeKey === key && (productId ? sp.get('product') === productId : !sp.get('product'))
  const add = () => {
    if (!name.trim()) return
    start(async () => {
      const p = await createProductAction(name.trim())
      setName(''); setAdding(false); setOpen((o) => new Set(o).add(p.id))
      router.push(`/dashboard/strategie?product=${p.id}` as '/'); router.refresh()
    })
  }

  const StepLink = ({ s, productId, indent = false }: { s: TreeStep; productId?: string; indent?: boolean }) => (
    <Link href={href(s.key, productId)}
      className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors ${indent ? 'ml-6' : ''} ${isActive(s.key, productId) ? 'bg-blue-50 font-semibold text-blue-800' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
      <Dot s={s} />
      <span className="min-w-0 flex-1 truncate">{s.title}</span>
      {s.stale && <span title="Überholt — neuer Input oder ein Signal" className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />}
    </Link>
  )

  return (
    <nav className="space-y-5 text-sm">
      <Link href={'/dashboard/strategie' as '/'} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold ${pathname.endsWith('/dashboard/strategie') ? 'text-blue-800' : 'text-gray-700 hover:text-gray-900'}`}>
        <LayoutGrid size={14} /> Übersicht
      </Link>

      {company.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Building2 size={11} /> Organisation</p>
          {company.map((s) => <StepLink key={s.key} s={s} />)}
        </div>
      )}

      <div>
        <p className="mb-1 flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Package size={11} /> Produkte</p>
        {products.map((p) => {
          const done = p.steps.filter((s) => s.status === 'approved').length
          const groups = groupSteps(p.steps)
          const stale = p.steps.some((s) => s.stale)
          return (
            <div key={p.id}>
              <button type="button" onClick={() => toggle(p.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-semibold ${activeProduct === p.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>
                {open.has(p.id) ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {stale && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                <span className="text-[11px] font-medium text-gray-400">{done}/{groups.length}</span>
              </button>
              {open.has(p.id) && (
                <div className="mt-0.5 border-l border-gray-100 pl-2 ml-3.5">
                  {groups.map((g) => g.steps.length === 1 ? (
                    <div key={g.steps[0].key} className="flex items-center">
                      <span className="w-5 flex-shrink-0 text-right text-[10px] font-semibold text-gray-300">{g.n ?? ''}</span>
                      <div className="min-w-0 flex-1"><StepLink s={g.steps[0]} productId={p.id} /></div>
                    </div>
                  ) : (
                    <div key={`g${g.n}`}>
                      <div className="flex items-center gap-2 px-0 py-1">
                        <span className="w-5 flex-shrink-0 text-right text-[10px] font-semibold text-gray-300">{g.n ?? ''}</span>
                        <span className="px-2 text-[12px] font-semibold text-gray-500">{g.title}</span>
                      </div>
                      {g.steps.map((s) => <StepLink key={s.key} s={s} productId={p.id} indent />)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {adding ? (
          <div className="mt-1 flex items-center gap-1 px-2" onKeyDown={(e) => { if (e.key === 'Escape') { setAdding(false); setName('') } }}>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }}
              placeholder="Name des Produkts" className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400" />
            <button type="button" onClick={add} disabled={pending} className="rounded-md p-1 text-blue-700 hover:bg-blue-50"><Check size={14} /></button>
            <button type="button" onClick={() => { setAdding(false); setName('') }} className="rounded-md p-1 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="mt-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700">
            <Plus size={14} /> Produkt hinzufügen
          </button>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3">
        <span className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-gray-400" title="Execute — in Planung">
          <Kanban size={14} /> Execute <span className="ml-auto rounded bg-gray-100 px-1.5 text-[10px]">bald</span>
        </span>
      </div>
    </nav>
  )
}
