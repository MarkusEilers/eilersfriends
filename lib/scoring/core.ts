import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Lead-Scoring als Website-Schicht.
 *
 * Besucher-ID (vid): mit Analyse-Einwilligung ein Cookie „ef_vid“ (1 Jahr), ohne
 * Einwilligung nur eine anonyme ID für die laufende Browser-Sitzung. Jede Aktion
 * (Seitenaufruf mit Einwilligung, Quiz-Antwort, CTA-Klick, Formular) wird als Ereignis
 * gespeichert. Sobald eine E-Mail bekannt ist (Opt-in, Buchung, Kontakt), wird die
 * ID dem Kontakt zugeordnet — rückwirkend für alle Ereignisse dieser ID.
 *
 * Punkte werden je (Art, Schlüssel) nur einmal gezählt — die letzte Fassung zählt.
 */

let ready = false
export async function ensureScoring() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS visitor_events (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vid         TEXT NOT NULL,
      kind        TEXT NOT NULL,
      key         TEXT NOT NULL DEFAULT '',
      payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
      points      INT NOT NULL DEFAULT 0,
      path        TEXT,
      persistent  BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS visitor_events_vid ON visitor_events (vid, created_at DESC)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS visitor_identities (
      vid         TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      first_name  TEXT,
      source      TEXT,
      linked_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS visitor_identities_email ON visitor_identities (lower(email))`)
  ready = true
}

export const EVENT_KINDS = ['page_view', 'quiz_answer', 'quiz_text', 'quiz_complete', 'quiz_restart', 'cta_click', 'form_start', 'identified', 'booking', 'optin'] as const
export type EventKind = (typeof EVENT_KINDS)[number]

const PAGE_POINTS: [RegExp, number][] = [
  [/^\/(en\/|es\/)?checkout/, 6], [/^\/(en\/|es\/)?schedule/, 4], [/^\/(en\/|es\/)?mystery-shopping/, 3],
  [/^\/(en\/|es\/)?academy/, 2], [/^\/(en\/|es\/)?frameworks\//, 1], [/^\/(en\/|es\/)?gespraechs-check/, 2],
]

/** Punkte je Ereignis. Bewusst einfach und im Code nachvollziehbar. */
export function pointsFor(kind: string, key: string, payload: Record<string, unknown>): number {
  const i = typeof payload.i === 'number' ? payload.i : -1
  switch (kind) {
    case 'page_view': return PAGE_POINTS.find(([re]) => re.test(key))?.[1] ?? 0
    case 'quiz_answer': {
      let p = 2
      if (key.endsWith(':role') && (i === 0 || i === 1)) p += 4            // Gründer/CEO oder Vertriebsleitung
      if (key.endsWith(':size') && i === 2) p += 3                          // 4–8 Verkäufer
      if (key.endsWith(':size') && i === 3) p += 5                          // 9+
      if (key.endsWith(':ambition') && (i === 2 || i === 3)) p += 3         // verdoppeln+
      if (key.endsWith(':dep') && (i === 0 || i === 1)) p += 2              // hängt am Chef
      if (key.endsWith(':disc') && (i === 2 || i === 3)) p += 2             // Rabatt-Problem
      return p
    }
    case 'quiz_text': return 5
    case 'quiz_complete': return 10
    case 'cta_click': return key.startsWith('quiz_rec:') ? 12 : 8
    case 'form_start': return 3
    case 'optin': return 20
    case 'identified': return 15
    case 'booking': return 30
    default: return 0
  }
}

export function tierOf(score: number): 'heiß' | 'warm' | 'kalt' {
  return score >= 40 ? 'heiß' : score >= 15 ? 'warm' : 'kalt'
}

export const VID_RE = /^[a-z0-9-]{8,64}$/

export async function trackEvent(e: { vid: string; kind: string; key?: string; payload?: Record<string, unknown>; path?: string | null; persistent?: boolean }) {
  if (!VID_RE.test(e.vid)) return
  await ensureScoring()
  const key = (e.key ?? '').slice(0, 200)
  const payload = e.payload ?? {}
  const pts = pointsFor(e.kind, key, payload)
  await db.execute(sql`
    INSERT INTO visitor_events (vid, kind, key, payload, points, path, persistent)
    VALUES (${e.vid}, ${e.kind}, ${key}, ${JSON.stringify(payload)}::jsonb, ${pts}, ${e.path ?? null}, ${!!e.persistent})`)
}

/** E-Mail einer Besucher-ID zuordnen (rückwirkend für alle Ereignisse). */
export async function identify(vid: string | null | undefined, email: string, firstName?: string | null, source?: string) {
  if (!vid || !VID_RE.test(vid) || !/.+@.+\..+/.test(email)) return
  await ensureScoring()
  const r = (await db.execute(sql`
    INSERT INTO visitor_identities (vid, email, first_name, source) VALUES (${vid}, ${email.toLowerCase()}, ${firstName ?? null}, ${source ?? null})
    ON CONFLICT (vid) DO UPDATE SET email = excluded.email, first_name = COALESCE(excluded.first_name, visitor_identities.first_name), source = excluded.source, linked_at = now()
    RETURNING (xmax = 0) AS inserted`)) as unknown as { inserted: boolean }[]
  if (r[0]?.inserted) await trackEvent({ vid, kind: 'identified', key: source ?? '', payload: {} })
}

/** Besucher-ID aus Cookie oder Body (Sitzungs-ID ohne Einwilligung). */
export function vidFrom(req: Request, bodyVid?: unknown): string | null {
  const m = (req.headers.get('cookie') ?? '').match(/(?:^|;\s*)ef_vid=([a-z0-9-]{8,64})/)
  if (m) return m[1]
  return typeof bodyVid === 'string' && VID_RE.test(bodyVid) ? bodyVid : null
}

type Row = Record<string, unknown>
const rows = (r: unknown) => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

export interface ScoredVisitor {
  vid: string; email: string | null; firstName: string | null; score: number; tier: string
  events: number; firstSeen: string; lastSeen: string; persistent: boolean
  quiz: { stage?: string; rec?: string; answers?: Record<string, number>; text?: string; answered: number } | null
}

/** Besucher bzw. Kontakte nach Punkten (eine Zeile je E-Mail, sonst je ID). */
export async function listScores(limit = 200): Promise<ScoredVisitor[]> {
  await ensureScoring()
  const r = rows(await db.execute(sql`
    WITH ev AS (
      SELECT DISTINCT ON (e.vid, e.kind, e.key) e.*, COALESCE(i.email, e.vid) AS who
      FROM visitor_events e LEFT JOIN visitor_identities i ON i.vid = e.vid
      ORDER BY e.vid, e.kind, e.key, e.created_at DESC
    ), agg AS (
      SELECT who, SUM(points)::int AS score, COUNT(*)::int AS events, MIN(created_at) AS first_seen, MAX(created_at) AS last_seen,
             BOOL_OR(persistent) AS persistent, MIN(vid) AS vid,
             COUNT(*) FILTER (WHERE kind = 'quiz_answer')::int AS answered
      FROM ev GROUP BY who
    )
    SELECT a.*, i.email, i.first_name,
      (SELECT payload FROM visitor_events q WHERE q.vid IN (SELECT vid FROM ev WHERE ev.who = a.who) AND q.kind = 'quiz_complete' ORDER BY created_at DESC LIMIT 1) AS quiz,
      (SELECT payload->>'text' FROM visitor_events q WHERE q.vid IN (SELECT vid FROM ev WHERE ev.who = a.who) AND q.kind = 'quiz_text' ORDER BY created_at DESC LIMIT 1) AS quiz_text,
      (SELECT jsonb_object_agg(split_part(key, ':', 2), (payload->>'i')::int) FROM ev WHERE ev.who = a.who AND ev.kind = 'quiz_answer') AS partial
    FROM agg a LEFT JOIN LATERAL (SELECT email, first_name FROM visitor_identities WHERE lower(email) = lower(a.who) ORDER BY linked_at DESC LIMIT 1) i ON true
    ORDER BY a.score DESC, a.last_seen DESC LIMIT ${limit}`))
  return r.map((x) => {
    const q = (x.quiz ?? null) as Record<string, unknown> | null
    const score = Number(x.score ?? 0)
    const answered = Number(x.answered ?? 0)
    return {
      vid: String(x.vid), email: (x.email as string) ?? null, firstName: (x.first_name as string) ?? null,
      score, tier: tierOf(score), events: Number(x.events ?? 0),
      firstSeen: String(x.first_seen), lastSeen: String(x.last_seen), persistent: !!x.persistent,
      quiz: q || answered ? { stage: q?.stage as string, rec: q?.rec as string, answers: (q?.answers ?? x.partial) as Record<string, number>, text: (x.quiz_text as string) ?? undefined, answered } : null,
    }
  })
}

/** Was wir zu einer Besucher-ID schon wissen — für vorausgefüllte Formulare. */
export async function knownFor(vid: string | null): Promise<{ email?: string; firstName?: string; context?: string } | null> {
  if (!vid) return null
  await ensureScoring()
  const id = rows(await db.execute(sql`SELECT email, first_name FROM visitor_identities WHERE vid = ${vid}`))[0]
  const q = rows(await db.execute(sql`SELECT kind, payload FROM visitor_events WHERE vid = ${vid} AND kind IN ('quiz_complete','quiz_text') ORDER BY created_at DESC LIMIT 4`))
  const comp = q.find((x) => x.kind === 'quiz_complete')?.payload as Record<string, unknown> | undefined
  const txt = (q.find((x) => x.kind === 'quiz_text')?.payload as Record<string, unknown> | undefined)?.text as string | undefined
  const ctx = [comp ? `Academy-Quiz: Phase ${comp.stage}, Empfehlung ${comp.rec}` : '', txt ? `Größte Herausforderung: ${txt}` : ''].filter(Boolean).join('\n')
  if (!id && !ctx) return null
  return { email: (id?.email as string) || undefined, firstName: (id?.first_name as string) || undefined, context: ctx || undefined }
}
