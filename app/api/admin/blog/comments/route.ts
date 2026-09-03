import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { queue, moderate, rules, seedCommentRules, ensureCommentSchema, type ListKind } from '@/lib/blog/comments'

export const runtime = 'nodejs'
export const maxDuration = 60

async function guard() {
  const s = await auth()
  const r = s?.user?.role
  return r === 'admin' || r === 'coach' ? s : null
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  await seedCommentRules()
  return NextResponse.json({ ok: true, queue: await queue(), rules: await rules() })
}

/** Freigeben, ablehnen, als Spam markieren. */
export async function POST(req: Request) {
  const s = await guard()
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id, status } = (await req.json().catch(() => ({}))) ?? {}
  if (!id || !['freigegeben', 'abgelehnt', 'spam'].includes(status)) {
    return NextResponse.json({ error: 'id und status sind Pflicht' }, { status: 400 })
  }
  await moderate(id, status, s.user?.id ?? null)
  return NextResponse.json({ ok: true })
}

/** Die drei Wortlisten pflegen. */
export async function PUT(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  await ensureCommentSchema()
  const { action, id, kind, pattern, isRegex, note } = (await req.json().catch(() => ({}))) ?? {}
  if (action === 'delete') {
    if (!id) return NextResponse.json({ error: 'id ist Pflicht' }, { status: 400 })
    await db.execute(sql`UPDATE blog_comment_rules SET is_active = false WHERE id = ${id}`)
    return NextResponse.json({ ok: true })
  }
  if (!pattern || !['sperre', 'pruefung', 'freundeskreis'].includes(kind)) {
    return NextResponse.json({ error: 'kind und pattern sind Pflicht' }, { status: 400 })
  }
  await db.execute(sql`
    INSERT INTO blog_comment_rules (kind, pattern, is_regex, note)
    VALUES (${kind as ListKind}, ${pattern}, ${Boolean(isRegex)}, ${note ?? null})`)
  return NextResponse.json({ ok: true, rules: await rules() })
}
