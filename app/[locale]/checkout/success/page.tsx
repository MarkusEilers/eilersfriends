// app/[locale]/checkout/success/page.tsx
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string; slug?: string }> }) {
  const sp = await searchParams
  const t = await getTranslations('checkout.success')
  const bold = { b: (c: React.ReactNode) => <strong>{c}</strong> }
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-24">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue text-2xl text-white">✓</div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue">{t('eyebrow')}</span>
          <h1 className="mt-2 font-serif text-4xl text-ink">{t('title')}</h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">{t('intro')}</p>

          <div className="mt-8 rounded-xl bg-cream p-6">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('whatsNext')}</p>
            <ul className="space-y-3 text-sm text-gray-700">
              {(['step1', 'step2', 'step3'] as const).map((k, i) => (
                <li key={k} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue text-[10px] font-bold text-white">{i + 1}</span>
                  <span>{t.rich(k, bold)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-[#0A0D14] px-6 py-3 text-sm font-bold text-white hover:opacity-90">{t('toMember')}</Link>
            <a href="mailto:team@eilersfriends.com" className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-bold text-ink hover:border-blue">{t('askQuestion')}</a>
          </div>

          {sp.session_id && <p className="mt-6 text-[10px] text-muted">{t('reference')}: {sp.session_id.slice(0, 24)}…</p>}
        </div>
      </div>
    </div>
  )
}
