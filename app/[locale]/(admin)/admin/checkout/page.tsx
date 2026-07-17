import Link from 'next/link'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ExternalLink, Edit3, CreditCard, ShoppingCart } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Row { id: string; name: string; slug: string; is_active: boolean; is_published: boolean; stripe_product_id: string | null; has_checkout: boolean }

const STANDALONE = [
  { label: 'SalesMade AI Intensive (JumpStart)', href: '/checkout/salesmade-ai-intensive' },
  { label: 'Mystery Shopping', href: '/checkout/mystery-shopping' },
  { label: 'Checkout-Übersicht (öffentlich)', href: '/checkout' },
]

export default async function AdminCheckoutPage() {
  let rows: Row[] = []
  try {
    rows = (await db.execute(sql`
      SELECT id, name, slug, is_active, is_published, stripe_product_id,
             (checkout_content IS NOT NULL AND checkout_content::text <> '{}') AS has_checkout
      FROM programs ORDER BY name
    `)) as unknown as Row[]
  } catch { rows = [] }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <ShoppingCart size={20} className="text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Checkout-Seiten</h1>
      </div>
      <p className="mb-6 text-sm text-gray-500">Jedes Programm hat eine Checkout-Seite unter <span className="font-mono">/checkout/[slug]</span>. Aktiv = öffentlich erreichbar.</p>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">{r.name}</h3>
                <p className="text-xs text-gray-400 font-mono">/checkout/{r.slug}</p>
              </div>
              <div className="flex flex-shrink-0 flex-wrap justify-end gap-1">
                <Badge on={r.is_active} label="Aktiv" offLabel="Inaktiv" />
                {r.stripe_product_id ? <Badge on label="Stripe" /> : null}
                {r.has_checkout ? <Badge on label="Inhalt" /> : <Badge on={false} offLabel="Kein Inhalt" />}
              </div>
            </div>
            <div className="mt-4 flex gap-1.5 border-t border-gray-50 pt-3">
              <Link href={`/admin/programs/${r.id}`} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"><Edit3 size={11} /> Programm</Link>
              {r.is_active && (
                <a href={`/checkout/${r.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"><ExternalLink size={11} /> Checkout</a>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-gray-400">Keine Programme gefunden.</p>}
      </div>

      <h2 className="mt-10 mb-3 text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><CreditCard size={14} /> Standalone-Checkouts (fest codiert)</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {STANDALONE.map((s) => (
          <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-sm">
            <p className="text-sm font-semibold text-gray-800">{s.label}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 font-mono">{s.href} <ExternalLink size={10} /></p>
          </a>
        ))}
      </div>
    </div>
  )
}

function Badge({ on, label, offLabel }: { on: boolean; label?: string; offLabel?: string }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: on ? '#EAF7EE' : '#F3F4F6', color: on ? '#157A45' : '#9CA3AF' }}>
      {on ? (label ?? '') : (offLabel ?? label ?? '')}
    </span>
  )
}
