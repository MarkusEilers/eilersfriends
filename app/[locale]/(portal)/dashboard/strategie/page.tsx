import Link from 'next/link'
import { ArrowRight, Sparkles, Building2, Package } from 'lucide-react'
import { getProductsAction, getOverviewAction } from '@/lib/actions/strategy'
import { ProductsInline } from '@/components/strategy/ProductsInline'
import { StatusBadge, type StepStatus } from '@/components/strategy/StatusBadge'
import { ProgressRing } from '@/components/strategy/ProgressRing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface StepRow {
  step_id: string; key: string; title: string; subtitle: string | null
  scope: 'company' | 'product'; sort_order: number; estimated_min: number | null
  state_id: string | null; status: StepStatus | null; progress: number | null
}

export default async function StrategiePage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const sp = await searchParams
  const products = await getProductsAction()
  const activeProduct = products.find((p) => p.id === sp.product) ?? products[0] ?? null
  const { steps, companyId, productStepCount, isCoach } = await getOverviewAction(activeProduct?.id ?? null)
  const rows = steps as unknown as StepRow[]

  const companySteps = rows.filter((s) => s.scope === 'company')
  const productSteps = rows.filter((s) => s.scope === 'product')
  const doneCount = rows.filter((s) => s.status === 'approved').length
  const overall = rows.length ? Math.round((rows.reduce((a, s) => a + (s.status === 'approved' ? 100 : (s.progress ?? 0)), 0) / rows.length)) : 0

  return (
    <div>
      {/* Kopf */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>
            <Sparkles size={12} /> Strategie
          </span>
          <h1 className="mt-1.5 text-2xl font-bold text-gray-900 sm:text-3xl">Euer Weg zum Markt</h1>
          <p className="mt-1 text-sm text-gray-500">
            {productStepCount} Schritte je Produkt — vom idealen Kunden bis zur Erstansprache.
          </p>
        </div>
      </div>

      {!companyId && (
        <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 text-sm text-purple-900">
          {isCoach ? 'Wähle oben unter „Ansehen als" eine Firma — dann siehst und bearbeitest Du deren Strategie.' : 'Euer Konto ist noch keiner Organisation zugeordnet. Meldet Euch kurz bei Eilers+Friends.'}
        </div>
      )}

      {/* Produkte — inline anlegen, umbenennen, auswählen */}
      {companyId && (
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400"><Package size={13} /> Eure Produkte</h2>
          <ProductsInline products={products as { id: string; name: string; slug: string; description?: string | null }[]} activeId={activeProduct?.id} />
        </section>
      )}

      {/* Fortschritt */}
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <ProgressRing value={overall} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">{overall}% erarbeitet</p>
          <p className="text-xs text-gray-500">{doneCount} von {rows.length} Schritten freigegeben</p>
        </div>
        <div className="hidden h-2 flex-1 overflow-hidden rounded-full bg-gray-100 sm:block">
          <div className="h-full rounded-full transition-all" style={{ width: `${overall}%`, backgroundColor: '#1A5FD4' }} />
        </div>
      </div>

      {/* Firmen-Ebene */}
      {companySteps.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            <Building2 size={13} /> Für die ganze Organisation
          </h2>
          <div className="mt-3 space-y-2">
            {companySteps.map((s) => <StepRowCard key={s.key} step={s} productId={null} />)}
          </div>
        </section>
      )}

      {/* Produkt-Ebene */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <Package size={13} /> {activeProduct ? `Für ${activeProduct.name}` : 'Je Produkt'}
        </h2>

        {!activeProduct ? (
          <p className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-4 text-sm text-gray-500">
            Sobald oben ein Produkt angelegt ist, stehen hier die {productStepCount} Schritte dafür.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {productSteps.map((s) => <StepRowCard key={s.key} step={s} productId={activeProduct.id} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function StepRowCard({ step, productId }: { step: StepRow; productId: string | null }) {
  const status = (step.status ?? 'available') as StepStatus
  const progress = status === 'approved' ? 100 : (step.progress ?? 0)
  const href = `/dashboard/strategie/${step.key}${productId ? `?product=${productId}` : ''}`

  return (
    <Link href={href as '/'}
      className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 transition-all hover:-translate-y-px hover:border-blue-300 hover:shadow-sm">
      <ProgressRing value={progress} done={status === 'approved'} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-gray-900">{step.title}</h3>
          <StatusBadge status={status} />
        </div>
        {step.subtitle && <p className="mt-0.5 truncate text-sm text-gray-500">{step.subtitle}</p>}
      </div>
      {step.estimated_min && <span className="hidden flex-shrink-0 text-xs text-gray-400 sm:block">ca. {step.estimated_min} Min.</span>}
      <ArrowRight size={16} className="flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
    </Link>
  )
}
