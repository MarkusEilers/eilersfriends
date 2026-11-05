import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Baustein-Bibliothek: je Modultyp die zuletzt gespeicherte Fassung.
 * Wer ein Modul neu in eine Seite einfügt, startet mit diesem Inhalt statt leer.
 */

let ready = false
async function ensure() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lp_module_library (
      type        TEXT PRIMARY KEY,
      content     JSONB NOT NULL,
      page_slug   TEXT,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  ready = true
}

export async function rememberModule(type: string, content: Record<string, unknown>, pageSlug: string | null) {
  if (!content || Object.keys(content).length === 0) return
  await ensure()
  await db.execute(sql`
    INSERT INTO lp_module_library (type, content, page_slug, updated_at) VALUES (${type}, ${JSON.stringify(content)}::jsonb, ${pageSlug}, now())
    ON CONFLICT (type) DO UPDATE SET content = excluded.content, page_slug = excluded.page_slug, updated_at = now()`)
}

export interface LibraryEntry { type: string; content: Record<string, unknown>; page_slug: string | null; updated_at: string }
export async function listModuleLibrary(): Promise<LibraryEntry[]> {
  await ensure()
  const r = await db.execute(sql`SELECT type, content, page_slug, updated_at FROM lp_module_library`)
  return (Array.isArray(r) ? r : ((r as unknown as { rows?: LibraryEntry[] }).rows ?? [])) as LibraryEntry[]
}
