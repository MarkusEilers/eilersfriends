'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Play, Loader2, AlertTriangle, CheckCircle2, Copy, Check, ChevronRight, BookOpen, Clock,
} from 'lucide-react'

interface Agent {
  key: string; version: number; title: string; description: string | null
  input_schema: { properties?: Record<string, { type?: string; enum?: string[]; description?: string }>; required?: string[] }
  steps: Array<{ key: string; kind: string; title?: string }>
  knowledge: string[]
}
interface Pack { key: string; kind: string; name: string; eigen: boolean; items: number }
interface RunRow {
  id: string; agent_key: string; status: string; started_at: string
  tokens_in: number; tokens_out: number; amount_eur: string; org_name: string | null
}

const TEXTARTEN = ['linkedin', 'blog', 'newsletter', 'report', 'youtube', 'short']

/**
 * Die Konsole.
 *
 * Links der Auftrag, rechts der Lauf. Die Felder kommen aus dem Eingabe-Schema
 * des Agenten — wer einen neuen Agenten anlegt, bekommt sein Formular geschenkt.
 */
export function AgentConsole({
  agents, packs, runs: initialRuns, orgs,
}: { agents: Agent[]; packs: Pack[]; runs: RunRow[]; orgs: Array<{ id: string; name: string }> }) {
  const [agentKey, setAgentKey] = useState(agents[0]?.key ?? '')
  const agent = useMemo(() => agents.find((a) => a.key === agentKey), [agents, agentKey])

  const [form, setForm] = useState<Record<string, unknown>>({
    textart: 'linkedin', ansprache: 'ihr', laenge: { wert: 250, einheit: 'woerter' }, recherche: false,
  })
  const [orgId, setOrgId] = useState('')
  const [runId, setRunId] = useState<string | null>(null)
  const [state, setState] = useState<string>('')
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runs, setRuns] = useState(initialRuns)

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  async function start() {
    if (!agent) return
    setBusy(true); setError(null); setData(null); setRunId(null); setState('läuft')
    try {
      const res = await fetch(`/api/agents/${agent.key}/runs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: form, orgId: orgId || null }),
      })
      const d = await res.json()
      if (!res.ok && res.status !== 202) throw new Error(d.error ?? 'Start fehlgeschlagen')
      setRunId(d.run.id); setState(d.run.status)
      await poll(d.run.id, d.run.status)
    } catch (e) { setError(String(e)); setState('fehler') } finally { setBusy(false) }
  }

  /** Solange nachfragen, bis fertig — heute treibt der Aufrufer den Lauf. */
  async function poll(id: string, status: string) {
    let s = status
    for (let i = 0; i < 12 && s === 'offen'; i++) {
      const r = await fetch(`/api/agents/runs/${id}`, { method: 'POST' })
      const d = await r.json()
      s = d.run?.status ?? 'fehler'
      setState(s)
    }
    const full = await fetch(`/api/agents/runs/${id}`).then((r) => r.json())
    setData(full)
    setState(full.run?.status ?? s)
    if (full.run?.error) setError(full.run.error)
    setRuns((old) => [{
      id, agent_key: agentKey, status: full.run?.status ?? s, started_at: new Date().toISOString(),
      tokens_in: full.run?.tokens_in ?? 0, tokens_out: full.run?.tokens_out ?? 0,
      amount_eur: String(full.run?.amount_eur ?? 0), org_name: null,
    }, ...old].slice(0, 30))
  }

  async function load(id: string) {
    setRunId(id); setBusy(true); setError(null)
    const full = await fetch(`/api/agents/runs/${id}`).then((r) => r.json())
    setData(full); setState(full.run?.status ?? ''); setBusy(false)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      {/* Auftrag */}
      <aside className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Agent</label>
          <select
            value={agentKey} onChange={(e) => setAgentKey(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {agents.map((a) => <option key={a.key} value={a.key}>{a.title} · v{a.version}</option>)}
          </select>
          {agent?.description && <p className="mt-2 text-[11px] leading-snug text-gray-500">{agent.description}</p>}
          {agent && (
            <div className="mt-3 flex flex-wrap gap-1">
              {agent.steps.map((s) => (
                <span key={s.key} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {s.title ?? s.key}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Organisation</label>
            <select
              value={orgId} onChange={(e) => setOrgId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">— ohne (keine Strategie-Fakten, keine Buchung) —</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <Field label="Zielgruppe" hint="Wer liest das, und was glaubt er heute?">
            <textarea
              rows={3} value={String(form.audience ?? '')} onChange={(e) => set('audience', e.target.value)}
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Inhalte" hint="Rohmaterial, Stichpunkte, Zitate, Zahlen">
            <textarea
              rows={5} value={String(form.inhalte ?? '')} onChange={(e) => set('inhalte', e.target.value)}
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Kontext" hint="Firma, Angebot, Vorgeschichte — Markdown">
            <textarea
              rows={3} value={String(form.context_md ?? '')} onChange={(e) => set('context_md', e.target.value)}
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Überzeugungsziel" hint="Was soll er danach glauben oder tun?">
            <input
              value={String(form.ueberzeugungsziel ?? '')} onChange={(e) => set('ueberzeugungsziel', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Textart">
              <select
                value={String(form.textart ?? 'linkedin')} onChange={(e) => set('textart', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
              >
                {TEXTARTEN.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Ansprache">
              <select
                value={String(form.ansprache ?? 'ihr')} onChange={(e) => set('ansprache', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
              >
                {['du', 'ihr', 'sie'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Länge">
              <input
                type="number"
                value={Number((form.laenge as { wert?: number })?.wert ?? 250)}
                onChange={(e) => set('laenge', { ...(form.laenge as object), wert: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
              />
            </Field>
            <Field label="Einheit">
              <select
                value={String((form.laenge as { einheit?: string })?.einheit ?? 'woerter')}
                onChange={(e) => set('laenge', { ...(form.laenge as object), einheit: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm"
              >
                <option value="woerter">Wörter</option>
                <option value="seiten">Seiten</option>
              </select>
            </Field>
          </div>

          <Field label="Tonalität">
            <input
              value={String(form.tonalitaet ?? '')} onChange={(e) => set('tonalitaet', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox" checked={Boolean(form.recherche)}
              onChange={(e) => set('recherche', e.target.checked)}
            />
            Darf nachsehen (Websuche)
          </label>

          <button
            onClick={start} disabled={busy || !String(form.inhalte ?? '').trim()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Lauf starten
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <BookOpen size={11} /> Wissenspakete
          </div>
          <ul className="mt-2 space-y-1">
            {packs.map((p) => (
              <li key={p.key + String(p.eigen)} className="flex items-center gap-2 text-[12px]">
                <span className="rounded bg-gray-100 px-1.5 text-[10px] text-gray-500">{p.kind}</span>
                <span className="min-w-0 flex-1 truncate text-gray-700">{p.name}</span>
                <span className="text-[10px] text-gray-400">{p.items}</span>
                {p.eigen && <span className="text-[10px] font-bold text-blue-600">eigen</span>}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Lauf */}
      <div className="space-y-4">
        {state && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${
              state === 'fertig' ? 'text-emerald-600' : state === 'fehler' ? 'text-red-600' : 'text-gray-600'}`}>
              {state === 'fertig' ? <CheckCircle2 size={15} /> : state === 'fehler'
                ? <AlertTriangle size={15} /> : <Loader2 size={15} className="animate-spin" />}
              {state}
            </span>
            {Boolean(data?.steps) && (
              <div className="flex flex-wrap gap-1">
                {(data!.steps as Array<Record<string, unknown>>).map((s) => (
                  <span
                    key={String(s.step_key)}
                    className="rounded px-1.5 py-0.5 text-[10px]"
                    style={{
                      background: s.status === 'fertig' ? '#D1FAE5' : s.status === 'fehler' ? '#FEE2E2'
                        : s.status === 'uebersprungen' ? '#F3F4F6' : '#FEF3C7',
                      color: s.status === 'fertig' ? '#065F46' : s.status === 'fehler' ? '#991B1B' : '#6B7280',
                    }}
                    title={s.duration_ms ? `${Math.round(Number(s.duration_ms) / 1000)}s` : ''}
                  >
                    {String(s.step_key)}
                  </span>
                ))}
              </div>
            )}
            {Boolean(data?.run) && (
              <span className="ml-auto text-[11px] text-gray-400">
                {String((data!.run as Record<string, unknown>).tokens_in)}+
                {String((data!.run as Record<string, unknown>).tokens_out)} Tokens
                {Number((data!.run as Record<string, unknown>).amount_eur) > 0
                  ? ` · ${Number((data!.run as Record<string, unknown>).amount_eur).toFixed(2)} €` : ''}
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {Boolean(data?.run) && <Result data={data as Record<string, unknown>} />}

        {!data && (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Letzte Läufe
            </div>
            <ul>
              {runs.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => load(r.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm font-semibold text-gray-800">{r.agent_key}</span>
                    <span className="text-[11px] text-gray-400">{r.org_name ?? '—'}</span>
                    <span className="ml-auto text-[11px] text-gray-400">
                      <Clock size={10} className="mr-1 inline" />
                      {new Date(r.started_at).toLocaleString('de-DE')}
                    </span>
                    <span className={`text-[11px] font-bold ${r.status === 'fertig' ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {r.status}
                    </span>
                    <ChevronRight size={13} className="text-gray-300" />
                  </button>
                </li>
              ))}
              {!runs.length && <li className="px-4 py-8 text-center text-sm text-gray-400">Noch kein Lauf.</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      {hint && <p className="mb-1 text-[10px] text-gray-400">{hint}</p>}
      {children}
    </div>
  )
}

function Result({ data }: { data: Record<string, unknown> }) {
  const run = data.run as Record<string, unknown>
  const out = (run.output ?? {}) as {
    varianten?: Array<Record<string, unknown>>
    annahmen?: string[]
    quellen?: Array<{ title?: string; url?: string }>
    pruefung?: { berichte?: Array<{ ansatz?: string; findings: Array<Record<string, unknown>>; stats: Record<string, number> }> }
  }
  const [open, setOpen] = useState(0)
  const [copied, setCopied] = useState<number | null>(null)
  const variants = out.varianten ?? []
  const reports = out.pruefung?.berichte ?? []

  if (!variants.length) {
    return <pre className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 text-[11px]">
      {JSON.stringify(run.output ?? run.error ?? {}, null, 2)}
    </pre>
  }

  return (
    <div className="space-y-4">
      {Boolean(out.annahmen?.length) && (
        <div className="rounded-xl bg-amber-50 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Angenommen</div>
          <ul className="mt-1 space-y-0.5">
            {out.annahmen!.map((a, i) => <li key={i} className="text-[12px] text-amber-900">{a}</li>)}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        {variants.map((v, i) => {
          const r = reports[i]
          const fehler = r?.stats?.fehler ?? 0
          return (
            <button
              key={i} onClick={() => setOpen(i)}
              className="flex-1 rounded-xl border px-4 py-3 text-left transition-colors"
              style={open === i
                ? { borderColor: '#111827', background: '#fff' }
                : { borderColor: '#E5E7EB', background: '#FAFAF8' }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {String(v.ansatz ?? `Fassung ${i + 1}`)}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                <span>{r?.stats?.woerter ?? 0} Wörter</span>
                {fehler > 0
                  ? <span className="rounded bg-red-100 px-1.5 font-bold text-red-700">{fehler} Fehler</span>
                  : <span className="rounded bg-emerald-100 px-1.5 font-bold text-emerald-700">sauber</span>}
              </div>
            </button>
          )
        })}
      </div>

      {variants[open] && (
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {String(variants[open].titel ?? '')}
              </h3>
              {Boolean(variants[open].worin_anders) && (
                <p className="mt-1 text-[12px] text-gray-500">{String(variants[open].worin_anders)}</p>
              )}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(String(variants[open].text ?? ''))
                setCopied(open); setTimeout(() => setCopied(null), 1500)
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              {copied === open ? <Check size={12} /> : <Copy size={12} />} Kopieren
            </button>
          </div>

          <div className="mt-5 whitespace-pre-wrap text-[15px] leading-[1.75] text-gray-800">
            {String(variants[open].text ?? '')}
          </div>

          {Boolean(reports[open]?.findings?.length) && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Befunde</div>
              <ul className="mt-2 space-y-1.5">
                {reports[open].findings.map((f, i) => (
                  <li key={i} className="text-[12px]">
                    <span className={`font-bold ${f.severity === 'fehler' ? 'text-red-600' : 'text-amber-600'}`}>
                      {String(f.rule)}
                    </span>
                    <span className="text-gray-500"> · {String(f.quote)}</span>
                    <span className="block text-gray-400">{String(f.hint)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Boolean(out.quellen?.length) && (
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quellen</div>
              <ul className="mt-2 space-y-1">
                {out.quellen!.slice(0, 10).map((q, i) => (
                  <li key={i} className="truncate text-[11px]">
                    <a href={q.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {q.title || q.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}
    </div>
  )
}
