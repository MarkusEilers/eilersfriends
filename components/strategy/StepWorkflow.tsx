'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Eye, Check, RotateCcw } from 'lucide-react'
import { transitionStepAction } from '@/lib/actions/strategy'
import type { StepStatus } from './StatusBadge'

/** Freigabe-Workflow: Kunde reicht ein, Coach prüft und gibt frei. */
export function StepWorkflow({ stateId, status, isCoach }: { stateId: string; status: StepStatus; isCoach: boolean }) {
  const [pending, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [askNote, setAskNote] = useState(false)
  const router = useRouter()

  function go(to: StepStatus, n?: string) {
    setErr(null)
    start(async () => {
      try { await transitionStepAction(stateId, to, n); setAskNote(false); setNote(''); router.refresh() }
      catch (e) { setErr(e instanceof Error ? e.message : String(e)) }
    })
  }

  const btn = 'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {(status === 'in_progress' || status === 'available' || status === 'changes_requested') && (
          <button type="button" disabled={pending} onClick={() => go('submitted')}
            className={`${btn} text-white`} style={{ backgroundColor: '#1A5FD4' }}>
            <Send size={14} /> Zur Prüfung einreichen
          </button>
        )}

        {isCoach && status === 'submitted' && (
          <button type="button" disabled={pending} onClick={() => go('in_review')}
            className={`${btn} text-white`} style={{ backgroundColor: '#6D28D9' }}>
            <Eye size={14} /> Prüfung starten
          </button>
        )}

        {isCoach && status === 'in_review' && (
          <>
            <button type="button" disabled={pending} onClick={() => go('approved')}
              className={`${btn} text-white`} style={{ backgroundColor: '#067647' }}>
              <Check size={14} /> Freigeben
            </button>
            <button type="button" disabled={pending} onClick={() => setAskNote(true)}
              className={`${btn} border border-gray-200 bg-white text-gray-700`}>
              <RotateCcw size={14} /> Überarbeitung erbitten
            </button>
          </>
        )}

        {status === 'approved' && (
          <button type="button" disabled={pending} onClick={() => go('in_progress')}
            className={`${btn} border border-gray-200 bg-white text-gray-600`}>
            Wieder öffnen
          </button>
        )}
      </div>

      {askNote && (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} autoFocus
            placeholder="Was soll überarbeitet werden?"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={pending || !note.trim()} onClick={() => go('changes_requested', note)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40" style={{ backgroundColor: '#B42318' }}>
              Zurück an das Team
            </button>
            <button type="button" onClick={() => setAskNote(false)} className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-600">Abbrechen</button>
          </div>
        </div>
      )}

      {err && <p className="text-xs font-semibold text-red-600">{err}</p>}
    </div>
  )
}
