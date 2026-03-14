import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SalesMade Academy',
  description: 'Das systematische Vertriebs-Trainingsprogramm für Gründer und Teams.',
}

export default function SalesMadePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-orange-bg px-6" style={{ backgroundColor: '#FFF1EB' }}>
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest" style={{ color: '#F05A1A', backgroundColor: '#FFF1EB', borderColor: '#FECDBB' }}>
          Coming Soon
        </span>
        <h1 className="mt-4 text-4xl font-bold" style={{ color: '#0D0D0B' }}>SalesMade Academy</h1>
        <p className="mt-2 text-gray-600">Diese Seite wird gerade aufgebaut.</p>
      </div>
    </div>
  )
}
