import { notFound } from 'next/navigation'
import { getBookingByToken } from '@/lib/schedule/bookings-store'
import { entityFor } from '@/lib/schedule/config'
import { getEventType } from '@/lib/schedule/types-store'
import { ManageWidget } from '@/components/schedule/ManageWidget'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const metadata = { title: 'Termin verwalten — Eilers+Friends' }

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const b = await getBookingByToken(token)
  if (!b) notFound()
  const ent = entityFor(b.ownerSlug)
  const et = await getEventType(b.ownerSlug, b.typeSlug)
  const title = et ? `${et.name} mit ${ent?.name || ''}` : `Termin mit ${ent?.name || ''}`
  return (
    <div style={{ backgroundColor: '#FAFAF8' }}>
      <section className="px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Dein Termin</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>{title}</h1>
          <div className="mt-6">
            <ManageWidget
              token={token} owner={b.ownerSlug} type={b.typeSlug} personName={ent?.name || ''}
              start={b.startUtc} durationMin={et?.durationMin || Math.round((new Date(b.endUtc).getTime() - new Date(b.startUtc).getTime()) / 60000)}
              status={b.status} joinUrl={b.joinUrl}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
