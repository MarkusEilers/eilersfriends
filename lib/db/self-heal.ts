import { sql } from 'drizzle-orm'
import { db } from './index'

let healedAnalytics = false
let healedWizard = false
let healedPrompts = false
let healedCompany = false

export async function ensureAnalyticsTables(): Promise<void> {
  if (healedAnalytics) return
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
    healedAnalytics = true
  } catch (err) { console.error('[self-heal] analytics failed:', err) }
}

export async function ensureWizardTables(): Promise<void> {
  if (healedWizard) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_framework_state" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "framework_slug" text NOT NULL,
        "current_step" integer DEFAULT 0 NOT NULL,
        "step_answers" json DEFAULT '{}'::json,
        "progress" integer DEFAULT 0 NOT NULL,
        "status" text DEFAULT 'active' NOT NULL,
        "started_at" timestamp DEFAULT now() NOT NULL,
        "completed_at" timestamp,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT user_framework_unique UNIQUE ("user_id", "framework_slug")
      );
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "ufs_user_slug_idx" ON "user_framework_state" ("user_id", "framework_slug");`)
    healedWizard = true
  } catch (err) { console.error('[self-heal] wizard failed:', err) }
}

export async function ensurePromptTables(): Promise<void> {
  if (healedPrompts) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "framework_step_prompts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "framework_slug" text NOT NULL,
        "step_key" text NOT NULL,
        "system_prompt" text NOT NULL,
        "input_schema" json DEFAULT '{}'::json,
        "output_schema" json DEFAULT '{}'::json,
        "voice" text,
        "framework" text,
        "model" text DEFAULT 'gpt-4o-mini',
        "temperature" real DEFAULT 0.5,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT framework_step_unique UNIQUE ("framework_slug", "step_key")
      );
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "fsp_slug_key_idx" ON "framework_step_prompts" ("framework_slug", "step_key");`)
    healedPrompts = true
  } catch (err) { console.error('[self-heal] prompts failed:', err) }
}

/** GoToMarket data area — reused across frameworks/skills */
export async function ensureCompanyProfile(): Promise<void> {
  if (healedCompany) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "company_profile" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "organisation_name" text,
        "website" text,
        "summary" text,
        "value_proposition" text,
        "target_audience" text,
        "tone" text,
        "keywords" json DEFAULT '[]'::json,
        "brand_color" text,
        "accent_color" text,
        "logo_url" text,
        "industry" text,
        "products" json DEFAULT '[]'::json,
        "last_analysed_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT company_profile_user_unique UNIQUE ("user_id")
      );
    `)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "cp_user_idx" ON "company_profile" ("user_id");`)
    healedCompany = true
  } catch (err) { console.error('[self-heal] company_profile failed:', err) }
}
