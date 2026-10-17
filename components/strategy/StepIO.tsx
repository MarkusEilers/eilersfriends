'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Bot, Check, ChevronDown, Loader2, RefreshCw, Search, X } from 'lucide-react'
import type { IOFact, StepIO } from '@/lib/actions/strategy-agents'
import { confirmOutputAction, keepOutputAction, rejectOutputAction, runStepAgentAction, runStepResearchAction } from '@/lib/actions/strategy-agents'

/** Wert eines Fakts lesbar machen: Listen als Punkte, Objekte als Zeilen. */
function Value({ v }: { v: unknown }) {
  if (v === null || v === undefined || v === '') return <span className="text-gray-400">—</span>
  if (typeof v === 'string' || typeof v === 'number') return <p className="whitespace-pre-wrap text-sm text-gray-700">{String(v)}</p>
  if (Array.isArray(v)) {
    const items = v.filter((x) => !(x && typeof x === 'object' && (x as Record<string, unknown>).status === 'rejected'))
    return (
      <ul className="space-y-1">
        {items.slice(0, 12).map((x, i) => {
          const o = (x && typeof x === 'object' ? x : { text: x }) as Record<string, unknown>
          const main = o.text ?? o.name ?? o.label ?? o.title ?? o.quote ?? o.value
          const rest = Object.entries(o).filter(([k, val]) => !['text', 'name', 'label', 'title', 'quote', 'value', 'id', 'origin', 'status', 'source', 'created_at', 'updated_at'].includes(k) && typeof val !== 'object' && val !== '' && val !== null)
          return (
            <li key={i} className="text-sm text-gray-700">
              <span className="mr-1.5 text-gray-300">•</span>{main !== undefined ? String(main) : JSON.stringify(o)}
              {rest.length > 0 && <span className="ml-1 text-xs text-gray-400">({rest.slice(0, 3).map(([k, val]) => `${k}: ${String(val)}`).join(' · ')})</span>}
            </li>
          )
        })}
        {items.length > 12 && <li className="text-xs text-gray-400">… und {items.length - 12} weitere</li>}
      </ul>
    )
  }
  if (typeof v === 'object') {
    return (
      <dl className="space-y-1 text-sm">
        {Object.entries(v as Record<string, unknown>).slice(0, 10).map(([k, val]) => (
          <div key={k} className="flex gap-2"><dt className="flex-shrink-0 text-xs font-semibold text-gray-400">{k}</dt><dd className="min-w-0 text-gray-700">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</dd></div>
        ))}
      </dl>
    )
  }
  return <span>{String(v)}</span>
}

function Chip({ f }: { f: IOFact }) {
  if (!f.factId) return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">fehlt</span>
  if (f.staleSince) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">überholt</span>
  if (f.status === 'draft') return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Entwurf · prüfen</span>
  return <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">v{f.version} · {f.source === 'user' ? 'vom Team' : f.source === 'research' ? 'Recherche' : 'bestätigt'}</span>
}

const when = (d: string | null) => (d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '')

export function StepIOBanner({ io }: { io: StepIO }) {
  if (!io.staleCount) return null
  const reasons = [...new Set(io.outputs.filter((o) => o.staleReason).map((o) => o.staleReason!))]
  return (
    <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
      <div className="text-sm">
        <p className="font-semibold text-amber-900">{io.staleCount === 1 ? 'Ein Ergebnis ist überholt.' : `${io.staleCount} Ergebnisse sind überholt.`}</p>
        <p className="mt-0.5 text-amber-800">{reasons.join(' · ')}. Unten unter „Output" neu erzeugen — oder bewusst behalten.</p>
      </div>
    </div>
  )
}

