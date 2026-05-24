import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { ensureWizardTables } from '@/lib/db/self-heal'

const SOURCE_TO_FRAMEWORK: Record<string, string> = {
  'framework-b2b-angebote': 'b2b-angebote',
  'b2b-angebote': 'b2b-angebote',
}

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

export async function POST(request: Request) {
  // Auth: admin session OR SEED_TOKEN bearer
  const session = await auth().catch(() => null)
  const authHeader = request.headers.get('authorization')
  const seedToken = process.env.SEED_TOKEN
  const role = session?.user?.role
  const okSession = role === 'admin' || role === 'coach'
  const okBearer = seedToken && authHeader === `Bearer ${seedToken}`
  if (!okSession && !okBearer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureWizardTables()

  // Find all confirmed subscribers with a framework-* source
  const subs = rowsOf<{ id: string; email: string; first_name: string | null; source: string | null }>(
    await db.execute(sql`
      SELECT id::text, email, first_name, source
      FROM newsletter_subscribers
      WHERE doi_confirmed_at IS NOT NULL
        AND status != 'unsubscribed'
        AND source IS NOT NULL
        AND source IN ('framework-b2b-angebote', 'b2b-angebote')
    `)
  )

  let usersCreated = 0
  let enrollmentsCreated = 0
  const issues: string[] = []

  for (const sub of subs) {
    const fwSlug = sub.source ? SOURCE_TO_FRAMEWORK[sub.source] : null
    if (!fwSlug) continue

    try {
      // Find or create user
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
            VALUES (${sub.email}, ${sub.first_name ?? sub.email}, 'participant', now())
            ON CONFLICT (email) DO UPDATE SET email_verified = now()
            RETURNING id::text
          `)
        )
        userId = createRes[0]?.id ?? null
        if (userId) usersCreated++
      }
      if (!userId) {
        issues.push(`could not create/find user for ${sub.email}`)
        continue
      }

      // Insert enrollment (idempotent)
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
    usersCreated,
    enrollmentsCreated,
    issues: issues.slice(0, 20),
  })
}
