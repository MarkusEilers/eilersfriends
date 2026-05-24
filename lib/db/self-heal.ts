import { sql } from 'drizzle-orm'
import { db } from './index'

let healed = false

/**
 * Idempotent table creation for page_views. The events table is handled by
 * lib/events/emit.ts (Wave 9). Safe to call from API routes.
 */
export async function ensureAnalyticsTables(): Promise<void> {
  if (healed) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "page_views" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "path" text NOT NULL,
        "locale" text DEFAULT 'de' NOT NULL,
        "session_hash" text,
        "referrer_host" text,
        "ua_class" text,
        "country" text,
        "utm_source" text,
        "utm_medium" text,
        "utm_campaign" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "page_views_created_at_idx" ON "page_views" ("created_at" DESC);`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "page_views_path_idx" ON "page_views" ("path");`)
    healed = true
  } catch (err) {
    console.error('[self-heal] ensureAnalyticsTables failed:', err)
  }
}
