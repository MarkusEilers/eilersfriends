import { Suspense } from 'react'
import { getStrategyTreeAction } from '@/lib/actions/strategy'
import { StrategyTree } from '@/components/strategy/StrategyTree'

/**
 * Strategie-Bereich mit eigener Navigation: links der Baum
 * (Organisation → Produkte → Schritte), rechts die Arbeit.
 * Auf kleinen Bildschirmen klappt der Baum oben auf.
 */
export default async function StrategieLayout({ children }: { children: React.ReactNode }) {
  const tree = await getStrategyTreeAction().catch(() => null)
  const nav = tree?.companyId ? (
    <Suspense fallback={null}><StrategyTree company={tree.company} products={tree.products} /></Suspense>
  ) : null
  return (
    <div className="lg:flex lg:gap-8">
      {nav && (
        <>
          <details className="mb-4 rounded-xl border border-gray-200 bg-white p-3 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold text-gray-700">Schritte & Produkte</summary>
            <div className="mt-3">{nav}</div>
          </details>
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-14 max-h-[calc(100vh-5rem)] overflow-y-auto pr-1">{nav}</div>
          </aside>
        </>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
