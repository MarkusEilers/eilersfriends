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

function s(v: unknown): string { return v == null ? '' : String(v) }

export function StepSummary({ stepKey, answers, onEdit }: Props) {
  const a = answers ?? {}

  if (stepKey === '00-welcome') {
    const org = s(a.organisationName)
    const web = s(a.website)
    const summary = s(a.summary)
    const valueProp = s(a.valueProposition)
    const audience = s(a.targetAudience)
    const tone = s(a.tone)
    const keywords = Array.isArray(a.keywords) ? a.keywords.map((k) => String(k)).filter(Boolean) : []
    return (
      <div className="space-y-4 max-w-prose">
        <DoneHeader onEdit={onEdit} />
        <div className="grid gap-3 sm:grid-cols-2 text-sm leading-relaxed text-gray-800">
          {org ? <Field label="Organisation" value={org} /> : null}
          {web ? <Field label="Website" value={web} /> : null}
          {summary ? <Field label="Summary" value={summary} full /> : null}
          {valueProp ? <Field label="Value Proposition" value={valueProp} full /> : null}
          {audience ? <Field label="Target Audience" value={audience} /> : null}
          {tone ? <Field label="Tone" value={tone} /> : null}
        </div>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {keywords.map((k, i) => (
              <span key={k + '-' + i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: '#FFF1EB', color: '#F05A1A' }}>{k}</span>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  if (stepKey === '01-was-in-die-box') {
    const list = (Array.isArray(a.items) ? a.items : []) as { name: string; description: string }[]
    return (
      <div className="space-y-4 max-w-prose">
        <DoneHeader onEdit={onEdit} />
        <ol className="space-y-3">
          {list.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                {item.description ? <p className="text-[11px] text-gray-600 mt-0.5">{item.description}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  if (stepKey === '02-beef-radar' || stepKey === '01-beef-radar') {
    const cards = (Array.isArray(a.cards) ? a.cards : []) as Card[]
    const grouped: Record<'what' | 'how' | 'why', Card[]> = { what: [], how: [], why: [] }
    cards.forEach((c) => { if (c && c.column) grouped[c.column].push(c) })
    const offerDesc = s(a.offerDescription)
    return (
      <div className="space-y-5 max-w-3xl">
        <DoneHeader onEdit={onEdit} />
        {offerDesc ? (
          <p className="text-sm italic text-gray-600 leading-relaxed border-l-2 border-gray-200 pl-3">{offerDesc}</p>
        ) : null}
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
                    {c.detail ? <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{c.detail}</p> : null}
                  </li>
                ))}
                {grouped[col].length === 0 ? <li className="text-[11px] italic text-gray-400">—</li> : null}
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
      {onEdit ? (
        <button onClick={onEdit} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#F05A1A' }}>
          <Pencil size={10} /> Review & Edit
        </button>
      ) : null}
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
