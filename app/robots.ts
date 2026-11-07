import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo/site'

/**
 * Login, Kundenbereich und Checkout-Bestätigung sind nicht gesperrt, sondern tragen
 * „noindex“ — nur so sieht Google das und nimmt sie aus dem Index (gesperrte Seiten bleiben drin).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/offer'] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
