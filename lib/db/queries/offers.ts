import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import crypto from 'crypto'

/**
 * Self-healing CREATE TABLE on every offer-related read.
 * This mirrors the pattern in trust-logos.ts so we don't have to
 * run the migration manually — the first DB hit ensures the schema
 * exists. Idempotent (CREATE TABLE IF NOT EXISTS).
 */
let ensured = false
async function ensureOfferSchema() {
  if (ensured) return
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='offer_status') THEN
        CREATE TYPE offer_status AS ENUM ('draft','sent','viewed','signed','paid','expired','cancelled');
      END IF;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='client' AND enumtypid='user_role'::regtype) THEN
        ALTER TYPE user_role ADD VALUE 'client';
      END IF;
    EXCEPTION WHEN undefined_object THEN
      -- user_role type doesn't exist yet — created elsewhere
      NULL;
    END $$;
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS offers (
      id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      offer_number                VARCHAR(64) NOT NULL UNIQUE,
      customer_name               VARCHAR(255) NOT NULL,
      customer_company            VARCHAR(255),
      customer_email              VARCHAR(255),
      customer_user_id            UUID,
      access_salt                 VARCHAR(64) NOT NULL UNIQUE,
      title                       VARCHAR(255) NOT NULL,
      subtitle                    TEXT,
      tagline                     TEXT,
      understanding_section       JSONB DEFAULT '{}'::jsonb,
      empathy_section             JSONB DEFAULT '{}'::jsonb,
      intro_sections              JSONB DEFAULT '[]'::jsonb,
      programs                    JSONB DEFAULT '[]'::jsonb,
      partner_logos               JSONB DEFAULT '[]'::jsonb,
      section_order               JSONB DEFAULT '[]'::jsonb,
      timeline_start_date         DATE,
      timeline_rhythm_weeks       INTEGER DEFAULT 2,
      timeline_breaks             JSONB DEFAULT '[]'::jsonb,
      sweat_equity_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
      sweat_equity_percent        INTEGER,
      economic_results            JSONB DEFAULT '[]'::jsonb,
      valid_from                  TIMESTAMPTZ NOT NULL DEFAULT now(),
      valid_until                 TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '3 weeks'),
      status                      offer_status NOT NULL DEFAULT 'draft',
      signed_at                   TIMESTAMPTZ,
      signed_by_name              VARCHAR(255),
      signed_by_email             VARCHAR(255),
      signature_data              TEXT,
      selected_pricing_option     VARCHAR(64),
      stripe_checkout_session_id  VARCHAR(255),
      stripe_payment_intent_id    VARCHAR(255),
      paid_at                     TIMESTAMPTZ,
      version_number              INTEGER NOT NULL DEFAULT 1,
      parent_offer_id             UUID,
      created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS offers_access_salt_idx   ON offers (access_salt)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS offers_customer_user_idx ON offers (customer_user_id)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS offers_status_idx        ON offers (status)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS offer_events (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      offer_id     UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
      event_type   VARCHAR(32) NOT NULL,
      actor_email  VARCHAR(255),
      metadata     JSONB DEFAULT '{}'::jsonb,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS offer_events_offer_idx ON offer_events (offer_id)`)
  ensured = true
}

export interface OfferRow {
  id: string
  offer_number: string
  customer_name: string
  customer_company: string | null
  customer_email: string | null
  access_salt: string
  title: string
  subtitle: string | null
  tagline: string | null
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'expired' | 'cancelled'
  valid_from: string
  valid_until: string
  selected_pricing_option: string | null
  created_at: string
  updated_at: string
}

function genSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

function genOfferNumber(customerName: string): string {
  const year = new Date().getFullYear().toString().slice(-2)
  const slug = customerName
    .trim().toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4) || 'XXXX'
  const ts = Math.floor(Date.now() / 1000).toString(36).toUpperCase().slice(-4)
  return `${slug}-${year}-${ts}`
}

export async function listOffersForAdmin(): Promise<OfferRow[]> {
  await ensureOfferSchema()
  const res = await db.execute<OfferRow>(sql`
    SELECT id, offer_number, customer_name, customer_company, customer_email,
           access_salt, title, subtitle, tagline, status,
           valid_from, valid_until, selected_pricing_option, created_at, updated_at
    FROM offers
    ORDER BY created_at DESC
  `)
  return res.rows
}

export async function listOffersForUser(userId: string): Promise<OfferRow[]> {
  await ensureOfferSchema()
  const res = await db.execute<OfferRow>(sql`
    SELECT id, offer_number, customer_name, customer_company, customer_email,
           access_salt, title, subtitle, tagline, status,
           valid_from, valid_until, selected_pricing_option, created_at, updated_at
    FROM offers
    WHERE customer_user_id = ${userId}
    ORDER BY created_at DESC
  `)
  return res.rows
}

export async function getOfferBySalt(salt: string): Promise<OfferRow | null> {
  await ensureOfferSchema()
  const res = await db.execute<OfferRow>(sql`
    SELECT * FROM offers WHERE access_salt = ${salt} LIMIT 1
  `)
  return res.rows[0] ?? null
}

export async function createOffer(input: {
  customerName: string
  customerCompany?: string | null
  customerEmail?: string | null
  title: string
  subtitle?: string | null
  tagline?: string | null
}): Promise<OfferRow> {
  await ensureOfferSchema()
  const offerNumber = genOfferNumber(input.customerName)
  const accessSalt = genSalt()
  const res = await db.execute<OfferRow>(sql`
    INSERT INTO offers (offer_number, customer_name, customer_company, customer_email,
                        access_salt, title, subtitle, tagline)
    VALUES (${offerNumber}, ${input.customerName}, ${input.customerCompany ?? null},
            ${input.customerEmail ?? null}, ${accessSalt}, ${input.title},
            ${input.subtitle ?? null}, ${input.tagline ?? null})
    RETURNING *
  `)
  return res.rows[0]
}

export async function recordOfferEvent(offerId: string, eventType: string, actorEmail?: string | null, metadata?: Record<string, unknown>) {
  await ensureOfferSchema()
  await db.execute(sql`
    INSERT INTO offer_events (offer_id, event_type, actor_email, metadata)
    VALUES (${offerId}, ${eventType}, ${actorEmail ?? null}, ${JSON.stringify(metadata ?? {})}::jsonb)
  `)
}
