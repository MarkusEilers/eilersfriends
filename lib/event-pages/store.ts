import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

/**
 * Event-Seiten unter /events — öffentlich erreichbar, aber nicht verlinkt.
 * Inhalt, Passwörter (nur bcrypt-Hashes) und Tickets liegen in der Datenbank,
 * nicht im Repo: das Repo ist öffentlich.
 *
 * event_pages           eine Zeile je Event (öffentliche Seite + geschützter Teil als JSON)
 * event_page_passwords  ein Hash je Person; person = Index in secret.people
 * event_page_files      Tickets/Parkscheine; person = wem die Datei gehört
 */

let ensured = false
async function ensureTables() {
  if (ensured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS event_pages (
      slug text PRIMARY KEY,
      title text NOT NULL,
      event_date date,
      public_html text NOT NULL,
      secret jsonb NOT NULL DEFAULT '{}'::jsonb,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS event_page_passwords (
      id serial PRIMARY KEY,
      slug text NOT NULL REFERENCES event_pages(slug) ON DELETE CASCADE,
      person integer NOT NULL,
      hash text NOT NULL,
      UNIQUE (slug, person)
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS event_page_files (
      slug text NOT NULL REFERENCES event_pages(slug) ON DELETE CASCADE,
      id text NOT NULL,
      person integer NOT NULL,
      label text NOT NULL,
      name text NOT NULL,
      mime text NOT NULL,
      ghost boolean NOT NULL DEFAULT false,
      sort integer NOT NULL DEFAULT 0,
      data bytea NOT NULL,
      PRIMARY KEY (slug, id)
    )`)
  ensured = true
}

type Row = Record<string, unknown>
const rows = (r: unknown): Row[] => (Array.isArray(r) ? r : ((r as { rows?: Row[] })?.rows ?? [])) as Row[]

export async function getPublicHtml(slug: string): Promise<string | null> {
  await ensureTables()
  const r = rows(await db.execute(sql`SELECT public_html FROM event_pages WHERE slug = ${slug} AND is_active`))
  return (r[0]?.public_html as string) ?? null
}

/** /events ohne Slug zeigt das nächste anstehende (sonst das jüngste) aktive Event. */
export async function currentSlug(): Promise<string | null> {
  await ensureTables()
  const r = rows(await db.execute(sql`
    SELECT slug FROM event_pages WHERE is_active
    ORDER BY (event_date >= current_date) DESC,
             CASE WHEN event_date >= current_date THEN event_date END ASC,
             event_date DESC NULLS LAST
    LIMIT 1`))
  return (r[0]?.slug as string) ?? null
}

/** Groß-/Kleinschreibung egal, Leerzeichen am Rand egal — wie in der ursprünglichen Seite. */
export async function checkPassword(slug: string, password: string): Promise<number | null> {
  await ensureTables()
  const pw = password.trim().toLowerCase()
  if (!pw || pw.length > 200) return null
  const r = rows(await db.execute(sql`SELECT person, hash FROM event_page_passwords WHERE slug = ${slug}`))
  for (const row of r) {
    if (await bcrypt.compare(pw, row.hash as string)) return Number(row.person)
  }
  return null
}

export interface EventFileMeta { id: string; label: string; name: string; mime: string; ghost: boolean }

export async function getSecretFor(slug: string, person: number) {
  await ensureTables()
  const r = rows(await db.execute(sql`SELECT secret FROM event_pages WHERE slug = ${slug} AND is_active`))
  if (!r[0]) return null
  const secret = (typeof r[0].secret === 'string' ? JSON.parse(r[0].secret as string) : r[0].secret) as Record<string, unknown>
  const files = rows(await db.execute(sql`
    SELECT id, label, name, mime, ghost FROM event_page_files
    WHERE slug = ${slug} AND person = ${person} ORDER BY sort, id`)) as unknown as EventFileMeta[]
  return { ...secret, me: person, files }
}

export async function getFile(slug: string, person: number, id: string) {
  await ensureTables()
  const r = rows(await db.execute(sql`
    SELECT name, mime, data FROM event_page_files
    WHERE slug = ${slug} AND id = ${id} AND person = ${person}`))
  if (!r[0]) return null
  return { name: r[0].name as string, mime: r[0].mime as string, data: r[0].data as Buffer }
}
