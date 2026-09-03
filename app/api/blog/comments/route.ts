import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email/resend'
import {
  addComment, check, commentsFor, ipHash, isKnownGood, recentFromIp, report, toneCheck, HOLD_AT,
} from '@/lib/blog/comments'
import { moderationMail, authorFor, MODERATION_RECIPIENTS } from '@/lib/blog/notify'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: Request) {
  const postId = new URL(req.url).searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId ist Pflicht' }, { status: 400 })
  return NextResponse.json({ ok: true, comments: await commentsFor(postId) })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const { postId, parentId, name, email, text, website, startedAt } = body ?? {}

  if (!postId || !name?.trim() || !email?.trim() || !text?.trim()) {
    return NextResponse.json({ error: 'Name, E-Mail und Text sind Pflicht' }, { status: 400 })
  }
  if (String(text).length > 4000) {
    return NextResponse.json({ error: 'Das ist zu lang für einen Kommentar' }, { status: 400 })
  }
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(String(email))) {
    return NextResponse.json({ error: 'Die E-Mail-Adresse sieht nicht richtig aus' }, { status: 400 })
  }

  const rows = await db.execute(sql`
    SELECT id, title, slug, author_slug, comments_open FROM blog_posts WHERE id = ${postId} AND status = 'published' LIMIT 1`)
  const post = (rows as unknown as {
    id: string; title: string; slug: string; author_slug: string; comments_open: boolean
  }[])[0]
  if (!post) return NextResponse.json({ error: 'Beitrag nicht gefunden' }, { status: 404 })
  if (post.comments_open === false) {
    return NextResponse.json({ error: 'Zu diesem Beitrag sind Kommentare geschlossen' }, { status: 403 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
  const hash = ipHash(ip)

  const result = await check({
    name, email, body: text, honeypot: website,
    elapsedMs: startedAt ? Date.now() - Number(startedAt) : null,
    recentFromIp: await recentFromIp(hash),
  })

  // Der Ton entscheidet nie allein — er erhoeht nur den Verdachtswert.
  if (result.verdict !== 'spam' && result.verdict !== 'abgelehnt') {
    const tone = await toneCheck(String(text))
    if (tone.add) {
      result.score = Math.min(100, result.score + tone.add)
      if (tone.flag) result.flags.push(tone.flag)
      if (result.score >= HOLD_AT) result.verdict = 'zurueckgehalten'
    }
  }

  // Wer einmal freigegeben wurde, wartet beim zweiten Mal nicht — es sei denn,
  // eine harte Regel hat angeschlagen.
  if (result.verdict === 'zurueckgehalten' && (await isKnownGood(String(email)))) {
    result.verdict = 'freigegeben'
    result.flags.push({ rule: 'schon einmal freigegeben', kind: 'bekannt', weight: 0 })
  }

  const saved = await addComment({
    postId, parentId: parentId ?? null, name: String(name).slice(0, 80),
    email: String(email).slice(0, 160), body: String(text),
    status: result.verdict, flags: result.flags, score: result.score,
    ipHash: hash, userAgent: req.headers.get('user-agent'),
  })

  if (result.verdict === 'zurueckgehalten') {
    const author = authorFor(post.author_slug)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.eilersfriends.com'
    const mail = moderationMail({
      author, postTitle: post.title, postSlug: post.slug, commentId: saved.id,
      name: String(name), email: String(email), body: String(text),
      score: result.score, flags: result.flags, baseUrl,
    })
    for (const to of MODERATION_RECIPIENTS) {
      await sendEmail({ to, subject: mail.subject, html: mail.html }).catch(() => {})
    }
  }

  return NextResponse.json({
    ok: true,
    status: saved.status,
    message: saved.status === 'freigegeben'
      ? 'Danke — Dein Kommentar steht jetzt da.'
      : saved.status === 'zurueckgehalten'
        ? 'Danke. Wir schauen kurz drüber, dann ist er sichtbar.'
        : 'Danke für Deinen Beitrag.',
  })
}

/** Melden. Zwei Meldungen holen einen Kommentar zurück in die Prüfung. */
export async function PATCH(req: Request) {
  const { id } = (await req.json().catch(() => ({}))) ?? {}
  if (!id) return NextResponse.json({ error: 'id ist Pflicht' }, { status: 400 })
  await report(id)
  return NextResponse.json({ ok: true })
}
