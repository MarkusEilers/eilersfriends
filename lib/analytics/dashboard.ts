import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureAnalyticsTables } from '@/lib/db/self-heal'

export interface RangeCount {
  today: number
  last7d: number
  last30d: number
  total: number
}

export interface DashboardStats {
  subscribers: RangeCount
  sequenceSends: RangeCount
  pageViews: RangeCount
  uniqueVisitors: RangeCount
  topPaths: { path: string; views: number }[]
  topReferrers: { host: string; views: number }[]
  recentEvents: BriefingItem[]
}

export interface BriefingItem {
  id: string
  category: string
  eventType: string
  title: string
  summary: string | null
  refType: string | null
  refId: string | null
  createdAt: Date
}

type SqlRow = Record<string, unknown>

function asNum(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseInt(v, 10) || 0
  if (typeof v === 'bigint') return Number(v)
  return 0
}

/**
 * Drizzle's db.execute(sql.raw(...)) returns different shapes depending on
 * the driver version: either a plain Array<Row> (older postgres-js) or
 * { rows: Array<Row> } (newer). This helper normalises both.
 */
function rowsOf(result: unknown): SqlRow[] {
  if (Array.isArray(result)) return result as SqlRow[]
  if (result && typeof result === 'object' && 'rows' in result) {
    const r = (result as { rows: unknown }).rows
    if (Array.isArray(r)) return r as SqlRow[]
  }
  return []
}

async function rangeCount(table: string, column: string, where?: string): Promise<RangeCount> {
  const whereClause = where ? `WHERE ${where}` : ''
  const result = await db.execute(sql.raw(`
    SELECT
      COUNT(*) FILTER (WHERE ${column} >= now() - INTERVAL '1 day') AS today,
      COUNT(*) FILTER (WHERE ${column} >= now() - INTERVAL '7 days') AS last7d,
      COUNT(*) FILTER (WHERE ${column} >= now() - INTERVAL '30 days') AS last30d,
      COUNT(*) AS total
    FROM "${table}"
    ${whereClause}
  `))
  const r = rowsOf(result)[0] ?? {}
  return {
    today: asNum(r.today), last7d: asNum(r.last7d),
    last30d: asNum(r.last30d), total: asNum(r.total),
  }
}

async function uniqueVisitorsRange(): Promise<RangeCount> {
  const result = await db.execute(sql.raw(`
    SELECT
      COUNT(DISTINCT session_hash) FILTER (WHERE created_at >= now() - INTERVAL '1 day') AS today,
      COUNT(DISTINCT session_hash) FILTER (WHERE created_at >= now() - INTERVAL '7 days') AS last7d,
      COUNT(DISTINCT session_hash) FILTER (WHERE created_at >= now() - INTERVAL '30 days') AS last30d,
      COUNT(DISTINCT session_hash) AS total
    FROM "page_views" WHERE session_hash IS NOT NULL
  `))
  const r = rowsOf(result)[0] ?? {}
  return {
    today: asNum(r.today), last7d: asNum(r.last7d),
    last30d: asNum(r.last30d), total: asNum(r.total),
  }
}

async function tableExists(name: string): Promise<boolean> {
  const result = await db.execute(sql.raw(`SELECT to_regclass('public."${name}"') AS reg`))
  const r = rowsOf(result)[0]
  return Boolean(r?.reg)
}

const EVENT_TITLES: Record<string, string> = {
  'subscriber.signed_up': 'Neue Newsletter-Anmeldung',
  'subscriber.confirmed': 'Newsletter-Anmeldung bestätigt',
  'subscriber.unsubscribed': 'Newsletter-Abmeldung',
  'framework.started': 'Framework gestartet',
  'framework.step_completed': 'Framework-Schritt abgeschlossen',
  'framework.completed': 'Framework abgeschlossen',
  'offer.sent': 'Angebot versendet',
  'offer.viewed': 'Angebot angesehen',
  'offer.signed': 'Angebot unterzeichnet',
  'offer.paid': 'Angebot bezahlt',
  'member.signup': 'Neues Mitglied',
  'member.level_up': 'Mitglied Level-Up',
  'community.post_published': 'Community-Post veröffentlicht',
  'system.user_login': 'Login',
  'system.admin_change_applied': 'Admin-Änderung angewendet',
}

