import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureContentSchema } from './schema'

/**
 * Formate.
 *
 * Der Vorlaeufer kannte nur eine Textspalte `format` mit Werten wie 'poll' —
 * das ist eine Bauform, kein Format. Ein Format im medialen Sinn hat einen
 * Namen, einen festen Platz in der Woche, eine wiedererkennbare Dramaturgie
 * und mit der Zeit ein eigenes Publikum. "Field Fun Friday" ist etwas, worauf
 * sich Leute einstellen. 'poll' ist es nicht.
 *
 * Ein Format gehoert zu genau einem Kanal. Derselbe Gedanke auf LinkedIn und
 * auf YouTube ist ohnehin ein anderes Format, mit anderer Laenge und anderem
 * Ton — das als eine Sache zu fuehren, verwischt genau die Unterschiede, auf
 * die es ankommt.
 */

export interface ContentFormat {
  id: string; company_id: string; product_id: string | null
  channel: string; name: string; slug: string
  promise: string | null
  dramaturgy: Array<{ label: string; purpose?: string; length?: string }>
  tone: string | null; target_length: string | null
  cadence: string; weekday: number | null; time_of_day: string | null
  rituals: { opener?: string; closer?: string; recurring?: string[] }
  dos: string[]; donts: string[]; pillars: string[]
  segment_key: string | null; status: string; started_at: string | null
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export async function listFormats(companyId: string, channel?: string | null): Promise<ContentFormat[]> {
  await ensureContentSchema()
  const rows = await db.execute(sql`
    SELECT * FROM content_formats
    WHERE company_id = ${companyId} ${channel ? sql`AND channel = ${channel}` : sql``}
    ORDER BY status = 'aktiv' DESC, channel, weekday NULLS LAST, name`)
  return rows as unknown as ContentFormat[]
}

export async function upsertFormat(input: Partial<ContentFormat> & {
  companyId: string; channel: string; name: string
}): Promise<string> {
  await ensureContentSchema()
  const slug = input.slug ?? slugify(input.name)
  const res = await db.execute(sql`
    INSERT INTO content_formats (company_id, product_id, channel, name, slug, promise, dramaturgy, tone,
      target_length, cadence, weekday, time_of_day, rituals, dos, donts, pillars, segment_key, status, started_at)
    VALUES (${input.companyId}, ${input.product_id ?? null}, ${input.channel}, ${input.name}, ${slug},
            ${input.promise ?? null}, ${JSON.stringify(input.dramaturgy ?? [])}::jsonb, ${input.tone ?? null},
            ${input.target_length ?? null}, ${input.cadence ?? 'weekly'}, ${input.weekday ?? null},
            ${input.time_of_day ?? null}, ${JSON.stringify(input.rituals ?? {})}::jsonb,
            ${JSON.stringify(input.dos ?? [])}::jsonb, ${JSON.stringify(input.donts ?? [])}::jsonb,
            ${JSON.stringify(input.pillars ?? [])}::jsonb, ${input.segment_key ?? null},
            ${input.status ?? 'aktiv'}, ${input.started_at ?? null})
    ON CONFLICT (company_id, channel, slug) DO UPDATE SET
      name = EXCLUDED.name, promise = EXCLUDED.promise, dramaturgy = EXCLUDED.dramaturgy,
      tone = EXCLUDED.tone, target_length = EXCLUDED.target_length, cadence = EXCLUDED.cadence,
      weekday = EXCLUDED.weekday, time_of_day = EXCLUDED.time_of_day, rituals = EXCLUDED.rituals,
      dos = EXCLUDED.dos, donts = EXCLUDED.donts, pillars = EXCLUDED.pillars,
      segment_key = EXCLUDED.segment_key, status = EXCLUDED.status, updated_at = now()
    RETURNING id`)
  return (res as unknown as { id: string }[])[0].id
}

/** Die naechste Folgennummer — Formate zaehlen, das ist ein Teil ihrer Wirkung. */
export async function nextEpisodeNo(formatId: string): Promise<number> {
  await ensureContentSchema()
  const rows = await db.execute(sql`
    SELECT COALESCE(MAX(episode_no), 0) + 1 AS n FROM content_format_episodes WHERE format_id = ${formatId}`)
  return Number((rows as unknown as { n: number }[])[0]?.n ?? 1)
}

export async function planEpisode(input: {
  formatId: string; title?: string | null; plannedFor?: string | null; beatId?: string | null
}) {
  await ensureContentSchema()
  const no = await nextEpisodeNo(input.formatId)
  const res = await db.execute(sql`
    INSERT INTO content_format_episodes (format_id, episode_no, title, planned_for, beat_id)
    VALUES (${input.formatId}, ${no}, ${input.title ?? null}, ${input.plannedFor ?? null}, ${input.beatId ?? null})
    RETURNING id, episode_no`)
  return (res as unknown as { id: string; episode_no: number }[])[0]
}

export async function markPublished(episodeId: string, url: string) {
  await ensureContentSchema()
  await db.execute(sql`
    UPDATE content_format_episodes SET published_at = now(), published_url = ${url} WHERE id = ${episodeId}`)
}

/** Das Format als Prompt-Block — die Dramaturgie ist die eigentliche Anweisung. */
export function renderFormat(f: ContentFormat): string {
  const lines = [`Format: ${f.name} (${f.channel})`]
  if (f.promise) lines.push(`Was der Zuschauer jedes Mal bekommt: ${f.promise}`)
  if (f.cadence) lines.push(`Rhythmus: ${f.cadence}${f.weekday != null ? `, Wochentag ${f.weekday}` : ''}${f.time_of_day ? `, ${f.time_of_day}` : ''}`)
  if (f.tone) lines.push(`Ton: ${f.tone}`)
  if (f.target_length) lines.push(`Laenge: ${f.target_length}`)
  if (f.dramaturgy?.length) {
    lines.push('Ablauf:')
    f.dramaturgy.forEach((d, i) => lines.push(`  ${i + 1}. ${d.label}${d.purpose ? ` — ${d.purpose}` : ''}${d.length ? ` (${d.length})` : ''}`))
  }
  if (f.rituals?.opener) lines.push(`Immer gleicher Einstieg: ${f.rituals.opener}`)
  if (f.rituals?.closer) lines.push(`Immer gleicher Ausstieg: ${f.rituals.closer}`)
  if (f.dos?.length) lines.push(`Gehoert dazu: ${f.dos.join(' · ')}`)
  if (f.donts?.length) lines.push(`Gehoert nicht dazu: ${f.donts.join(' · ')}`)
  return lines.join('\n')
}
