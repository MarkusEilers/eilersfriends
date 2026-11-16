import { currentSlug } from '@/lib/event-pages/store'
import { servePage } from '@/lib/event-pages/serve'

export const dynamic = 'force-dynamic'

// Bewusst nicht in Navigation, Footer oder Sitemap — nur per Link erreichbar.
export async function GET() {
  return servePage(await currentSlug())
}
