import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Markus Eilers — Sales & Business Coach',
}

export default function MarkusPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-bg px-6" style={{ backgroundColor: '#EBF1FF' }}>
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest" style={{ color: '#1A5FD4', backgroundColor: '#EBF1FF', borderColor: '#BBCFF5' }}>
          Coming Soon
        </span>
        <h1 className="mt-4 text-4xl font-bold" style={{ color: '#0D0D0B' }}>Markus Eilers</h1>
        <p className="mt-2 text-gray-600">Diese Seite wird gerade aufgebaut.</p>
      </div>
    </div>
  )
}
