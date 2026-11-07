import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { SITE } from '@/lib/seo/site'

/**
 * Nächtlicher Link-Check: alle externen Links auf den öffentlichen Seiten (aus der Sitemap)
 * prüfen. Ein Link gilt erst nach zwei Fehlschlägen hintereinander als kaputt und wird dann
 * auf der Website ausgeblendet; sobald er wieder erreichbar ist, wird er wieder eingeblendet.
 * Antworten wie 401/403/429/999 (Bot-Schutz, z. B. LinkedIn) zählen nicht als kaputt.
 */
let ready = false
async function ensure() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS external_links (
      url            TEXT PRIMARY KEY,
      pages          TEXT[] NOT NULL DEFAULT '{}',
      status         INT,
      detail         TEXT,
      ok             BOOLEAN NOT NULL DEFAULT true,
      fail_count     INT NOT NULL DEFAULT 0,
      hidden         BOOLEAN NOT NULL DEFAULT false,
      first_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_checked   TIMESTAMPTZ,
      last_ok        TIMESTAMPTZ,
      hidden_since   TIMESTAMPTZ
    )`)
  ready = true
}
type Row = Record<string, unknown>
const rows = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

const OWN = /(^|\.)eilersfriends\.com$/i
const SKIP = /^(mailto:|tel:|javascript:)|(\.(png|jpe?g|svg|webp|gif|ico|css|js|woff2?)(\?|$))|fonts\.(googleapis|gstatic)\.com|vercel\.(app|com)\/_|googletagmanager|google-analytics/i
const UA = 'Mozilla/5.0 (compatible; EilersFriendsLinkCheck/1.0; +https://www.eilersfriends.com)'

export function normalize(u: string) {
  try { const x = new URL(u); x.hash = ''; return x.toString().replace(/\/$/, '') } catch { return u }
}

async function sitemapUrls(): Promise<string[]> {
  const r = await fetch(`${SITE}/sitemap.xml`, { headers: { 'User-Agent': UA } })
  const xml = await r.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

async function linksOn(page: string): Promise<string[]> {
  try {
    const r = await fetch(page, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
    const html = await r.text()
    const out = new Set<string>()
    for (const m of html.matchAll(/href="(https?:\/\/[^"#]+)[^"]*"/g)) {
      const raw = m[1].replace(/&amp;/g, '&')
      if (SKIP.test(raw)) continue
      try { if (OWN.test(new URL(raw).hostname)) continue } catch { continue }
      out.add(normalize(raw))
    }
    return [...out]
  } catch { return [] }
}

async function probe(url: string): Promise<{ ok: boolean; status: number | null; detail: string }> {
  const tryOnce = async (method: 'HEAD' | 'GET') => {
    const r = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(15000) })
    return r.status
  }
  try {
    let st = await tryOnce('HEAD')
    if (st === 405 || st === 404 || st >= 500 || st === 403) st = await tryOnce('GET')  // manche Server können kein HEAD
    if (st < 400 || [401, 403, 429, 999].includes(st)) return { ok: true, status: st, detail: st < 400 ? 'ok' : 'Bot-Schutz, gilt als erreichbar' }
    return { ok: false, status: st, detail: `HTTP ${st}` }
  } catch (e) {
    return { ok: false, status: null, detail: String((e as Error)?.message ?? e).slice(0, 160) }
  }
}

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []; let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]) } }))
  return out
}

export interface LinkCheckResult { checked: number; pages: number; newlyHidden: Row[]; restored: Row[]; stillHidden: Row[] }

export async function runLinkCheck(): Promise<LinkCheckResult> {
  await ensure()
  const pages = (await sitemapUrls()).filter((u) => !/\/(en|es)(\/|$)/.test(new URL(u).pathname))  // Sprachfassungen haben dieselben Links
  const found = new Map<string, Set<string>>()
  await pool(pages, 6, async (p) => {
    for (const l of await linksOn(p)) { if (!found.has(l)) found.set(l, new Set()); found.get(l)!.add(new URL(p).pathname || '/') }
  })
  const urls = [...found.keys()]
  const results = await pool(urls, 8, async (u) => ({ u, ...(await probe(u)) }))
  const newlyHidden: Row[] = [], restored: Row[] = []
  for (const r of results) {
    const pagesOf = [...(found.get(r.u) ?? [])]
    const prev = rows(await db.execute(sql`SELECT fail_count, hidden FROM external_links WHERE url = ${r.u}`))[0]
    const fails = r.ok ? 0 : Number(prev?.fail_count ?? 0) + 1
    const hide = !r.ok && fails >= 2
    if (hide && !prev?.hidden) newlyHidden.push({ url: r.u, pages: pagesOf, detail: r.detail })
    if (!hide && prev?.hidden) restored.push({ url: r.u, pages: pagesOf })
    await db.execute(sql`
      INSERT INTO external_links (url, pages, status, detail, ok, fail_count, hidden, last_checked, last_ok, hidden_since)
      VALUES (${r.u}, ARRAY(SELECT jsonb_array_elements_text(${JSON.stringify(pagesOf)}::jsonb)), ${r.status}, ${r.detail}, ${r.ok}, ${fails}, ${hide}, now(), ${r.ok ? new Date().toISOString() : null}, ${hide ? new Date().toISOString() : null})
      ON CONFLICT (url) DO UPDATE SET pages = excluded.pages, status = excluded.status, detail = excluded.detail, ok = excluded.ok,
        fail_count = excluded.fail_count, hidden = excluded.hidden, last_checked = now(),
        last_ok = COALESCE(excluded.last_ok, external_links.last_ok),
        hidden_since = CASE WHEN excluded.hidden THEN COALESCE(external_links.hidden_since, now()) ELSE NULL END`)
  }
  // Links, die auf keiner Seite mehr vorkommen, nicht mehr ausblenden
  await db.execute(sql`UPDATE external_links SET hidden = false, hidden_since = NULL WHERE last_checked < now() - interval '1 hour' AND hidden`)
  const stillHidden = rows(await db.execute(sql`SELECT url, pages, detail, hidden_since FROM external_links WHERE hidden ORDER BY hidden_since`))
  return { checked: urls.length, pages: pages.length, newlyHidden, restored, stillHidden }
}

export async function hiddenLinks(): Promise<string[]> {
  await ensure()
  return rows(await db.execute(sql`SELECT url FROM external_links WHERE hidden`)).map((r) => String(r.url))
}

export async function listLinks(): Promise<Row[]> {
  await ensure()
  return rows(await db.execute(sql`SELECT url, pages, status, detail, ok, fail_count, hidden, last_checked, last_ok, hidden_since FROM external_links ORDER BY hidden DESC, ok ASC, url`))
}
