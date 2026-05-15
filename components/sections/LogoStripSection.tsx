import { getTranslations } from 'next-intl/server'
import { LogoScrollbar } from '@/components/blocks/LogoScrollbar'
import { getVisibleTrustLogos } from '@/lib/db/queries/trust-logos'

/**
 * Trust-Logo-Strip — partner / press logos.
 * Source of truth: trust_logos DB table (admin-editable via /admin/logos).
 * Falls back to seed defaults if DB is unreachable.
 */
export async function LogoStripSection() {
  const t = await getTranslations('logos')
  const logos = await getVisibleTrustLogos()

  return (
    <section className="border-y border-gray-100 bg-gray-50 py-10">
      <div className="mx-auto mb-6 max-w-7xl px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t('title')}
        </p>
      </div>
      <LogoScrollbar
        logos={logos.map((l) => ({ name: l.name, src: l.src ?? undefined }))}
        speed="normal"
      />
    </section>
  )
}
