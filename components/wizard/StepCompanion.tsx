'use client'

import { useState } from 'react'
import { Lightbulb, Target, Wrench, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { getCompanion } from '@/lib/wizard/companion-content'

interface Props { stepKey: string }

export function StepCompanion({ stepKey }: Props) {
  const c = getCompanion(stepKey)
  const [open, setOpen] = useState(true)
  if (!c) return null

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-orange-50/40 p-5 sm:p-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#FFF1EB' }}>
            <Lightbulb size={16} style={{ color: '#F05A1A' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Schritt verstehen</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{c.hook}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-2" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-2" />}
      </button>

      {open && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-gray-700" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700">Warum dieser Schritt wichtig ist</p>
            </div>
            <p className="text-xs leading-relaxed text-gray-700">{c.why}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={14} className="text-blue-700" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Wie er funktioniert</p>
            </div>
            <p className="text-xs leading-relaxed text-gray-700">{c.how}</p>
          </div>
          <div className="rounded-xl border border-orange-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-orange-700" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Wie die AI hier hilft</p>
            </div>
            <p className="text-xs leading-relaxed text-gray-700">{c.ai}</p>
          </div>
        </div>
      )}
    </div>
  )
}
