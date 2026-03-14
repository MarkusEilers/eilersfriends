import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aljona Eilers — Leadership & Culture Coach',
}

export default function AljonaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: '#FFEBEC' }}>
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest" style={{ color: '#D4192B', backgroundColor: '#FFEBEC', borderColor: '#F5BBBC' }}>
          Coming Soon
        </span>
        <h1 className="mt-4 text-4xl font-bold" style={{ color: '#0D0D0B' }}>Aljona Eilers</h1>
        <p className="mt-2 text-gray-600">Diese Seite wird gerade aufgebaut.</p>
      </div>
    </div>
  )
}
