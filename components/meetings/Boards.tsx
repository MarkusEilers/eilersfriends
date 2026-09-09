'use client'

import { useCallback, useMemo, useState } from 'react'
import { Plus, MessageSquare, Clock, User, X, Loader2, History, AlertTriangle } from 'lucide-react'

export interface Column {
  id: string; key: string; name: string; sort: number; color: string | null; is_done: boolean
}
export interface Card {
  id: string; board_id: string; column_id: string | null
  title: string; body: string | null
  assignee_contact_id: string | null; assignee_name: string | null
  due_date: string | null; sort: number; version: number
  carried_count: number; closed_at: string | null; comment_count: number
}
export interface Board { id: string; kind: string; name: string; sort: number; columns: Column[]; cards: Card[] }

interface Props {
  boards: Board[]
  seriesId: string
  meetingId: string
  /** Persoenlicher Zugang aus der Einladung — fehlt er, laeuft es ueber die Anmeldung. */
  token?: string | null
  readOnly?: boolean
}

/**
 * Die beiden Bretter.
 *
 * Sie gehoeren dem Strang, nicht dem Termin. Was hier bewegt wird, steht beim
 * naechsten Mal an der neuen Stelle — ohne dass jemand etwas uebertraegt.
 */
export function Boards({ boards: initial, seriesId, meetingId, token, readOnly }: Props) {
  const [boards, setBoards] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)
  const [open, setOpen] = useState<Card | null>(null)
  const [adding, setAdding] = useState<{ boardId: string; columnId: string } | null>(null)

  const api = useCallback(async (body: Record<string, unknown>) => {
    const url = `/api/meetings/board${token ? `?t=${token}` : ''}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'x-meeting-token': token } : {}) },
      body: JSON.stringify({ ...body, meetingId, seriesId }),
    })
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) }
  }, [token, meetingId, seriesId])

  const reload = useCallback(async () => {
    if (!token) { window.location.reload(); return }
    const d = await fetch(`/api/meetings/board?t=${token}`).then((r) => r.json())
    if (d.ok) { setBoards(d.boards); setConflict(null) }
  }, [token])

  async function move(card: Card, columnId: string) {
    if (readOnly || card.column_id === columnId) return
    const before = boards
    // Sofort umlegen, damit sich die Oberflaeche nicht wie ein Formular anfuehlt.
    setBoards((bs) => bs.map((b) => ({
      ...b,
      cards: b.cards.map((c) => (c.id === card.id ? { ...c, column_id: columnId, version: c.version + 1 } : c)),
    })))
    setBusy(card.id)
    const res = await api({ action: 'move', cardId: card.id, columnId, version: card.version })
    setBusy(null)
    if (res.status === 409) {
      setBoards(before)
      setConflict(card.title)
      return
    }
    if (!res.ok) setBoards(before)
    const done = boards.flatMap((b) => b.columns).find((c) => c.id === columnId)?.is_done
    if (done) setBoards((bs) => bs.map((b) => ({ ...b, cards: b.cards.filter((c) => c.id !== card.id) })))
  }

  async function add(boardId: string, columnId: string, title: string) {
    if (!title.trim()) return
    setBusy('neu')
    const res = await api({ action: 'add', boardId, columnId, title })
    setBusy(null)
    setAdding(null)
    if (res.ok) {
      setBoards((bs) => bs.map((b) => b.id === boardId ? {
        ...b,
        cards: [...b.cards, {
          id: String(res.data.id), board_id: boardId, column_id: columnId, title,
          body: null, assignee_contact_id: null, assignee_name: null, due_date: null,
          sort: 9999, version: 1, carried_count: 0, closed_at: null, comment_count: 0,
        }],
      } : b))
    }
  }

  return (
    <div className="space-y-6">
      {conflict && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle size={15} />
          <span>Jemand war schneller bei „{conflict}“.</span>
          <button onClick={reload} className="ml-auto font-bold underline">Neu laden</button>
        </div>
      )}

      {boards.map((board) => (
        <section key={board.id}>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{board.name}</h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${board.columns.length}, minmax(0, 1fr))` }}>
            {board.columns.map((col) => {
              const cards = board.cards.filter((c) => c.column_id === col.id).sort((a, b) => a.sort - b.sort)
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => { if (!readOnly) e.preventDefault() }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const id = e.dataTransfer.getData('text/plain')
                    const card = board.cards.find((c) => c.id === id)
                    if (card) void move(card, col.id)
                  }}
                  className="rounded-xl border border-gray-200 bg-gray-50/60 p-2"
                >
                  <div className="flex items-center gap-1.5 px-1.5 pb-2 pt-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: col.color ?? '#9CA3AF' }} />
                    <span className="text-[11px] font-bold text-gray-600">{col.name}</span>
                    <span className="ml-auto text-[11px] tabular-nums text-gray-400">{cards.length}</span>
                  </div>

                  <div className="space-y-1.5">
                    {cards.map((card) => (
                      <article
                        key={card.id}
                        draggable={!readOnly}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', card.id)}
                        onClick={() => setOpen(card)}
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="text-[13px] font-semibold leading-snug text-gray-900">{card.title}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
                          {card.assignee_name && (
                            <span className="inline-flex items-center gap-1"><User size={9} />{card.assignee_name}</span>
                          )}
                          {card.due_date && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={9} />{new Date(card.due_date).toLocaleDateString('de-DE')}
                            </span>
                          )}
                          {card.comment_count > 0 && (
                            <span className="inline-flex items-center gap-1"><MessageSquare size={9} />{card.comment_count}</span>
                          )}
                          {card.carried_count > 1 && (
                            <span className="rounded bg-amber-50 px-1 font-bold text-amber-700" title="läuft seit mehreren Terminen mit">
                              {card.carried_count}×
                            </span>
                          )}
                          {busy === card.id && <Loader2 size={9} className="animate-spin" />}
                        </div>
                      </article>
                    ))}
                  </div>

                  {!readOnly && (
                    adding?.columnId === col.id ? (
                      <input
                        autoFocus
                        placeholder="Titel und Enter"
                        onBlur={() => setAdding(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void add(board.id, col.id, (e.target as HTMLInputElement).value)
                          if (e.key === 'Escape') setAdding(null)
                        }}
                        className="mt-1.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-[12px] outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => setAdding({ boardId: board.id, columnId: col.id })}
                        className="mt-1.5 flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 hover:bg-white hover:text-gray-700"
                      >
                        <Plus size={11} /> Karte
                      </button>
                    )
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {open && (
        <CardDialog
          card={open} boards={boards} token={token} readOnly={readOnly}
          onClose={() => setOpen(null)}
          onMove={(colId) => { void move(open, colId); setOpen(null) }}
          api={api}
        />
      )}
    </div>
  )
}

