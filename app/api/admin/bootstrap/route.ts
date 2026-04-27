/**
 * One-time admin bootstrap endpoint.
 *
 * Steps:
 *   1. Bring DB schema in sync with code (idempotent ALTER + CREATE IF NOT EXISTS)
 *   2. Insert first admin row (refuses 409 if any admin already exists)
 *
 * Removed from repo after first successful call. BOOTSTRAP_TOKEN env var
 * also removed from Vercel.
 */
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { count, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const runtime = 'nodejs'
export const maxDuration = 30

const Schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120),
})

async function syncSchema() {
  // ─── ENUMS (CREATE IF NOT EXISTS) ────────────────────────────────────────
  const enumStmts = [
    `DO $$ BEGIN CREATE TYPE "newsletter_status" AS ENUM ('pending','active','unsubscribed','bounced'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "email_template_type" AS ENUM ('doi_confirmation','doi_welcome','sequence_step','transactional'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "landing_page_status" AS ENUM ('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "landing_page_section_type" AS ENUM ('hero','video','social_proof','problem','solution','features','how_it_works','testimonials','offer','faq','email_capture','cta','coach_bio','spacer'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "email_sequence_trigger" AS ENUM ('newsletter_signup','doi_confirmed','landing_page_signup','program_enrollment','manual'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  ]
  for (const stmt of enumStmts) await db.execute(sql.raw(stmt))

  // ─── USERS table drift ──────────────────────────────────────────────────
  // Rename full_name → name (if old column exists)
  await db.execute(sql.raw(
    `DO $$ BEGIN
       IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name')
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
         ALTER TABLE users RENAME COLUMN full_name TO name;
       END IF;
     END $$;`
  ))
  // Add locale if missing
  await db.execute(sql.raw(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'de';`
  ))
  // Drop obsolete columns (safe — they're not referenced anywhere in code)
  await db.execute(sql.raw(`ALTER TABLE users DROP COLUMN IF EXISTS email_verified;`))
  await db.execute(sql.raw(`ALTER TABLE users DROP COLUMN IF EXISTS linkedin_url;`))

  // ─── NEW TABLES (CREATE IF NOT EXISTS) ──────────────────────────────────
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
      "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "email"           TEXT NOT NULL UNIQUE,
      "first_name"      TEXT,
      "source"          TEXT,
      "status"          "newsletter_status" NOT NULL DEFAULT 'pending',
      "lists"           JSONB,
      "consent_given"   BOOLEAN NOT NULL DEFAULT false,
      "consent_at"      TIMESTAMP,
      "doi_token"       TEXT,
      "doi_sent_at"     TIMESTAMP,
      "doi_confirmed_at" TIMESTAMP,
      "beehiiv_id"      TEXT,
      "beehiiv_synced_at" TIMESTAMP,
      "created_at"      TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at"      TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `))

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "email_templates" (
      "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "type"         "email_template_type" NOT NULL,
      "name"         TEXT NOT NULL,
      "locale"       TEXT NOT NULL DEFAULT 'de',
      "subject"      TEXT NOT NULL,
      "body_html"    TEXT NOT NULL,
      "body_text"    TEXT,
      "from_name"    TEXT DEFAULT 'Eilers+Friends',
      "from_email"   TEXT DEFAULT 'hallo@eilersfriends.com',
      "is_default"   BOOLEAN NOT NULL DEFAULT false,
      "variables"    JSONB DEFAULT '[]'::jsonb,
      "created_at"   TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at"   TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `))

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "landing_pages" (
      "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "slug"             TEXT NOT NULL UNIQUE,
      "title"            TEXT NOT NULL,
      "meta_description" TEXT,
      "og_image_url"     TEXT,
      "status"           "landing_page_status" NOT NULL DEFAULT 'draft',
      "email_list"       TEXT,
      "email_sequence_id" UUID,
      "utm_source"       TEXT,
      "locale"           TEXT NOT NULL DEFAULT 'de',
      "accent_color"     TEXT,
      "created_at"       TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at"       TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `))

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "landing_page_sections" (
      "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "landing_page_id"  UUID NOT NULL REFERENCES "landing_pages"("id") ON DELETE CASCADE,
      "type"             "landing_page_section_type" NOT NULL,
      "order"            INTEGER NOT NULL DEFAULT 0,
      "is_visible"       BOOLEAN NOT NULL DEFAULT true,
      "content"          JSONB NOT NULL DEFAULT '{}'::jsonb,
      "created_at"       TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at"       TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `))

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "email_sequences" (
      "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name"           TEXT NOT NULL,
      "description"    TEXT,
      "trigger"        "email_sequence_trigger" NOT NULL,
      "trigger_filter" JSONB,
      "is_active"      BOOLEAN NOT NULL DEFAULT false,
      "locale"         TEXT NOT NULL DEFAULT 'de',
      "created_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at"     TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `))

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "email_sequence_steps" (
      "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "sequence_id"  UUID NOT NULL REFERENCES "email_sequences"("id") ON DELETE CASCADE,
      "template_id"  UUID NOT NULL REFERENCES "email_templates"("id"),
      "order"        INTEGER NOT NULL DEFAULT 0,
      "delay_hours"  INTEGER NOT NULL DEFAULT 0,
      "is_active"    BOOLEAN NOT NULL DEFAULT true,
      "created_at"   TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `))

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "email_sequence_enrollments" (
      "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "subscriber_id" UUID NOT NULL REFERENCES "newsletter_subscribers"("id") ON DELETE CASCADE,
      "sequence_id"   UUID NOT NULL REFERENCES "email_sequences"("id") ON DELETE CASCADE,
      "current_step"  INTEGER NOT NULL DEFAULT 0,
      "status"        TEXT NOT NULL DEFAULT 'active',
      "enrolled_at"   TIMESTAMP NOT NULL DEFAULT NOW(),
      "next_send_at"  TIMESTAMP,
      "last_sent_at"  TIMESTAMP,
      "completed_at"  TIMESTAMP
    );
  `))
}

export async function POST(request: Request) {
  const expected = process.env.BOOTSTRAP_TOKEN
  if (!expected) {
    return NextResponse.json({ error: 'bootstrap disabled' }, { status: 503 })
  }
  const auth = request.headers.get('authorization') || ''
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  // Step 1: schema sync
  try {
    await syncSchema()
  } catch (err) {
    return NextResponse.json({ error: 'schema sync failed', detail: String(err) }, { status: 500 })
  }

  // Step 2: refuse if any admin already exists
  try {
    const [{ value: adminCount } = { value: 0 }] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role, 'admin'))
    if ((adminCount ?? 0) > 0) {
      return NextResponse.json({ error: 'admin already exists' }, { status: 409 })
    }
  } catch (err) {
    return NextResponse.json({ error: 'count check failed', detail: String(err) }, { status: 500 })
  }

  // Step 3: insert admin
  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  try {
    await db.insert(users).values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: 'admin',
    })
  } catch (err) {
    return NextResponse.json({ error: 'insert failed', detail: String(err) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email: parsed.data.email, role: 'admin', schemaSynced: true })
}
