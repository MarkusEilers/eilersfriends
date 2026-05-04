import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export default async function B2bOffersRedirect() {
  // /b2b-offers wurde in /frameworks/b2b-angebote migriert.
  // Smart-Redirect: wenn der DB-Framework-Eintrag existiert + published ist → dorthin.
  // Sonst → /frameworks Index (Empty-State zeigt "Importieren"-Button).
  try {
    const [page] = await db
      .select({ id: landingPages.id })
      .from(landingPages)
      .where(
        and(
          eq(landingPages.slug, 'b2b-angebote'),
          eq(landingPages.status, 'published'),
        ),
      )
      .limit(1)
    if (page) redirect('/frameworks/b2b-angebote')
  } catch {}
  redirect('/frameworks')
}