export function StepInputs({ io, productId }: { io: StepIO; productId: string | null }) {
  const [open, setOpen] = useState(false)
  if (!io.inputs.length && !io.research) return null
  const missing = io.inputs.filter((i) => !i.factId).length
  const stale = io.inputs.filter((i) => i.staleSince).length
  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-6 py-4 text-left">
        <ArrowDownToLine size={16} className="text-gray-400" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-gray-900">Input <span className="font-normal text-gray-400">· worauf dieser Schritt aufbaut</span></h2>
          <p className="text-xs text-gray-500">{io.inputs.length - missing} von {io.inputs.length} vorhanden{missing ? ` · ${missing} fehlen` : ''}{stale ? ` · ${stale} überholt` : ''}</p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="divide-y divide-gray-50 border-t border-gray-100 px-6">
          {io.inputs.map((i) => (
            <li key={i.key} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{i.label}</span>
                <Chip f={i} />
                {i.stepKey && <Link href={`/dashboard/strategie/${i.stepKey}${productId ? `?product=${productId}` : ''}` as '/'} className="text-xs text-blue-700 hover:underline">aus {i.stepTitle ?? i.stepKey} →</Link>}
                {i.updatedAt && <span className="ml-auto text-[11px] text-gray-400">{when(i.updatedAt)}</span>}
              </div>
              {i.factId && <div className="mt-1.5 max-h-40 overflow-hidden"><Value v={i.value} /></div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function StepOutputs({ io, stepKey, productId }: { io: StepIO; stepKey: string; productId: string | null }) {
  const router = useRouter()
  const [running, setRunning] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)
  const [pending, start] = useTransition()

  const run = async (agentKey: string) => {
    setRunning(agentKey); setMsg(null)
    const r = agentKey === '__research' ? await runStepResearchAction(stepKey, productId) : await runStepAgentAction(stepKey, productId, agentKey)
    setRunning(null)
    if (!r.ok) setMsg({ tone: 'err', text: ('error' in r && typeof r.error === 'string' && r.error) || 'Lauf fehlgeschlagen' })
    else {
      const miss = 'missing' in r && Array.isArray(r.missing) ? r.missing.length : 0
      setMsg({ tone: 'ok', text: miss ? `Fertig — ohne ${miss} fehlende Inputs erzeugt, die Lücken sind gekennzeichnet.` : 'Fertig. Bitte prüfen und bestätigen.' })
    }
    router.refresh()
    return r.ok
  }
  const runAll = async (onlyStale: boolean) => {
    for (const a of io.agents.filter((x) => !onlyStale || x.stale)) { const ok = await run(a.key); if (!ok) break }
  }
  const act = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh() })

  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 px-6 py-4">
        <ArrowUpFromLine size={16} className="text-gray-400" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-gray-900">Output <span className="font-normal text-gray-400">· was dieser Schritt liefert</span></h2>
          <p className="text-xs text-gray-500">Darauf bauen die folgenden Schritte auf. Ändert sich ein Input, wird hier „überholt" angezeigt.</p>
        </div>
      </div>

      <ul className="divide-y divide-gray-50 border-t border-gray-100 px-6">
        {io.outputs.map((o) => (
          <li key={o.key} className={`py-4 ${o.staleSince ? '-mx-6 bg-amber-50/50 px-6' : ''}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{o.label}</span>
              <Chip f={o} />
              {o.updatedAt && <span className="text-[11px] text-gray-400">{when(o.updatedAt)}</span>}
              <span className="ml-auto flex gap-1">
                {o.factId && o.status === 'draft' && (
                  <>
                    <button type="button" disabled={pending} onClick={() => act(() => confirmOutputAction(stepKey, o.factId!))} className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-0.5 text-[11px] font-semibold text-white"><Check size={11} /> Bestätigen</button>
                    <button type="button" disabled={pending} onClick={() => act(() => rejectOutputAction(stepKey, o.factId!))} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600"><X size={11} /> Verwerfen</button>
                  </>
                )}
                {o.factId && o.staleSince && (
                  <button type="button" disabled={pending} onClick={() => act(() => keepOutputAction(stepKey, o.factId!))} className="rounded-md border border-amber-300 px-2 py-0.5 text-[11px] font-semibold text-amber-800" title="Markierung aufheben, ohne neu zu erzeugen">passt trotzdem</button>
                )}
              </span>
            </div>
            {o.staleReason && <p className="mt-1 text-xs text-amber-800">Überholt: {o.staleReason}</p>}
            {o.factId ? <div className="mt-2"><Value v={o.value} /></div> : <p className="mt-1 text-xs text-gray-400">Noch nicht erzeugt.</p>}
          </li>
        ))}
        {!io.outputs.length && <li className="py-4 text-sm text-gray-400">Für diesen Schritt sind noch keine Outputs im Katalog hinterlegt.</li>}
      </ul>

      {(io.agents.length > 0 || io.research) && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Bot size={12} /> Agenten</p>
            {io.canRun && io.agents.length > 1 && (
              <span className="ml-auto flex gap-2">
                {io.agents.some((a) => a.stale) && <button type="button" disabled={!!running} onClick={() => runAll(true)} className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Überholtes neu erzeugen</button>}
                <button type="button" disabled={!!running} onClick={() => runAll(false)} className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-50">Alle der Reihe nach</button>
              </span>
            )}
          </div>
          <ul className="mt-3 space-y-2">
            {io.research && (
              <AgentRow label={io.research.label} hint="Sammelt Material im Netz und wertet es aus. Dauert ein bis zwei Minuten." icon={<Search size={13} />}
                busy={running === '__research'} disabled={!io.canRun || !!running} onRun={() => run('__research')} cta="Recherche starten" />
            )}
            {io.agents.map((a) => (
              <AgentRow key={a.key} label={a.label} stale={a.stale}
                hint={a.missing.length ? `Es fehlen noch ${a.missing.length} Inputs — der Agent arbeitet ohne sie und kennzeichnet die Lücken.` : undefined}
                busy={running === a.key} disabled={!io.canRun || !!running} onRun={() => run(a.key)}
                cta={io.outputs.some((o) => a.produces.includes(o.key) && o.factId) ? 'Neu erzeugen' : 'Erzeugen'} />
            ))}
          </ul>
          {!io.canRun && <p className="mt-3 text-xs text-gray-500">Agenten starten Eilers+Friends, Euer Admin oder Eure Leads.</p>}
          {msg && <p className={`mt-3 rounded-lg px-3 py-2 text-xs ${msg.tone === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
        </div>
      )}
    </section>
  )
}

function AgentRow({ label, hint, stale, busy, disabled, onRun, cta, icon }: { label: string; hint?: string; stale?: boolean; busy: boolean; disabled: boolean; onRun: () => void; cta: string; icon?: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">
      <span className="text-gray-400">{icon ?? <Bot size={13} />}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">{label} {stale && <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">überholt</span>}</p>
        {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
      </div>
      <button type="button" disabled={disabled} onClick={onRun}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${stale ? 'bg-amber-500 text-white' : 'bg-gray-900 text-white'}`}>
        {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}{busy ? 'läuft …' : cta}
      </button>
    </li>
  )
}
