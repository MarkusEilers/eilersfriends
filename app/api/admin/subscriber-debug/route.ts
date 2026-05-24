import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

export async function GET(request: Request) {
  const session = await auth().catch(() => null)
  const authHeader = request.headers.get('authorization')
  const seedToken = process.env.SEED_TOKEN
  const role = session?.user?.role
  const okSession = role === 'admin' || role === 'coach'
  const okBearer = seedToken && authHeader === `Bearer ${seedToken}`
  if (!okSession && !okBearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subs = rowsOf<Record<string, unknown>>(await db.execute(sql`
    SELECT id::text, email, status::text AS status, source, doi_sent_at, doi_confirmed_at, created_at
    FROM newsletter_subscribers
    ORDER BY created_at DESC
    LIMIT 30
  `))
  const ufs = rowsOf<Record<string, unknown>>(await db.execute(sql`
    SELECT user_id::text, framework_slug, progress, status, started_at
    FROM user_framework_state
    ORDER BY started_at DESC
    LIMIT 30
  `))
  const users = rowsOf<Record<string, unknown>>(await db.execute(sql`
    SELECT id::text, email, role::text AS role, email_verified, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 30
  `))
  // Aggregate counts
  const counts = rowsOf<Record<string, unknown>>(await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM newsletter_subscribers) AS subs_total,
      (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'active') AS subs_active,
      (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'pending') AS subs_pending,
      (SELECT COUNT(*) FROM newsletter_subscribers WHERE doi_confirmed_at IS NOT NULL) AS subs_confirmed,
      (SELECT COUNT(*) FROM user_framework_state) AS ufs_total,
      (SELECT COUNT(*) FROM users) AS users_total
  `))

  return NextResponse.json({
    counts: counts[0] ?? {},
    recentSubscribers: subs,
    recentEnrollments: ufs,
    recentUsers: users,
  })
}
