import { redirect } from 'next/navigation'

/** Die Academy hat eine neue Seite unter /academy (Landingpage-System). Die alte liegt unter /salesmade/classic. */
export default async function SalesMadeRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(locale && locale !== 'de' ? `/${locale}/academy` : '/academy')
}
