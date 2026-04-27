/**
 * One-time admin bootstrap endpoint.
 *
 * Refuses once any user with role='admin' exists, so it cannot be reused
 * even if BOOTSTRAP_TOKEN is leaked. After first successful call, this
 * route should be removed from the repo and BOOTSTRAP_TOKEN unset.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { count, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const runtime = 'nodejs'

const Schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120),
})

export async function POST(request: Request) {
  const expected = process.env.BOOTSTRAP_TOKEN
  if (!expected) {
    return NextResponse.json({ error: 'bootstrap disabled' }, { status: 503 })
  }
  const auth = request.headers.get('authorization') || ''
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  // Refuse if any admin already exists
  try {
    const [{ value: adminCount } = { value: 0 }] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, 'admin'))
    if ((adminCount ?? 0) > 0) {
      return NextResponse.json({ error: 'admin already exists' }, { status: 409 })
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'database error (schema missing? run drizzle-kit push)', detail: String(err) },
      { status: 500 },
    )
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  try {
    await db.insert(users).values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: 'admin',
    })
  } catch (err) {
    return NextResponse.json({ error: 'insert failed', detail: String(err) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email: parsed.data.email, role: 'admin' })
}
