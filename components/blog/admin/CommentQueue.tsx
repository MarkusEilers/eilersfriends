'use client'

import { useState } from 'react'
import { Check, X, Ban, ShieldAlert, Loader2, Plus, Trash2 } from 'lucide-react'

interface QueueItem {
  id: string; author_name: string; author_email: string; body: string
  score: number; flags: Array<{ rule: string; kind: string }>
  created_at: string; post_title: string; post_slug: string; reported_count: number
}
interface Rule { id: string; kind: string; pattern: string; is_regex: boolean; note: string | null }

const KIND_LABEL: Record<string, { title: string; hint: string; color: string }> = {
  sperre: { title: 'Sperrliste', hint: 'wird abgelehnt und erscheint nie', color: '#DC2626' },
  pruefung: { title: 'Prüfliste', hint: 'wird zurückgehalten und wartet auf Euch', color: '#D97706' },
  freundeskreis: { title: 'Freundeskreis', hint: 'geht immer durch', color: '#059669' },
}

export function CommentQueue({ initialQueue, initialRules }: { initialQueue: QueueItem[]; initialRules: Rule[] }) {
  const [items, setItems] = useState(initialQueue)
  const [rules, setRules] = useState(initialRules)
  const [busy, setBusy] = useState<string | null>(null)
  const [tab, setTab] = useState<'queue' | 'rules'>('queue')

  async function act(id: string, status: string) {
    setBusy(id)
    try {
      await fetch('/api/admin/blog/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      setItems((x) => x.filter((i) => i.id !== id))
    } finally { setBusy(null) }
  }

  async function addRule(kind: string, pattern: string, isRegex: boolean, note: string) {
    const res = await fetch('/api/admin/blog/comments', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, pattern, isRegex, note }),
    })
    const d = await res.json()
    if (d.rules) setRules(d.rules)
  }

  async function dropRule(id: string) {
    await fetch('/api/admin/blog/comments', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    setRules((r) => r.filter((x) => x.id !== id))
  }

  return (
    <div>
      <div className="mb-5 flex gap-2">
        {(['queue', 'rules'] as const).map((t) => (
          <button
            key={t} onClick={() => setTab(t)}
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={tab === t ? { background: '#111827', color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
          >
            {t === 'queue' ? `Wartet (${items.length})` : `Wortlisten (${rules.length})`}
          </button>
        ))}
      </div>

      {tab === 'queue' ? (
        items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-400">
            Nichts wartet. So soll es sein.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((c) => (
              <li key={c.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{c.author_name}</span>
                  <span>{c.author_email}</span>
                  <span className="text-gray-300">·</span>
                  <span>{new Date(c.created_at).toLocaleString('de-DE')}</span>
                  <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
                    Verdacht {c.score}
                  </span>
                  {c.reported_count > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700">
                      {c.reported_count}× gemeldet
                    </span>
                  )}
                </div>

                <div className="mt-1 text-[11px] text-gray-400">zu: {c.post_title}</div>

                <p className="mt-3 whitespace-pre-wrap border-l-2 border-gray-200 pl-4 text-[15px] leading-relaxed text-gray-700">
                  {c.body}
                </p>

                {c.flags?.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {c.flags.map((f, i) => (
                      <li key={i} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                        {f.rule} <span className="font-normal text-amber-500">({f.kind})</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => act(c.id, 'freigegeben')} disabled={busy === c.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Freigeben
                  </button>
                  <button
                    onClick={() => act(c.id, 'abgelehnt')} disabled={busy === c.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    <X size={13} /> Ablehnen
                  </button>
                  <button
                    onClick={() => act(c.id, 'spam')} disabled={busy === c.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                  >
                    <Ban size={13} /> Spam
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-5">
          {Object.entries(KIND_LABEL).map(([kind, meta]) => (
            <div key={kind} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert size={14} style={{ color: meta.color }} />
                <span className="text-sm font-bold text-gray-900">{meta.title}</span>
                <span className="text-xs text-gray-400">{meta.hint}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {rules.filter((r) => r.kind === kind).map((r) => (
                  <li key={r.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <code className="text-[12px] text-gray-800">{r.pattern}</code>
                    {r.is_regex && <span className="rounded bg-gray-200 px-1 text-[10px] text-gray-600">Muster</span>}
                    {r.note && <span className="text-[11px] text-gray-400">{r.note}</span>}
                    <button onClick={() => dropRule(r.id)} className="ml-auto text-gray-300 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
                {!rules.some((r) => r.kind === kind) && (
                  <li className="text-[12px] text-gray-400">Noch nichts eingetragen.</li>
                )}
              </ul>
              <RuleForm kind={kind} color={meta.color} onAdd={addRule} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RuleForm({
  kind, color, onAdd,
}: { kind: string; color: string; onAdd: (k: string, p: string, r: boolean, n: string) => Promise<void> }) {
  const [pattern, setPattern] = useState('')
  const [note, setNote] = useState('')
  const [isRegex, setIsRegex] = useState(false)
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Wort oder Muster"
        className="min-w-[160px] flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
      />
      <input
        value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notiz"
        className="min-w-[120px] flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
      />
      <label className="flex items-center gap-1 text-[11px] text-gray-500">
        <input type="checkbox" checked={isRegex} onChange={(e) => setIsRegex(e.target.checked)} /> Muster
      </label>
      <button
        onClick={async () => { if (pattern.trim()) { await onAdd(kind, pattern.trim(), isRegex, note); setPattern(''); setNote('') } }}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
        style={{ background: color }}
      >
        <Plus size={12} /> Aufnehmen
      </button>
    </div>
  )
}
