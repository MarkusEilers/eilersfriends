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

/**
 * Build a `count(*)`-style 4-bucket count for an arbitrary timestamp column.
 * Uses a single round-trip per call.
 */
async function rangeCount(table: string, column: string, where?: string): Promise<RangeCount> {
  const whereClause = where ? `WHERE ${where}` : ''
  // Inline strings here are static — not user input. Safe.
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
    today: asNum(r.today),
    last7d: asNum(r.last7d),
    last30d: asNum(r.last30d),
    total: asNum(r.total),
  }
}

async function uniqueVisitorsRange(): Promise<RangeCount> {
  const rows = (await db.execute(sql.raw(`
    SELECT
      COUNT(DISTINCT session_hash) FILTER (WHERE created_at >= now() - INTERVAL '1 day') AS today,
      COUNT(DISTINCT session_hash) FILTER (WHERE created_at >= now() - INTERVAL '7 days') AS last7d,
      COUNT(DISTINCT session_hash) FILTER (WHERE created_at >= now() - INTERVAL '30 days') AS last30d,
      COUNT(DISTINCT session_hash) AS total
    FROM "page_views"
    WHERE session_hash IS NOT NULL
  `))) as unknown as SqlRow[]
  const r = rows[0] ?? {}
  return {
    today: asNum(r.today),
    last7d: asNum(r.last7d),
    last30d: asNum(r.last30d),
    total: asNum(r.total),
  }
}

async function tableExists(name: string): Promise<boolean> {
  const rows = (await db.execute(sql.raw(`
    SELECT to_regclass('public."${name}"') AS reg
  `))) as unknown as SqlRow[]
  return Boolean(rows[0]?.reg)
}

/**
 * Build a synthetic "Site-Changes" feed by reading updatedAt of content tables
 * we know about. We don't require a site_events row for every content change
 * — the updatedAt timestamps are already authoritative.
 */
async function recentContentChanges(limit = 15): Promise<BriefingItem[]> {
  const items: BriefingItem[] = []

  // Newsletter subscribers (signup + confirm)
  if (await tableExists('newsletter_subscribers')) {
    const rows = (await db.execute(sql.raw(`
      SELECT id::text, email, status::text, created_at, doi_confirmed_at
      FROM newsletter_subscribers
      ORDER BY GREATEST(created_at, COALESCE(doi_confirmed_at, created_at)) DESC
      LIMIT ${limit}
    `))) as unknown as Array<Record<string, string | Date | null>>
    for (const r of rows) {
      const ts = (r.doi_confirmed_at ?? r.created_at) as Date | null
      if (!ts) continue
      const confirmed = Boolean(r.doi_confirmed_at)
      items.push({
        id: `sub-${r.id}`,
        category: 'subscriber',
        eventType: confirmed ? 'confirmed' : 'pending',
        title: confirmed ? 'Newsletter-Anmeldung bestätigt' : 'Neue Newsletter-Anmeldung',
        summary: String(r.email ?? ''),
        refType: 'newsletter_subscriber',
        refId: String(r.id),
        createdAt: ts instanceof Date ? ts : new Date(ts as unknown as string),
      })
    }
  }

  // Email sequence sends (lastSentAt)
  if (await tableExists('email_sequence_enrollments')) {
    const rows = (await db.execute(sql.raw(`
      SELECT ese.id::text, ese.last_sent_at, s.name AS seq_name
      FROM email_sequence_enrollments ese
      LEFT JOIN email_sequences s ON s.id = ese.sequence_id
      WHERE ese.last_sent_at IS NOT NULL
      ORDER BY ese.last_sent_at DESC
      LIMIT ${limit}
    `))) as unknown as Array<Record<string, string | Date | null>>
    for (const r of rows) {
      const ts = r.last_sent_at as Date | null
      if (!ts) continue
      items.push({
        id: `seq-${r.id}`,
        category: 'sequence',
        eventType: 'sent',
        title: 'Email-Sequence versendet',
        summary: r.seq_name ? `Sequenz: ${r.seq_name}` : null,
        refType: 'email_sequence_enrollment',
        refId: String(r.id),
        createdAt: ts instanceof Date ? ts : new Date(ts as unknown as string),
      })
    }
  }

  // Landing-Page updates
  if (await tableExists('landing_pages')) {
    const rows = (await db.execute(sql.raw(`
      SELECT id::text, title, slug, updated_at, created_at
      FROM landing_pages
      ORDER BY updated_at DESC
      LIMIT ${limit}
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

  // Email-Templates
  if (await tableExists('email_templates')) {
    const rows = (await db.execute(sql.raw(`
      SELECT id::text, name, type::text, updated_at
      FROM email_templates
      ORDER BY updated_at DESC
      LIMIT ${Math.min(limit, 10)}
    `))) as unknown as Array<Record<string, string | Date | null>>
    for (const r of rows) {
      const ts = r.updated_at as Date | null
      if (!ts) continue
      items.push({
        id: `tpl-${r.id}`,
        category: 'content',
        eventType: 'updated',
        title: 'Email-Template geändert',
        summary: `${r.name} · ${r.type}`,
        refType: 'email_template',
        refId: String(r.id),
        createdAt: ts instanceof Date ? ts : new Date(ts as unknown as string),
      })
    }
  }

  // Programme
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

  // Native site_events (explicit log)
  if (await tableExists('site_events')) {
    const rows = (await db.execute(sql.raw(`
      SELECT id::text, category, event_type, title, summary, ref_type, ref_id::text, created_at
      FROM site_events
      ORDER BY created_at DESC
      LIMIT ${limit}
    `))) as unknown as Array<Record<string, string | Date | null>>
    for (const r of rows) {
      const ts = r.created_at as Date | null
      if (!ts) continue
      items.push({
        id: `ev-${r.id}`,
        category: String(r.category ?? 'system'),
        eventType: String(r.event_type ?? 'event'),
        title: String(r.title ?? 'Ereignis'),
        summary: r.summary ? String(r.summary) : null,
        refType: r.ref_type ? String(r.ref_type) : null,
        refId: r.ref_id ? String(r.ref_id) : null,
        createdAt: ts instanceof Date ? ts : new Date(ts as unknown as string),
      })
    }
  }

  // Merge & sort by time
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return items.slice(0, limit)
}

async function topPaths(limit = 8): Promise<{ path: string; views: number }[]> {
  if (!(await tableExists('page_views'))) return []
  const rows = (await db.execute(sql.raw(`
    SELECT path, COUNT(*)::int AS views
    FROM page_views
    WHERE created_at >= now() - INTERVAL '30 days'
    GROUP BY path
    ORDER BY views DESC
    LIMIT ${limit}
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
    GROUP BY referrer_host
    ORDER BY views DESC
    LIMIT ${limit}
  `))) as unknown as Array<{ host: string | null; views: number }>
  return rows
    .map((r) => ({ host: r.host ?? '—', views: asNum(r.views as unknown as number) }))
    .filter((r) => r.host)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await ensureAnalyticsTables()

  const zeros: RangeCount = { today: 0, last7d: 0, last30d: 0, total: 0 }

  const [subscribers, sequenceSends, pageViewsCount, uniques, paths, refs, briefing] =
    await Promise.all([
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
    subscribers,
    sequenceSends,
    pageViews: pageViewsCount,
    uniqueVisitors: uniques,
    topPaths: paths,
    topReferrers: refs,
    recentEvents: briefing,
  }
}
