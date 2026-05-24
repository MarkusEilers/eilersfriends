'use client'

import { getCompanion } from '@/lib/wizard/companion-content'

interface Props { stepKey: string; compact?: boolean }

export function StepCompanion({ stepKey, compact }: Props) {
  const c = getCompanion(stepKey)
  if (!c) return null
  return (
    <div className={`max-w-prose ${compact ? 'space-y-4' : 'space-y-7'}`}>
      <p className={`leading-relaxed text-gray-800 ${compact ? 'text-sm' : 'text-base'}`} style={{ fontFamily: 'var(--font-serif)' }}>
        {c.hook}
      </p>
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Warum dieser Schritt wichtig ist</h3>
        <p className={`leading-relaxed text-gray-800 ${compact ? 'text-xs' : 'text-sm'}`}>{c.why}</p>
      </section>
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Wie er funktioniert</h3>
        <p className={`leading-relaxed text-gray-800 ${compact ? 'text-xs' : 'text-sm'}`}>{c.how}</p>
      </section>
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Wie die AI hier hilft</h3>
        <p className={`leading-relaxed text-gray-800 ${compact ? 'text-xs' : 'text-sm'}`}>{c.ai}</p>
      </section>
    </div>
  )
}
