import type { Metadata } from 'next'
import { personBySlug } from '@/lib/schedule/config'

export const metadata: Metadata = { title: 'Postfach verbunden — Eilers+Friends', robots: { index: false, follow: false } }

/** Landing after someone connected their Microsoft 365 mailbox via an invite link. */
export default async function ConnectedPage({ searchParams }: { searchParams?: Promise<{ person?: string }> }) {
  const sp = (await searchParams) ?? {}
  const p = sp.person ? personBySlug(sp.person) : undefined
  return (
    <div className="min-h-[60vh] bg-[#FAFAF8] px-6 py-24">
      <div className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-white p-10 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Verbunden</p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">{p ? `Danke, ${p.name.split(' ')[0]}.` : 'Danke.'}</h1>
        <p className="mt-3 text-gray-600">
          Dein Postfach und Dein Kalender sind mit Eilers+Friends verbunden. Mails werden dort nur als Entwurf angelegt, gesendet wird nichts ohne Dich.
          Du kannst das Fenster jetzt schließen.
        </p>
      </div>
    </div>
  )
}
