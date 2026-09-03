'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Loader2, Flag, CheckCircle2 } from 'lucide-react'
import type { Author } from '@/lib/blog/authors'

interface C { id: string; parent_id: string | null; author_name: string; body: string; created_at: string }

const when = (s: string) =>
  new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

const initials = (n: string) =>
  n.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')

export function Comments({ postId, author, open }: { postId: string; author: Author; open: boolean }) {
  const [list, setList] = useState<C[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const started = useRef(Date.now())

  useEffect(() => {
    fetch(`/api/blog/comments?postId=${postId}`).then((r) => r.json())
      .then((d) => d.ok && setList(d.comments)).catch(() => {})
  }, [postId])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId, name, email, text,
          website: (document.getElementById('ef-website') as HTMLInputElement)?.value ?? '',
          startedAt: started.current,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setMessage(d.message)
      setState('done')
      if (d.status === 'freigegeben') {
        setList((l) => [...l, {
          id: crypto.randomUUID(), parent_id: null, author_name: name, body: text,
          created_at: new Date().toISOString(),
        }])
      }
      setText('')
    } catch (err) { setMessage(String(err)); setState('error') }
  }

  return (
    <section className="mx-auto max-w-[680px] px-6 pb-10">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
        <MessageSquare size={13} /> {list.length > 0 ? `${list.length} Kommentare` : 'Kommentare'}
      </h2>

      <ul className="mt-5 space-y-5">
        {list.map((c) => (
          <li key={c.id} className="flex gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: author.tint, color: author.accent }}
            >
              {initials(c.author_name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-gray-900">{c.author_name}</span>
                <span className="text-gray-400">{when(c.created_at)}</span>
                <button
                  onClick={() => fetch('/api/blog/comments', {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: c.id }),
                  })}
                  title="Melden"
                  className="ml-auto text-gray-300 transition-colors hover:text-gray-600"
                >
                  <Flag size={11} />
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700">{c.body}</p>
            </div>
          </li>
        ))}
        {list.length === 0 && (
          <li className="text-sm text-gray-400">Noch kein Kommentar. Der erste ist immer der schwerste.</li>
        )}
      </ul>

      {!open ? (
        <p className="mt-8 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
          Zu diesem Beitrag sind Kommentare geschlossen.
        </p>
      ) : state === 'done' ? (
        <div className="mt-8 flex items-center gap-2 rounded-xl p-4 text-sm font-semibold"
             style={{ background: author.tint, color: author.accent }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      ) : (
        <form onSubmit={send} className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm font-bold text-gray-900">Etwas dazu zu sagen?</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              required value={name} onChange={(e) => setName(e.target.value)} placeholder="Dein Name"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail (wird nicht angezeigt)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>
          {/* Honigtopf: Menschen sehen dieses Feld nicht, Skripte fuellen es aus. */}
          <input
            id="ef-website" name="website" tabIndex={-1} autoComplete="off"
            aria-hidden style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
          />
          <textarea
            required value={text} onChange={(e) => setText(e.target.value)} rows={4}
            placeholder="Dein Kommentar"
            className="mt-2 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit" disabled={state === 'sending'}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: author.accent }}
            >
              {state === 'sending' && <Loader2 size={14} className="animate-spin" />} Abschicken
            </button>
            <p className="text-[11px] leading-snug text-gray-400">
              Name und Text werden öffentlich sichtbar. Die E-Mail-Adresse nicht — sie dient nur der Antwort.
            </p>
          </div>
          {state === 'error' && <p className="mt-2 text-xs text-red-600">{message}</p>}
        </form>
      )}
    </section>
  )
}
