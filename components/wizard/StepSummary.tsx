'use client'

import { CheckCircle2, Pencil } from 'lucide-react'

interface Card { column: 'what' | 'how' | 'why'; text: string; detail?: string }

const COL = {
  what: { color: '#4B5563', label: 'WAS' },
  how: { color: '#1A5FD4', label: 'WIE' },
  why: { color: '#F05A1A', label: 'WARUM' },
}

interface Props {
  stepKey: string
  answers: Record<string, unknown>
  onEdit?: () => void
}

export function StepSummary({ stepKey, answers, onEdit }: Props) {
  const a = answers ?? {}

  if (stepKey === '00-welcome') {
    return (
      <div className="space-y-4 max-w-prose">
        <DoneHeader onEdit={onEdit} />
        <div className="grid gap-3 sm:grid-cols-2 text-sm leading-relaxed text-gray-800">
          {a.organisationName && <Field label="Organisation" value={String(a.organisationName)} />}
          {a.website && <Field label="Website" value={String(a.website)} />}
          {a.summary && <Field label="Summary" value={String(a.summary)} full />}
          {a.valueProposition && <Field label="Value Proposition" value={String(a.valueProposition)} full />}
          {a.targetAudience && <Field label="Target Audience" value={String(a.targetAudience)} />}
          {a.tone && <Field label="Tone" value={String(a.tone)} />}
        </div>
        {Array.isArray(a.keywords) && a.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {a.keywords.map((k, i) => (
              <span key={String(k) + '-' + i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#FFF1EB', color: '#F05A1A' }}>{String(k)}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (stepKey === '01-beef-radar') {
    const cards = (Array.isArray(a.cards) ? a.cards : []) as Card[]
    const grouped: Record<'what' | 'how' | 'why', Card[]> = { what: [], how: [], why: [] }
    cards.forEach((c) => { if (c.column) grouped[c.column].push(c) })
    return (
      <div className="space-y-5 max-w-3xl">
        <DoneHeader onEdit={onEdit} />
        {a.offerDescription && (
          <p className="text-sm italic text-gray-600 leading-relaxed border-l-2 border-gray-200 pl-3">
            {String(a.offerDescription)}
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-3">
          {(['what','how','why'] as const).map((col) => (
            <div key={col}>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2 pb-1.5 border-b" style={{ color: COL[col].color, borderColor: COL[col].color + '40' }}>
                {COL[col].label}
              </h4>
              <ul className="space-y-2">
                {grouped[col].map((c, i) => (
                  <li key={i}>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{c.text}</p>
                    {c.detail && <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{c.detail}</p>}
                  </li>
                ))}
                {grouped[col].length === 0 && <li className="text-[11px] italic text-gray-400">—</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-prose">
      <DoneHeader onEdit={onEdit} />
      <pre className="text-xs leading-relaxed text-gray-700 bg-gray-50 rounded p-3 overflow-x-auto">{JSON.stringify(a, null, 2)}</pre>
    </div>
  )
}

function DoneHeader({ onEdit }: { onEdit?: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-800">
        <CheckCircle2 size={11} /> Done
      </span>
      {onEdit && (
        <button onClick={onEdit} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#F05A1A' }}>
          <Pencil size={10} /> Review & Edit
        </button>
      )}
    </div>
  )
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#F05A1A' }}>{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-gray-800 break-words">{value}</p>
    </div>
  )
}
