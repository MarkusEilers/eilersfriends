// app/[locale]/checkout/success/page.tsx
import Link from 'next/link'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; slug?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-24">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue text-2xl text-white">✓</div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue">Bestätigung</span>
          <h1 className="mt-2 font-serif text-4xl text-ink">Willkommen an Bord.</h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">
            Deine Zahlung wurde erfolgreich verarbeitet. Du bist offiziell Founding Member der SalesMade Academy Premium.
          </p>

          <div className="mt-8 rounded-xl bg-cream p-6">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Was als Nächstes passiert</p>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue text-[10px] font-bold text-white">1</span>
                <span>Du bekommst <strong>binnen 5 Minuten</strong> eine Email mit Account-Setup + WhatsApp-Einladung.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue text-[10px] font-bold text-white">2</span>
                <span><strong>Onboarding-Call mit Markus</strong> binnen 24 Stunden — Du wählst den Slot in der Email.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue text-[10px] font-bold text-white">3</span>
                <span>Die <strong>Sales-Simulation</strong> startet direkt nach dem Setup — Dein 13-Skill-Assessment ist live.</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-[#0A0D14] px-6 py-3 text-sm font-bold text-white hover:opacity-90">
              Zum Member-Bereich →
            </Link>
            <a href="mailto:team@eilersfriends.com" className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-ink hover:border-blue">
              Frage senden
            </a>
          </div>

          {sp.session_id && (
            <p className="mt-6 text-[10px] text-muted">Referenz: {sp.session_id.slice(0, 24)}…</p>
          )}
        </div>
      </div>
    </div>
  )
}
