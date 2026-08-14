import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, BookOpen, Lightbulb, Bot, Wrench } from 'lucide-react'
import { openStepAction, getProductsAction } from '@/lib/actions/strategy'
import { StatusBadge, type StepStatus } from '@/components/strategy/StatusBadge'
import { StepWorkflow } from '@/components/strategy/StepWorkflow'
import { StepEditor } from '@/components/strategy/StepEditor'
import { CommentPanel } from '@/components/strategy/CommentPanel'
import { fieldsForStep } from '@/lib/strategy/step-fields'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BLOCK_ICON: Record<string, React.ElementType> = {
  opening_story: BookOpen, example: Lightbulb, agent: Bot, tool: Wrench,
}

export default async function StrategieStepPage({ params, searchParams }:
  { params: Promise<{ stepKey: string }>; searchParams: Promise<{ product?: string }> }) {
  const { stepKey } = await params
  const sp = await searchParams

  let payload
  try { payload = await openStepAction(stepKey, sp.product ?? null) } catch { notFound() }
  const { step, state, blocks, comments, isCoach } = payload

  const products = await getProductsAction()
  const product = products.find((p) => p.id === sp.product) ?? null
  const backHref = `/dashboard/strategie${product ? `?product=${product.id}` : ''}`

  const status = (state.status ?? 'available') as StepStatus
  const readOnly = status === 'submitted' || status === 'in_review' || status === 'approved'
  const fields = fieldsForStep(step.key as string)

  const stories = blocks.filter((b) => b.kind === 'opening_story')
  const extras = blocks.filter((b) => b.kind !== 'opening_story' && b.kind !== 'exercise')

  return (
    <div>
      <Link href={backHref as '/'} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-700">
        <ArrowLeft size={13} /> Alle Schritte
      </Link>

      {/* Kopf */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{String(step.title)}</h1>
            <StatusBadge status={status} size="md" />
          </div>
          {step.subtitle ? <p className="mt-1 text-sm text-gray-500">{String(step.subtitle)}</p> : null}
          <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {step.scope === 'product' && product && <span>Produkt: <strong className="font-semibold text-gray-600">{product.name}</strong></span>}
            {step.scope === 'company' && <span>Gilt für die ganze Organisation</span>}
            {step.estimated_min ? <span className="inline-flex items-center gap-1"><Clock size={11} /> ca. {String(step.estimated_min)} Min.</span> : null}
          </p>
        </div>
      </div>

      {/* Hinweis nach Überarbeitungswunsch */}
      {status === 'changes_requested' && state.review_note ? (
        <div className="mt-5 rounded-2xl border px-5 py-4" style={{ borderColor: '#FECDCA', backgroundColor: '#FEF3F2' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B42318' }}>Bitte überarbeiten</p>
          <p className="mt-1 text-sm text-gray-800">{String(state.review_note)}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* Opening Story */}
          {stories.map((b) => (
            <section key={String(b.id)} className="rounded-2xl border border-gray-200 bg-white p-6"
              style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F8FF 100%)' }}>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>
                <BookOpen size={12} /> {b.title ? String(b.title) : 'Zum Einstieg'}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{String(b.body ?? '')}</p>
            </section>
          ))}

          {/* Arbeitsfläche */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold text-gray-900">Eure Arbeit</h2>
            <p className="mt-0.5 text-xs text-gray-500">Kurz und konkret — lieber ein präziser Satz als drei vage.</p>
            <div className="mt-5">
              <StepEditor stateId={String(state.id)} fields={fields}
                initial={(state.data ?? {}) as Record<string, unknown>} readOnly={readOnly} />
            </div>
          </section>

          {/* Weitere Bausteine (Beispiele, Tools, Agenten) */}
          {extras.map((b) => {
            const Icon = BLOCK_ICON[String(b.kind)] ?? Lightbulb
            return (
              <section key={String(b.id)} className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
                  <Icon size={12} /> {b.title ? String(b.title) : String(b.kind)}
                </p>
                {b.body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{String(b.body)}</p> : null}
              </section>
            )
          })}

          {/* Workflow */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold text-gray-900">Nächster Schritt</h2>
            <p className="mt-0.5 mb-4 text-xs text-gray-500">
              {status === 'approved' ? 'Dieser Schritt ist freigegeben.'
                : status === 'submitted' || status === 'in_review' ? 'Das Coach-Team schaut sich Euren Stand an.'
                : 'Wenn Ihr fertig seid, reicht den Schritt zur Prüfung ein.'}
            </p>
            <StepWorkflow stateId={String(state.id)} status={status} isCoach={isCoach} />
          </section>
        </div>

        <CommentPanel stateId={String(state.id)} comments={comments as never[]} isCoach={isCoach} />
      </div>
    </div>
  )
}
