'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Lock } from 'lucide-react'
import { addCommentAction } from '@/lib/actions/strategy'

interface C { id: string; body: string; author_name?: string | null; author_avatar?: string | null; is_internal?: boolean; created_at?: string }

function initials(n?: string | null) { return (n ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() }

/** Kommentar-Spalte — Kunde und Coach im Dialog, plus interne Notizen fürs Coach-Team. */
export function CommentPanel({ stateId, comments, isCoach }: { stateId: string; comments: C[]; isCoach: boolean }) {
  const [body, setBody] = useState('')
  const [internal, setInternal] = useState(false)
  const [pending, start] = useTransition()
  const router = useRouter()

  function send() {
    if (!body.trim()) return
    start(async () => { await addCommentAction(stateId, body, internal); setBody(''); router.refresh() })
  }

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white">
      <header className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
        <MessageCircle size={15} style={{ color: '#1A5FD4' }} />
        <h3 className="text-sm font-bold text-gray-900">Austausch</h3>
        <span className="ml-auto text-xs text-gray-400">{comments.length}</span>
      </header>

      <div className="max-h-[26rem] space-y-4 overflow-auto px-5 py-4">
        {comments.length === 0 && <p className="text-xs text-gray-400">Noch keine Kommentare. Fragen gehören hierher — das Coach-Team liest mit.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: c.is_internal ? '#6D28D9' : '#1A5FD4' }}>
              {initials(c.author_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                {c.author_name ?? 'Unbekannt'}
                {c.is_internal && <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700"><Lock size={9} /> intern</span>}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 p-4">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
          placeholder="Kommentar schreiben …"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={send} disabled={pending || !body.trim()}
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40" style={{ backgroundColor: '#1A5FD4' }}>
            {pending ? 'Senden …' : 'Senden'}
          </button>
          {isCoach && (
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="h-3.5 w-3.5" />
              nur intern
            </label>
          )}
        </div>
      </div>
    </aside>
  )
}
