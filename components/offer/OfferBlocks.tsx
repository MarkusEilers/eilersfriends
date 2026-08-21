import { Check, Quote as QuoteIcon, HelpCircle, Circle } from 'lucide-react'
import type { OfferBlock, ProgramStepGroup } from '@/lib/db/queries/offer-blocks'

const INK = '#0D0D0B'
const ACCENT = '#1A5FD4'

interface TrustItem { name: string; src?: string | null; quote?: string | null; author?: string | null; result?: string | null }
interface MetricRow { label: string; value: string; strong?: boolean }
interface FaqItem { question: string; answer: string }

/** Absätze aus Freitext — Zeilenumbrüche bleiben erhalten. */
function Prose({ text }: { text?: string | null }) {
  if (!text) return null
  return (
    <div className="space-y-3">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-wrap text-base leading-relaxed" style={{ color: '#374151' }}>{p}</p>
      ))}
    </div>
  )
}

function Shell({ title, subtitle, tone = 'light', children }:
  { title?: string | null; subtitle?: string | null; tone?: 'light' | 'tint' | 'dark'; children: React.ReactNode }) {
  const bg = tone === 'dark' ? '#0F1E3A' : tone === 'tint' ? '#F0F5FF' : '#FAFAF8'
  const fg = tone === 'dark' ? '#fff' : INK
  return (
    <section className="px-6 py-16" style={{ backgroundColor: bg }}>
      <div className="mx-auto max-w-4xl">
        {title && <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: fg }}>{title}</h2>}
        {subtitle && <p className="mt-1.5 text-sm" style={{ color: tone === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280' }}>{subtitle}</p>}
        <div className={title || subtitle ? 'mt-6' : ''}>{children}</div>
      </div>
    </section>
  )
}

/** Ein Block — Darstellung richtet sich nach kind. */
export function OfferBlockView({ block, programSteps }: { block: OfferBlock; programSteps?: ProgramStepGroup[] }) {
  const d = (block.data ?? {}) as Record<string, unknown>

  switch (block.kind) {
    case 'richtext':
      return <Shell title={block.title} subtitle={block.subtitle}><Prose text={block.body} /></Shell>

    case 'bullets': {
      const items = (d.items as { text: string; label?: string }[] | undefined) ?? []
      return (
        <Shell title={block.title} subtitle={block.subtitle}>
          <Prose text={block.body} />
          <ul className={`space-y-3 ${block.body ? 'mt-5' : ''}`}>
            {items.map((it, i) => (
              <li key={i} className="flex gap-3 text-base leading-relaxed" style={{ color: '#374151' }}>
                <Check size={17} className="mt-1 flex-shrink-0" style={{ color: ACCENT }} />
                <span>{it.label ? <strong style={{ color: INK }}>{it.label} </strong> : null}{it.text}</span>
              </li>
            ))}
          </ul>
        </Shell>
      )
    }

    case 'checklist': {
      const items = (d.items as string[] | undefined) ?? []
      const note = d.note as string | undefined
      return (
        <Shell title={block.title} subtitle={block.subtitle} tone="tint">
          <Prose text={block.body} />
          <ul className={`space-y-2.5 ${block.body ? 'mt-5' : ''}`}>
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border bg-white px-4 py-3"
                style={{ borderColor: '#DBE6FF' }}>
                <Circle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#BBCFF5' }} />
                <span className="text-sm leading-relaxed" style={{ color: '#374151' }}>{it}</span>
              </li>
            ))}
          </ul>
          {note && <p className="mt-5 text-base font-semibold" style={{ color: INK }}>{note}</p>}
        </Shell>
      )
    }

    case 'metrics': {
      const groups = (d.groups as { heading?: string; note?: string; rows: MetricRow[] }[] | undefined)
        ?? [{ rows: (d.rows as MetricRow[] | undefined) ?? [] }]
      return (
        <Shell title={block.title} subtitle={block.subtitle}>
          <Prose text={block.body} />
          <div className={`space-y-7 ${block.body ? 'mt-6' : ''}`}>
            {groups.map((g, gi) => (
              <div key={gi}>
                {g.heading && <h3 className="mb-2.5 text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{g.heading}</h3>}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {(g.rows ?? []).map((r, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-4 border-b border-gray-100 px-5 py-3 last:border-0"
                      style={r.strong ? { backgroundColor: '#F5F8FF' } : undefined}>
                      <span className={`text-sm ${r.strong ? 'font-bold' : ''}`} style={{ color: r.strong ? INK : '#4B5563' }}>{r.label}</span>
                      <span className={`flex-shrink-0 tabular-nums ${r.strong ? 'text-lg font-bold' : 'text-sm font-semibold'}`} style={{ color: INK }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                {g.note && <p className="mt-2 text-xs italic" style={{ color: '#9CA3AF' }}>{g.note}</p>}
              </div>
            ))}
          </div>
        </Shell>
      )
    }

    case 'quote':
      return (
        <Shell title={block.title} subtitle={block.subtitle}>
          <div className="rounded-3xl border-l-4 bg-white p-7" style={{ borderColor: ACCENT, boxShadow: '0 4px 20px rgba(15,30,58,0.05)' }}>
            <QuoteIcon size={20} style={{ color: '#BBCFF5' }} />
            <div className="mt-3"><Prose text={block.body} /></div>
            {d.author ? <p className="mt-4 text-sm font-semibold" style={{ color: '#6B7280' }}>— {String(d.author)}</p> : null}
          </div>
        </Shell>
      )

    case 'faq': {
      const items = (d.items as FaqItem[] | undefined) ?? []
      return (
        <Shell title={block.title ?? 'Häufige Fragen'} subtitle={block.subtitle}>
          <div className="space-y-3">
            {items.map((f, i) => (
              <details key={i} className="group rounded-2xl border border-gray-200 bg-white px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-start gap-3 text-sm font-bold" style={{ color: INK }}>
                  <HelpCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
                  {f.question}
                </summary>
                <div className="mt-3 pl-7"><Prose text={f.answer} /></div>
              </details>
            ))}
          </div>
        </Shell>
      )
    }

    case 'trustbar': {
      const items = (d.items as TrustItem[] | undefined) ?? []
      return (
        <section className="px-6 py-16" style={{ backgroundColor: '#0F1E3A' }}>
          <div className="mx-auto max-w-4xl">
            {block.title && <h2 className="text-2xl font-bold text-white sm:text-3xl">{block.title}</h2>}
            {block.body && (
              <p className="mt-2 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{block.body}</p>
            )}
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {items.map((t, i) => (
                <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center gap-3">
                    {t.src
                      /* eslint-disable-next-line @next/next/no-img-element */
                      ? <img src={t.src} alt={t.name} className="h-7 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                      : <span className="text-base font-bold text-white">{t.name}</span>}
                  </div>
                  {t.result && <p className="mt-3 text-sm font-semibold" style={{ color: '#93B8F5' }}>{t.result}</p>}
                  {t.quote && <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>„{t.quote}"</p>}
                  {t.author && <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>— {t.author}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    case 'program_steps': {
      const groups = programSteps ?? []
      if (!groups.length) return null
      return (
        <Shell title={block.title} subtitle={block.subtitle}>
          <Prose text={block.body} />
          <div className={`space-y-6 ${block.body ? 'mt-6' : ''}`}>
            {groups.map((g, gi) => (
              <div key={gi} className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="text-base font-bold" style={{ color: INK }}>{g.phase}</h3>
                {g.goal && <p className="mt-0.5 text-sm" style={{ color: '#6B7280' }}>{g.goal}</p>}
                <ul className="mt-4 space-y-2">
                  {g.steps.map((s, si) => (
                    <li key={si} className="flex gap-2.5 text-sm" style={{ color: '#374151' }}>
                      <Check size={15} className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
                      <span><strong style={{ color: INK }}>{s.title}</strong>{s.description ? ` — ${s.description}` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Shell>
      )
    }

    default:
      return null
  }
}
