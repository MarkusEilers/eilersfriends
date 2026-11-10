import { permanentRedirect } from 'next/navigation'

/** Alias: /liquid-leadership → /liquidleadership */
export default async function LiquidLeadershipAlias({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  permanentRedirect(`${locale === 'de' ? '' : `/${locale}`}/liquidleadership`)
}
