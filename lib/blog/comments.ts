import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

/**
 * Kommentare.
 *
 * Ein Kommentarbereich ist kein Zusatz, sondern eine Verpflichtung: er lebt
 * davon, dass jemand antwortet. Deshalb ist hier alles auf wenig Aufwand im
 * Normalfall gebaut — drei stille Pruefungen fangen den groessten Teil ab, ohne
 * dass ein Mensch etwas davon merkt, und nur der Rest landet in der Freigabe.
 *
 * Eine Antwortebene, nicht mehr. Verschachtelte Baeume sind auf dem Telefon
 * unlesbar und laden zum Streit ein.
 */

export type CommentStatus = 'neu' | 'freigegeben' | 'zurueckgehalten' | 'abgelehnt' | 'spam'
export type ListKind = 'sperre' | 'pruefung' | 'freundeskreis'

export interface Comment {
  id: string; post_id: string; parent_id: string | null
  author_name: string; author_email: string; body: string
  status: CommentStatus; flags: Flag[]; score: number
  created_at: string; reviewed_at: string | null
}

export interface Flag { rule: string; kind: string; matched?: string; weight: number }

let ready = false

export async function ensureCommentSchema() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS blog_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'neu',
      flags JSONB NOT NULL DEFAULT '[]'::jsonb,
      score SMALLINT NOT NULL DEFAULT 0,
      ip_hash TEXT,
      user_agent TEXT,
      reported_count SMALLINT NOT NULL DEFAULT 0,
      reviewed_at TIMESTAMPTZ,
      reviewed_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS blog_comments_post_idx ON blog_comments (post_id, status, created_at)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS blog_comments_queue_idx ON blog_comments (status, created_at DESC)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS blog_comment_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      kind TEXT NOT NULL,
      pattern TEXT NOT NULL,
      is_regex BOOLEAN NOT NULL DEFAULT false,
      note TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS blog_comment_rules_idx ON blog_comment_rules (kind, is_active)`)
  ready = true
}

export const ipHash = (ip: string) =>
  createHash('sha256').update(`ef-blog:${ip}`).digest('hex').slice(0, 32)

/** Ab hier wird zurueckgehalten. Bewusst nicht bei null: sonst wartet alles. */
export const HOLD_AT = 40

interface Rule { id: string; kind: ListKind; pattern: string; is_regex: boolean; note: string | null }

export async function rules(): Promise<Rule[]> {
  await ensureCommentSchema()
  const rows = await db.execute(sql`SELECT id, kind, pattern, is_regex, note FROM blog_comment_rules WHERE is_active`)
  return rows as unknown as Rule[]
}

function hits(text: string, list: Rule[]): Rule[] {
  const lower = text.toLowerCase()
  return list.filter((r) => {
    if (r.is_regex) {
      try { return new RegExp(r.pattern, 'iu').test(text) } catch { return false }
    }
    // Wortgrenzen: sonst faengt eine Sperre auf "arsch" auch "Marschall".
    return new RegExp(`(^|[^a-zà-ÿ])${escapeRe(r.pattern.toLowerCase())}([^a-zà-ÿ]|$)`, 'iu').test(lower)
  })
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export interface CheckInput {
  name: string; email: string; body: string
  honeypot?: string | null
  elapsedMs?: number | null
  recentFromIp?: number
}

export interface CheckResult { score: number; flags: Flag[]; verdict: CommentStatus }

/**
 * Der Verdachtswert.
 *
 * Er entscheidet nur ueber Sichtbarkeit, nie ueber Wahrheit. Die Sperrliste ist
 * die einzige Regel, die allein ablehnt — alles andere summiert sich und landet
 * im schlimmsten Fall bei einem Menschen.
 */
export async function check(input: CheckInput): Promise<CheckResult> {
  const all = await rules()
  const flags: Flag[] = []
  let score = 0

  // Drei stille Pruefungen zuerst. Sie kosten den Leser nichts.
  if (input.honeypot?.trim()) {
    return { score: 100, flags: [{ rule: 'honigtopf', kind: 'still', weight: 100 }], verdict: 'spam' }
  }
  if (input.elapsedMs != null && input.elapsedMs < 3000) {
    flags.push({ rule: 'zu schnell abgeschickt', kind: 'still', weight: 45 }); score += 45
  }
  if ((input.recentFromIp ?? 0) > 3) {
    flags.push({ rule: 'mehr als drei Beitraege je Stunde', kind: 'still', weight: 40 }); score += 40
  }

  const text = `${input.name}\n${input.body}`
  const friends = all.filter((r) => r.kind === 'freundeskreis')
  if (hits(input.email, friends).length || hits(input.name, friends).length) {
    return { score: 0, flags: [{ rule: 'freundeskreis', kind: 'liste', weight: 0 }], verdict: 'freigegeben' }
  }

  const blocked = hits(text, all.filter((r) => r.kind === 'sperre'))
  if (blocked.length) {
    return {
      score: 100,
      flags: blocked.map((r) => ({ rule: r.note ?? r.pattern, kind: 'sperrliste', matched: r.pattern, weight: 100 })),
      verdict: 'abgelehnt',
    }
  }

  for (const r of hits(text, all.filter((x) => x.kind === 'pruefung'))) {
    flags.push({ rule: r.note ?? r.pattern, kind: 'pruefliste', matched: r.pattern, weight: 35 })
    score += 35
  }

  // Drei Muster, fuer die es keine Wortliste braucht.
  const links = (input.body.match(/https?:\/\//g) ?? []).length
  if (links > 2) { flags.push({ rule: `${links} Links im Text`, kind: 'muster', weight: 40 }); score += 40 }
  if (/\.[a-z]{2,}($|\/)/i.test(input.name)) {
    flags.push({ rule: 'Name sieht aus wie eine Adresse', kind: 'muster', weight: 35 }); score += 35
  }
  const letters = input.body.replace(/[^a-zà-ÿ]/gi, '')
  const caps = input.body.replace(/[^A-ZÀ-Þ]/g, '')
  if (letters.length > 25 && caps.length / letters.length > 0.5) {
    flags.push({ rule: 'ueberwiegend Grossbuchstaben', kind: 'muster', weight: 25 }); score += 25
  }
  if (input.body.trim().length < 15) {
    flags.push({ rule: 'sehr kurz', kind: 'muster', weight: 15 }); score += 15
  }

  return { score: Math.min(100, score), flags, verdict: score >= HOLD_AT ? 'zurueckgehalten' : 'freigegeben' }
}

/**
 * Die Einschaetzung des Tons.
 *
 * Was eine Wortliste nicht kann: ein hoeflich formulierter, herabsetzender
 * Kommentar enthaelt kein einziges verbotenes Wort. Diese Pruefung erhoeht nur
 * den Verdachtswert und entscheidet nie allein — ein Modell, das ueber
 * Sichtbarkeit alleine bestimmt, sperrt frueher oder spaeter den falschen Satz.
 */
export async function toneCheck(body: string): Promise<{ add: number; flag?: Flag }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || body.length < 40) return { add: 0 }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Du beurteilst einen Leserkommentar. Antworte als JSON: {"angriff": 0-10, "werbung": 0-10, "grund": "..."}. ' +
              'angriff meint Herabsetzung einer Person, nicht Widerspruch in der Sache. ' +
              'Scharfe, aber sachliche Kritik ist kein Angriff und bekommt eine niedrige Zahl.',
          },
          { role: 'user', content: body.slice(0, 2000) },
        ],
      }),
    })
    if (!res.ok) return { add: 0 }
    const data = await res.json()
    const p = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    const worst = Math.max(Number(p.angriff ?? 0), Number(p.werbung ?? 0))
    if (worst < 6) return { add: 0 }
    return {
      add: worst >= 8 ? 40 : 25,
      flag: { rule: String(p.grund ?? 'Tonfall auffaellig'), kind: 'ton', weight: worst >= 8 ? 40 : 25 },
    }
  } catch { return { add: 0 } }
}

/** Wer einmal freigegeben wurde, wartet beim zweiten Mal nicht. */
export async function isKnownGood(email: string): Promise<boolean> {
  await ensureCommentSchema()
  const rows = await db.execute(sql`
    SELECT 1 FROM blog_comments WHERE lower(author_email) = ${email.toLowerCase()} AND status = 'freigegeben' LIMIT 1`)
  return (rows as unknown as unknown[]).length > 0
}

export async function recentFromIp(hash: string): Promise<number> {
  await ensureCommentSchema()
  const rows = await db.execute(sql`
    SELECT COUNT(*)::int AS n FROM blog_comments
    WHERE ip_hash = ${hash} AND created_at > now() - interval '1 hour'`)
  return Number((rows as unknown as { n: number }[])[0]?.n ?? 0)
}

export async function addComment(input: {
  postId: string; parentId?: string | null
  name: string; email: string; body: string
  status: CommentStatus; flags: Flag[]; score: number
  ipHash?: string | null; userAgent?: string | null
}) {
  await ensureCommentSchema()
  const rows = await db.execute(sql`
    INSERT INTO blog_comments (post_id, parent_id, author_name, author_email, body, status, flags, score, ip_hash, user_agent)
    VALUES (${input.postId}, ${input.parentId ?? null}, ${input.name}, ${input.email}, ${input.body},
            ${input.status}, ${JSON.stringify(input.flags)}::jsonb, ${input.score},
            ${input.ipHash ?? null}, ${(input.userAgent ?? '').slice(0, 300)})
    RETURNING id, status`)
  return (rows as unknown as { id: string; status: CommentStatus }[])[0]
}

export async function commentsFor(postId: string): Promise<Comment[]> {
  await ensureCommentSchema()
  const rows = await db.execute(sql`
    SELECT id, post_id, parent_id, author_name, '' AS author_email, body, status,
           '[]'::jsonb AS flags, 0 AS score, created_at, reviewed_at
    FROM blog_comments WHERE post_id = ${postId} AND status = 'freigegeben'
    ORDER BY created_at ASC LIMIT 200`)
  return rows as unknown as Comment[]
}

export async function queue(limit = 100) {
  await ensureCommentSchema()
  const rows = await db.execute(sql`
    SELECT c.*, p.title AS post_title, p.slug AS post_slug
    FROM blog_comments c JOIN blog_posts p ON p.id = c.post_id
    WHERE c.status IN ('neu','zurueckgehalten') OR c.reported_count > 0
    ORDER BY c.created_at DESC LIMIT ${limit}`)
  return rows as unknown as Array<Comment & { post_title: string; post_slug: string }>
}

export async function moderate(id: string, status: CommentStatus, userId?: string | null) {
  await ensureCommentSchema()
  await db.execute(sql`
    UPDATE blog_comments SET status = ${status}, reviewed_at = now(),
      reviewed_by = ${userId ?? null}, reported_count = 0
    WHERE id = ${id}`)
}

export async function report(id: string) {
  await ensureCommentSchema()
  await db.execute(sql`
    UPDATE blog_comments SET reported_count = reported_count + 1,
      status = CASE WHEN reported_count + 1 >= 2 THEN 'zurueckgehalten' ELSE status END
    WHERE id = ${id}`)
}

/** Abgelehntes verfaellt. Sechzig Tage, dann weg. */
export async function purgeRejected() {
  await ensureCommentSchema()
  const rows = await db.execute(sql`
    DELETE FROM blog_comments
    WHERE status IN ('abgelehnt','spam') AND created_at < now() - interval '60 days'
    RETURNING id`)
  return (rows as unknown as unknown[]).length
}

export const STARTER_RULES: Array<{ kind: ListKind; pattern: string; is_regex: boolean; note: string }> = [
  { kind: 'sperre', pattern: '\\b(viagra|casino|crypto ?pump|forex ?signal)\\b', is_regex: true, note: 'Werbung' },
  { kind: 'sperre', pattern: '\\b(hurensohn|wichser|fotze|neger)\\b', is_regex: true, note: 'Beleidigung' },
  { kind: 'pruefung', pattern: '\\b(abzocke|betrug|scharlatan|unseriös|unserioes)\\b', is_regex: true, note: 'Vorwurf — im Zusammenhang pruefen' },
  { kind: 'pruefung', pattern: '\\b(anwalt|klage|abmahnung|dsgvo-verstoss)\\b', is_regex: true, note: 'Rechtliches — vor Freigabe lesen' },
  { kind: 'pruefung', pattern: '\\b(kontaktiere mich|schreib mir|whatsapp)\\b', is_regex: true, note: 'Kontaktaufnahme im Kommentar' },
  { kind: 'freundeskreis', pattern: 'eilersfriends.com', is_regex: false, note: 'eigene Leute' },
]

export async function seedCommentRules() {
  await ensureCommentSchema()
  for (const r of STARTER_RULES) {
    await db.execute(sql`
      INSERT INTO blog_comment_rules (kind, pattern, is_regex, note)
      SELECT ${r.kind}, ${r.pattern}, ${r.is_regex}, ${r.note}
      WHERE NOT EXISTS (SELECT 1 FROM blog_comment_rules WHERE pattern = ${r.pattern} AND kind = ${r.kind})`)
  }
  return STARTER_RULES.length
}