function CardDialog({
  card, boards, token, readOnly, onClose, onMove, api,
}: {
  card: Card; boards: Board[]; token?: string | null; readOnly?: boolean
  onClose: () => void; onMove: (columnId: string) => void
  api: (body: Record<string, unknown>) => Promise<{ ok: boolean; status: number; data: Record<string, unknown> }>
}) {
  const board = boards.find((b) => b.id === card.board_id)
  const [history, setHistory] = useState<Array<Record<string, unknown>> | null>(null)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)

  const loadHistory = async () => {
    const url = `/api/meetings/board?card=${card.id}${token ? `&t=${token}` : ''}`
    const d = await fetch(url, { headers: token ? { 'x-meeting-token': token } : {} }).then((r) => r.json())
    setHistory(d.history ?? [])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug text-gray-900">{card.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        {card.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{card.body}</p>}

        {card.carried_count > 1 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            Läuft seit {card.carried_count} Terminen mit.
          </p>
        )}

        {!readOnly && board && (
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Verschieben nach</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {board.columns.filter((c) => c.id !== card.column_id).map((c) => (
                <button
                  key={c.id} onClick={() => onMove(c.id)}
                  className="rounded-full border px-3 py-1.5 text-[11px] font-semibold"
                  style={{ borderColor: `${c.color ?? '#9CA3AF'}55`, color: c.color ?? '#6B7280' }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {!readOnly && (
          <div className="mt-4">
            <textarea
              value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
              placeholder="Anmerkung — bleibt an der Karte, auch über Termine hinweg"
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
            <button
              onClick={async () => {
                if (!comment.trim()) return
                setSending(true)
                await api({ action: 'comment', cardId: card.id, text: comment })
                setSending(false); setComment(''); void loadHistory()
              }}
              disabled={sending}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {sending && <Loader2 size={12} className="animate-spin" />} Anmerken
            </button>
          </div>
        )}

        <button
          onClick={() => (history ? setHistory(null) : void loadHistory())}
          className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-gray-900"
        >
          <History size={12} /> {history ? 'Verlauf ausblenden' : 'Verlauf'}
        </button>
        {history && (
          <ul className="mt-2 space-y-1.5 border-t border-gray-100 pt-2">
            {history.map((h, i) => (
              <li key={i} className="text-[11px] text-gray-500">
                <span className="text-gray-400">{new Date(String(h.created_at)).toLocaleString('de-DE')}</span>{' '}
                <span className="font-semibold text-gray-700">{String(h.actor_name ?? 'jemand')}</span>{' '}
                {String(h.kind)}
                {h.from_name || h.to_name ? ` · ${String(h.from_name ?? '—')} → ${String(h.to_name ?? '—')}` : ''}
                {h.comment ? <span className="block pl-3 italic text-gray-600">{String(h.comment)}</span> : null}
              </li>
            ))}
            {!history.length && <li className="text-[11px] text-gray-400">Noch nichts passiert.</li>}
          </ul>
        )}
      </div>
    </div>
  )
}
