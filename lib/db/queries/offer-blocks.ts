import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Freie Inhalts-Blöcke für Angebote + lernende FAQ-Bibliothek.
 *
 * Statt für jeden neuen Abschnitt eine eigene Sektion zu programmieren, bekommt
 * ein Angebot beliebig viele Blöcke. Ein Block kann auch Schritte aus einem
 * Programm/Training referenzieren (kind='program_steps') — die werden live aus
 * program_phases/program_steps gelesen, nicht kopiert.
 */

export type BlockKind =
  | 'richtext'      // freier Text
  | 'checklist'     // abhakbare Punkte ("Lass uns diese Liste durchgehen")
  | 'metrics'       // Zahlen-Tabelle (Refinanzierung, Zielrechnung)
  | 'quote'         // Zitat-/Beispielkasten
  | 'faq'           // Fragen & Antworten (aus der Bibliothek)
  | 'trustbar'      // Logos + Kundenstimmen
  | 'bullets'       // einfache Aufzählung ("Was Ihr einbringt")
  | 'program_steps' // Schritte aus einem Programm/Training

let ensured = false

export async function ensureBlockSchema() {
  if (ensured) return

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS offer_blocks (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      offer_id   UUID REFERENCES offers(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL,
      title      TEXT,
      subtitle   TEXT,
      body       TEXT,
      data       JSONB NOT NULL DEFAULT '{}'::jsonb,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_visible BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS offer_blocks_offer_idx ON offer_blocks (offer_id, sort_order)`)

  // Lernende FAQ-Bibliothek: einmal formuliert, in jedem weiteren Angebot verfügbar.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS faq_library (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question     TEXT NOT NULL,
      answer       TEXT NOT NULL,
      tags         TEXT[] DEFAULT ARRAY[]::TEXT[],
      usage_count  INTEGER NOT NULL DEFAULT 0,
      last_used_at TIMESTAMPTZ,
      source_offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      created_at   TIMESTAMPTZ DEFAULT now(),
      updated_at   TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS faq_library_question_idx ON faq_library (lower(question))`)

  // Garantie-Staffel am Angebot
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS guarantee_tiers JSONB DEFAULT '[]'::jsonb`)

  ensured = true
}

export interface OfferBlock {
  id: string
  offer_id: string
  kind: BlockKind
  title: string | null
  subtitle: string | null
  body: string | null
  data: Record<string, unknown>
  sort_order: number
  is_visible: boolean
}

export async function listBlocks(offerId: string): Promise<OfferBlock[]> {
  await ensureBlockSchema()
  const res = await db.execute(sql`
    SELECT * FROM offer_blocks WHERE offer_id = ${offerId} ORDER BY sort_order, created_at`)
  return res as unknown as OfferBlock[]
}

export async function listVisibleBlocks(offerId: string): Promise<OfferBlock[]> {
  const all = await listBlocks(offerId)
  return all.filter((b) => b.is_visible)
}

/** Setzt die Blockliste eines Angebots neu (Reihenfolge = Array-Reihenfolge). */
export async function replaceBlocks(offerId: string, blocks: Array<{
  id?: string; kind: BlockKind; title?: string | null; subtitle?: string | null
  body?: string | null; data?: unknown; isVisible?: boolean
}>) {
  await ensureBlockSchema()
  const keep = blocks.map((b) => b.id).filter(Boolean) as string[]
  if (keep.length) {
    await db.execute(sql`DELETE FROM offer_blocks WHERE offer_id = ${offerId} AND id NOT IN (${sql.join(keep.map((k) => sql`${k}::uuid`), sql`, `)})`)
  } else {
    await db.execute(sql`DELETE FROM offer_blocks WHERE offer_id = ${offerId}`)
  }
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const payload = JSON.stringify(b.data ?? {})
    if (b.id) {
      await db.execute(sql`
        UPDATE offer_blocks SET kind=${b.kind}, title=${b.title ?? null}, subtitle=${b.subtitle ?? null},
          body=${b.body ?? null}, data=${payload}::jsonb, sort_order=${i},
          is_visible=${b.isVisible ?? true}, updated_at=now()
        WHERE id=${b.id} AND offer_id=${offerId}`)
    } else {
      await db.execute(sql`
        INSERT INTO offer_blocks (offer_id, kind, title, subtitle, body, data, sort_order, is_visible)
        VALUES (${offerId}, ${b.kind}, ${b.title ?? null}, ${b.subtitle ?? null}, ${b.body ?? null},
                ${payload}::jsonb, ${i}, ${b.isVisible ?? true})`)
    }
  }
  return listBlocks(offerId)
}

/* ── FAQ-Bibliothek ──────────────────────────────────────────────────────── */

export interface FaqEntry {
  id: string
  question: string
  answer: string
  tags: string[]
  usage_count: number
  is_active: boolean
}

export async function listFaqLibrary(search?: string): Promise<FaqEntry[]> {
  await ensureBlockSchema()
  const res = search
    ? await db.execute(sql`
        SELECT * FROM faq_library WHERE is_active
          AND (question ILIKE ${'%' + search + '%'} OR answer ILIKE ${'%' + search + '%'})
        ORDER BY usage_count DESC, created_at DESC LIMIT 50`)
    : await db.execute(sql`SELECT * FROM faq_library WHERE is_active ORDER BY usage_count DESC, created_at DESC LIMIT 50`)
  return res as unknown as FaqEntry[]
}

/**
 * Schreibt Fragen aus einem Angebot in die Bibliothek zurück — so wächst der
 * Bestand mit jedem Angebot. Bekannte Fragen erhöhen nur ihren Zähler.
 */
export async function learnFaqs(entries: { question: string; answer: string; tags?: string[] }[], sourceOfferId?: string | null) {
  await ensureBlockSchema()
  for (const e of entries) {
    const q = e.question.trim(); const a = e.answer.trim()
    if (!q || !a) continue
    await db.execute(sql`
      INSERT INTO faq_library (question, answer, tags, usage_count, last_used_at, source_offer_id)
      VALUES (${q}, ${a}, ${sql`${e.tags ?? []}::text[]`}, 1, now(), ${sourceOfferId ?? null})
      ON CONFLICT (lower(question)) DO UPDATE SET
        usage_count = faq_library.usage_count + 1,
        last_used_at = now(),
        answer = CASE WHEN length(EXCLUDED.answer) > length(faq_library.answer) THEN EXCLUDED.answer ELSE faq_library.answer END,
        updated_at = now()`)
  }
}

export async function upsertFaq(entry: { id?: string; question: string; answer: string; tags?: string[] }) {
  await ensureBlockSchema()
  if (entry.id) {
    await db.execute(sql`
      UPDATE faq_library SET question=${entry.question}, answer=${entry.answer},
        tags=${sql`${entry.tags ?? []}::text[]`}, updated_at=now() WHERE id=${entry.id}`)
    return
  }
  await learnFaqs([entry], null)
}

export async function deactivateFaq(id: string) {
  await ensureBlockSchema()
  await db.execute(sql`UPDATE faq_library SET is_active=false, updated_at=now() WHERE id=${id}`)
}

/* ── Programm-Schritte für Blöcke vom Typ 'program_steps' ────────────────── */

export interface ProgramStepGroup {
  phase: string
  goal: string | null
  steps: { title: string; description: string | null; type: string | null }[]
}

/** Liest Phasen + Schritte eines Programms live — Blöcke referenzieren, statt zu kopieren. */
export async function programSteps(programId: string): Promise<ProgramStepGroup[]> {
  const res = await db.execute(sql`
    SELECT ph.name AS phase, ph.goal,
           COALESCE(json_agg(json_build_object('title', st.title, 'description', st.description, 'type', st.type)
             ORDER BY st.sort_order) FILTER (WHERE st.id IS NOT NULL), '[]'::json) AS steps
    FROM program_phases ph
    LEFT JOIN program_steps st ON st.phase_id = ph.id
    WHERE ph.program_id = ${programId}
    GROUP BY ph.id, ph.name, ph.goal, ph.sort_order
    ORDER BY ph.sort_order
  `).catch(() => [] as unknown)
  return (res as unknown as ProgramStepGroup[]) ?? []
}