async function recentContentChanges(limit = 15): Promise<BriefingItem[]> {
  const items: BriefingItem[] = []

  if (await tableExists('events')) {
    const result = await db.execute(sql.raw(`
      SELECT id::text AS id, category::text AS category, type, payload, source, occurred_at
      FROM events
      ORDER BY occurred_at DESC
      LIMIT ${limit}
    `))
    for (const r of rowsOf(result)) {
      const ts = r.occurred_at as Date | string | null
      if (!ts) continue
      const type = String(r.type ?? '')
      const payload = (r.payload ?? {}) as Record<string, unknown>
      const summary =
        (payload.email as string) ||
        (payload.title as string) ||
        (payload.frameworkSlug as string) ||
        (payload.message as string) ||
        null
      items.push({
        id: `ev-${r.id}`,
        category: String(r.category ?? 'system'),
        eventType: type,
        title: EVENT_TITLES[type] ?? type,
        summary,
        refType: r.source ? String(r.source) : null,
        refId: null,
        createdAt: ts instanceof Date ? ts : new Date(ts as string),
      })
    }
  }

  if (await tableExists('landing_pages')) {
    const result = await db.execute(sql.raw(`
      SELECT id::text AS id, title, slug, updated_at, created_at
      FROM landing_pages
      ORDER BY updated_at DESC
      LIMIT ${Math.min(limit, 10)}
    `))
    for (const r of rowsOf(result)) {
      const ts = (r.updated_at ?? r.created_at) as Date | string | null
      if (!ts) continue
      const dt = ts instanceof Date ? ts : new Date(ts as string)
      const ct = r.created_at instanceof Date ? r.created_at : (r.created_at ? new Date(r.created_at as string) : null)
      const isNew = ct && Math.abs(dt.getTime() - ct.getTime()) < 1000
      items.push({
        id: `lp-${r.id}`,
        category: 'content',
        eventType: isNew ? 'created' : 'updated',
        title: isNew ? 'Landing-Page erstellt' : 'Landing-Page geupdated',
        summary: `${r.title} · /lp/${r.slug}`,
        refType: 'landing_page',
        refId: String(r.id),
        createdAt: dt,
      })
    }
  }

  if (await tableExists('programs')) {
    const result = await db.execute(sql.raw(`
      SELECT id::text AS id, slug, hero_headline, updated_at, created_at, is_published
      FROM programs
      ORDER BY updated_at DESC
      LIMIT ${Math.min(limit, 10)}
    `))
    for (const r of rowsOf(result)) {
      const ts = (r.updated_at ?? r.created_at) as Date | string | null
      if (!ts) continue
      const dt = ts instanceof Date ? ts : new Date(ts as string)
      items.push({
        id: `prog-${r.id}`,
        category: 'content',
        eventType: 'updated',
        title: 'Programm geupdated',
        summary: `${r.hero_headline ?? r.slug} · ${r.is_published ? 'published' : 'draft'}`,
        refType: 'program',
        refId: String(r.id),
        createdAt: dt,
      })
    }
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return items.slice(0, limit)
}

async function topPaths(limit = 8): Promise<{ path: string; views: number }[]> {
  if (!(await tableExists('page_views'))) return []
  const result = await db.execute(sql.raw(`
    SELECT path, COUNT(*)::int AS views
    FROM page_views
    WHERE created_at >= now() - INTERVAL '30 days'
    GROUP BY path ORDER BY views DESC LIMIT ${limit}
  `))
  return rowsOf(result).map((r) => ({ path: String(r.path), views: asNum(r.views) }))
}

async function topReferrers(limit = 6): Promise<{ host: string; views: number }[]> {
  if (!(await tableExists('page_views'))) return []
  const result = await db.execute(sql.raw(`
    SELECT referrer_host AS host, COUNT(*)::int AS views
    FROM page_views
    WHERE created_at >= now() - INTERVAL '30 days'
      AND referrer_host IS NOT NULL AND referrer_host != ''
    GROUP BY referrer_host ORDER BY views DESC LIMIT ${limit}
  `))
  return rowsOf(result)
    .map((r) => ({ host: r.host ? String(r.host) : '—', views: asNum(r.views) }))
    .filter((r) => r.host && r.host !== '—')
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await ensureAnalyticsTables()
  const zeros: RangeCount = { today: 0, last7d: 0, last30d: 0, total: 0 }

  const [subscribers, sequenceSends, pageViewsCount, uniques, paths, refs, briefing] = await Promise.all([
    (await tableExists('newsletter_subscribers'))
      ? rangeCount('newsletter_subscribers', 'created_at', "status != 'unsubscribed'")
      : Promise.resolve(zeros),
    (await tableExists('email_sequence_enrollments'))
      ? rangeCount('email_sequence_enrollments', 'last_sent_at', 'last_sent_at IS NOT NULL')
      : Promise.resolve(zeros),
    (await tableExists('page_views'))
      ? rangeCount('page_views', 'created_at')
      : Promise.resolve(zeros),
    (await tableExists('page_views'))
      ? uniqueVisitorsRange()
      : Promise.resolve(zeros),
    topPaths(),
    topReferrers(),
    recentContentChanges(20),
  ])

  return {
    subscribers, sequenceSends, pageViews: pageViewsCount,
    uniqueVisitors: uniques, topPaths: paths, topReferrers: refs,
    recentEvents: briefing,
  }
}
