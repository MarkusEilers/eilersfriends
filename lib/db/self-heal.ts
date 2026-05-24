import { sql } from 'drizzle-orm'
import { db } from './index'

// Memoize so we only run the CREATE statements once per cold start.
let healed = false

/**
 * Idempotent table creation for analytics tables.
 * Runs on first call only. Safe to call from API routes — non-blocking
 * for routes that don't depend on these tables existing.
 *
 * Why this exists: instead of requiring `drizzle-kit push` before every deploy,
 * the analytics tables provision themselves on first hit. This is fine for
 * append-only tables with no FK dependencies on other newly-added schemas.
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

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "site_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "category" text NOT NULL,
        "event_type" text NOT NULL,
        "title" text NOT NULL,
        "summary" text,
        "ref_type" text,
        "ref_id" uuid,
        "actor_id" uuid,
        "metadata" json DEFAULT '{}'::json,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "site_events_created_at_idx" ON "site_events" ("created_at" DESC);`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "site_events_category_idx" ON "site_events" ("category");`)

    healed = true
  } catch (err) {
    // Don't crash the route — log and let the next call retry.
    console.error('[self-heal] ensureAnalyticsTables failed:', err)
  }
}
