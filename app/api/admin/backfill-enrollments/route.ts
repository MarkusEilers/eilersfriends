import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { ensureWizardTables } from '@/lib/db/self-heal'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

function sourceToFramework(source: string | null | undefined): string | null {
  if (!source) return null
  const s = source.toLowerCase()
  if (s === 'framework-b2b-angebote' || s === 'b2b-angebote') return 'b2b-angebote'
  if (s.includes('b2b') || s.includes('angebote') || s.includes('bauplan')) return 'b2b-angebote'
  return null
}

export async function POST(request: Request) {
  const session = await auth().catch(() => null)
  const authHeader = request.headers.get('authorization')
  const seedToken = process.env.SEED_TOKEN
  const role = session?.user?.role
  const okSession = role === 'admin' || role === 'coach'
  const okBearer = seedToken && authHeader === `Bearer ${seedToken}`
  if (!okSession && !okBearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureWizardTables()

  // ALL subscribers (we'll handle pending too — they get a user, just no enrollment yet)
  const subs = rowsOf<{ id: string; email: string; first_name: string | null; source: string | null; doi_confirmed_at: string | Date | null; status: string }>(
    await db.execute(sql`
      SELECT id::text, email, first_name, source, doi_confirmed_at, status::text AS status
      FROM newsletter_subscribers
      WHERE status != 'unsubscribed'
    `)
  )

  let usersCreated = 0
  let enrollmentsCreated = 0
  let skippedPending = 0
  const issues: string[] = []
  const matches: { email: string; source: string | null; fwSlug: string | null; confirmed: boolean }[] = []

  for (const sub of subs) {
    const fwSlug = sourceToFramework(sub.source)
    const confirmed = !!sub.doi_confirmed_at
    matches.push({ email: sub.email, source: sub.source, fwSlug, confirmed })
    if (!fwSlug) continue

    try {
      let userId: string | null = null
      const userRes = rowsOf<{ id: string }>(
        await db.execute(sql`SELECT id::text FROM users WHERE email = ${sub.email} LIMIT 1`)
      )
      if (userRes[0]?.id) {
        userId = userRes[0].id
      } else {
        const createRes = rowsOf<{ id: string }>(
          await db.execute(sql`
            INSERT INTO users (email, full_name, role, email_verified)
            VALUES (${sub.email}, ${sub.first_name ?? sub.email}, 'participant', ${confirmed ? sql`now()` : sql`NULL`})
            ON CONFLICT (email) DO UPDATE SET email_verified = COALESCE(users.email_verified, ${confirmed ? sql`now()` : sql`NULL`})
            RETURNING id::text
          `)
        )
        userId = createRes[0]?.id ?? null
        if (userId) usersCreated++
      }
      if (!userId) {
        issues.push(`no user for ${sub.email}`)
        continue
      }

      if (!confirmed) {
        skippedPending++
        continue  // User exists, but no enrollment until DOI confirms
      }

      const before = rowsOf<{ id: string }>(
        await db.execute(sql`
          SELECT id::text FROM user_framework_state
          WHERE user_id = ${userId} AND framework_slug = ${fwSlug}
          LIMIT 1
        `)
      )
      if (before.length === 0) {
        await db.execute(sql`
          INSERT INTO user_framework_state (user_id, framework_slug, current_step, progress, status)
          VALUES (${userId}, ${fwSlug}, 0, 0, 'active')
          ON CONFLICT (user_id, framework_slug) DO NOTHING
        `)
        enrollmentsCreated++
      }
    } catch (err) {
      issues.push(`${sub.email}: ${String(err).slice(0, 200)}`)
    }
  }

  return NextResponse.json({
    ok: true,
    processed: subs.length,
    matched: matches.filter((m) => m.fwSlug).length,
    usersCreated,
    enrollmentsCreated,
    skippedPending,
    issues: issues.slice(0, 20),
    sampleMatches: matches.slice(0, 10),
  })
}
