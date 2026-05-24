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

type SqlRow = Record<string, string | number | null>

function asNum(v: string | number | null | undefined): number {
  if (v == null) return 0
  return typeof v === 'number' ? v : parseInt(v, 10) || 0
}

async function rangeCount(table: string, column: string, where?: string): Promise<RangeCount> {
  const whereClause = where ? `WHERE ${where}` : ''
  const rows = (await db.execute(sql.raw(`
    SELECT
      COUNT(*) FILTER (WHERE ${column} >= now() - INTERVAL '1 day') AS today,
      COUNT(*) FILTER (WHERE ${column} >= now() - INTERVAL '7 days') AS last7d,
      COUNT(*) FILTER (WHERE ${column} >= now() - INTERVAL '30 days') AS last30d,
      COUNT(*) AS total
    FROM "${table}"
    ${whereClause}
  `))) as unknown as SqlRow[]
  const r = rows[0] ?? {}
  return {
    today: asNum(r.today), last7d: asNum(r.last7d),
    last30d: asNum(r.last30d), total: asNum(r.total),
  }
}

async function uniqueVisitorsRange(): Promise<RangeCount> {
  const rows = (await db.execute(sql.raw(`
    SELECT
      COUNT(DISTINCT session_hash) FILTER (WHERE created_at >= now() - INTERVAL '1 day') AS today,
      COUNT(DISTINCT session_hash) FILTER (WHERE created_at >= now() - INTERVAL '7 days') AS last7d,
      COUNT(DISTINCT session_hash) FILTER (WHERE created_at >= now() - INTERVAL '30 days') AS last30d,
      COUNT(DISTINCT session_hash) AS total
    FROM "page_views" WHERE session_hash IS NOT NULL
  `))) as unknown as SqlRow[]
  const r = rows[0] ?? {}
  return {
    today: asNum(r.today), last7d: asNum(r.last7d),
    last30d: asNum(r.last30d), total: asNum(r.total),
  }
}

async function tableExists(name: string): Promise<boolean> {
  const rows = (await db.execute(sql.raw(`SELECT to_regclass('public."${name}"') AS reg`))) as unknown as SqlRow[]
  return Boolean(rows[0]?.reg)
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
    const rows = (await db.execute(sql.raw(`
      SELECT id::text, category::text, type, payload, source, occurred_at
      FROM events
      ORDER BY occurred_at DESC
      LIMIT ${limit}
    `))) as unknown as Array<Record<string, unknown>>
    for (const r of rows) {
      const ts = r.occurred_at as Date | null
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
        refType: String(r.source ?? '') || null,
        refId: null,
        createdAt: ts instanceof Date ? ts : new Date(ts as unknown as string),
      })
    }
  }

  if (await tableExists('landing_pages')) {
    const rows = (await db.execute(sql.raw(`
      SELECT id::text, title, slug, updated_at, created_at
      FROM landing_pages
      ORDER BY updated_at DESC
      LIMIT ${Math.min(limit, 10)}
    `))) as unknown as Array<Record<string, string | Date | null>>
    for (const r of rows) {
      const ts = (r.updated_at ?? r.created_at) as Date | null
      if (!ts) continue
      const isNew = r.updated_at && r.created_at &&
        Math.abs((r.updated_at as Date).getTime() - (r.created_at as Date).getTime()) < 1000
      items.push({
        id: `lp-${r.id}`,
        category: 'content',
        eventType: isNew ? 'created' : 'updated',
        title: isNew ? 'Landing-Page erstellt' : 'Landing-Page geupdated',
        summary: `${r.title} · /lp/${r.slug}`,
        refType: 'landing_page',
        refId: String(r.id),
        createdAt: ts instanceof Date ? ts : new Date(ts as unknown as string),
      })
    }
  }

  if (await tableExists('programs')) {
    const rows = (await db.execute(sql.raw(`
      SELECT id::text, slug, hero_headline, updated_at, created_at, is_published
      FROM programs
      ORDER BY updated_at DESC
      LIMIT ${Math.min(limit, 10)}
    `))) as unknown as Array<Record<string, string | Date | null | boolean>>
    for (const r of rows) {
      const ts = (r.updated_at ?? r.created_at) as Date | null
      if (!ts) continue
      items.push({
        id: `prog-${r.id}`,
        category: 'content',
        eventType: 'updated',
        title: 'Programm geupdated',
        summary: `${r.hero_headline ?? r.slug} · ${r.is_published ? 'published' : 'draft'}`,
        refType: 'program',
        refId: String(r.id),
        createdAt: ts instanceof Date ? ts : new Date(ts as unknown as string),
      })
    }
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return items.slice(0, limit)
}

async function topPaths(limit = 8): Promise<{ path: string; views: number }[]> {
  if (!(await tableExists('page_views'))) return []
  const rows = (await db.execute(sql.raw(`
    SELECT path, COUNT(*)::int AS views
    FROM page_views
    WHERE created_at >= now() - INTERVAL '30 days'
    GROUP BY path ORDER BY views DESC LIMIT ${limit}
  `))) as unknown as Array<{ path: string; views: number }>
  return rows.map((r) => ({ path: r.path, views: asNum(r.views as unknown as number) }))
}

async function topReferrers(limit = 6): Promise<{ host: string; views: number }[]> {
  if (!(await tableExists('page_views'))) return []
  const rows = (await db.execute(sql.raw(`
    SELECT referrer_host AS host, COUNT(*)::int AS views
    FROM page_views
    WHERE created_at >= now() - INTERVAL '30 days'
      AND referrer_host IS NOT NULL AND referrer_host != ''
    GROUP BY referrer_host ORDER BY views DESC LIMIT ${limit}
  `))) as unknown as Array<{ host: string | null; views: number }>
  return rows
    .map((r) => ({ host: r.host ?? '—', views: asNum(r.views as unknown as number) }))
    .filter((r) => r.host)
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
