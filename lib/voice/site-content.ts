import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import de from '@/lib/i18n/messages/de.json'

/**
 * Website-Wissen für den Chat: die veröffentlichten Seiten als Klartext (deutsche Fassung).
 * Kommt direkt aus dem Landingpage-System — jede Textänderung auf einer Seite ist nach
 * spätestens 10 Minuten auch dem Bot bekannt. Code-Seiten (Aljona) kommen aus den Übersetzungsdateien.
 */
const PAGES: { slug: string; path: string; name: string; max: number }[] = [
  { slug: 'home', path: '/', name: 'Startseite', max: 6000 },
  { slug: 'academy', path: '/academy', name: 'SalesMade Academy', max: 9000 },
  { slug: 'liquidleadership', path: '/liquidleadership', name: 'Liquid Leadership (Führungsprogramm von Aljona)', max: 7000 },
  { slug: 'markus', path: '/markus', name: 'Markus Eilers (Keynotes, 1:1-Coaching, Brief von Markus)', max: 8000 },
  { slug: 'mystery-shopping', path: '/mystery-shopping', name: 'Mystery Shopping', max: 2500 },
  { slug: 'mystery-shopping-checkout', path: '/checkout/mystery-shopping', name: 'Mystery Shopping Buchung', max: 2500 },
]

const SKIP_KEYS = /^(id|label|theme|image|bg|bgLabel|href|url|src|photo|next|source|category|names|ctaHref|videoUrl|imageUrl|photoUrl|color|accent|tone)$/i

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|h1|h2|h3|li|div|section|blockquote|figure)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&shy;/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\{\{ms\.[a-z]+\}\}/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function flatten(v: unknown, out: string[]): void {
  if (typeof v === 'string') { const t = v.includes('<') ? htmlToText(v) : v.trim(); if (t) out.push(t) }
  else if (Array.isArray(v)) v.forEach((x) => flatten(x, out))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (!SKIP_KEYS.test(k)) flatten(x, out) }
}

function sectionText(type: string, content: Record<string, unknown>): string {
  if (type === 'story_html') return htmlToText(String(content.html ?? ''))
  const out: string[] = []
  flatten(content, out)
  return out.join('\n')
}

let cache: { rows: { slug: string; type: string; content: Record<string, unknown> }[]; at: number } | null = null

/** path = Seite, auf der der Besucher gerade ist — deren Inhalt kommt vollständig mit, alle anderen gekürzt. */
export async function siteKnowledge(path?: string): Promise<string> {
  const blocks: string[] = []
  const cur = (path ?? '').replace(/^\/(en|es)(?=\/|$)/, '') || '/'
  try {
    if (!cache || Date.now() - cache.at > 600000) {
    const res = await db.execute(sql`
      SELECT p.slug, s.type, s.content
      FROM landing_pages p JOIN landing_page_sections s ON s.landing_page_id = p.id
      WHERE p.status = 'published' AND s.is_visible
      ORDER BY p.slug, s."order"`)
    cache = { rows: (Array.isArray(res) ? res : ((res as unknown as { rows?: unknown[] }).rows ?? [])) as { slug: string; type: string; content: Record<string, unknown> }[], at: Date.now() }
    }
    const rows = cache.rows
    for (const pg of PAGES) {
      const text = rows.filter((r) => r.slug === pg.slug).map((r) => sectionText(r.type, r.content)).filter(Boolean).join('\n')
      if (text) blocks.push(`### ${pg.name} (eilersfriends.com${pg.path})${cur === pg.path ? ' — DIE SEITE, AUF DER DER BESUCHER GERADE IST' : ''}\n${text.slice(0, cur === pg.path ? 30000 : pg.max)}`)
    }
  } catch { /* Seiten-Wissen ist optional */ }
  try {
    const a = (de as Record<string, unknown>).aljonaPage as Record<string, unknown> | undefined
    if (a) {
      const out: string[] = []
      flatten(Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'meta')), out)
      blocks.push(`### Aljona Eilers (Leadership, Liquid Leadership, eilersfriends.com/aljona)\n${out.join('\n').slice(0, 5000)}`)
    }
  } catch { /* ignore */ }
  return blocks.length
    ? `WEBSITE-INHALTE (aktueller Stand der Seiten — nutze sie für Fragen zu Angeboten, Personen, Keynotes, Ablauf, Kundenstimmen; verweise auf die passende Seite). WICHTIG: Kundenzitate, Namen und Zahlen nur WÖRTLICH so wiedergeben, wie sie hier stehen — nie umformulieren oder erfinden. Steht etwas nicht hier, sag offen, dass Du es nicht weißt:\n\n${blocks.join('\n\n')}`
    : ''
}
