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
  // Wave 2.C — AI-Context columns
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS recipient_role TEXT`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS meeting_notes  TEXT`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS program_id     UUID`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS ai_prompt      TEXT`)
  // Wave 2.F — Customer branding + guarantee
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS customer_logo_url    TEXT`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS customer_logo_url_bw TEXT`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS guarantee_text       TEXT`)
  // Wave 3 — Angebots-Annahme: freischaltbare Zahlarten + Rhythmen + Upfront-Rabatt
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS payment_card_enabled    BOOLEAN DEFAULT false`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS payment_invoice_enabled BOOLEAN DEFAULT true`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS rhythm_monthly_enabled  BOOLEAN DEFAULT true`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS rhythm_upfront_enabled  BOOLEAN DEFAULT true`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS upfront_discount_pct    NUMERIC DEFAULT 0`)
  await db.execute(sql`ALTER TABLE offers ADD COLUMN IF NOT EXISTS track JSONB DEFAULT '[]'::jsonb`)  // Bausteine-Track (Phasen -> Schritte)
  // Annahme-Nachweis (v.a. Rechnung): Name/E-Mail + IP + Hash(Timestamp+IP)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS offer_acceptances (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      offer_id     UUID REFERENCES offers(id) ON DELETE CASCADE,
      name         TEXT,
      email        TEXT,
      method       TEXT,          -- card | invoice
      rhythm       TEXT,          -- upfront | monthly
      amount       NUMERIC,
      currency     TEXT DEFAULT 'EUR',
      ip           TEXT,
      accept_hash  TEXT,          -- sha256(offer_id + email + ip + ts)
      user_agent   TEXT,
      created_at   TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS offer_acceptances_offer_idx ON offer_acceptances (offer_id)`)
  await db.execute(sql`ALTER TABLE offer_acceptances ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'pending'`) // pending | confirmed
  await db.execute(sql`ALTER TABLE offer_acceptances ADD COLUMN IF NOT EXISTS doi_token    TEXT`)
  await db.execute(sql`ALTER TABLE offer_acceptances ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`)
  await db.execute(sql`ALTER TABLE offer_acceptances ADD COLUMN IF NOT EXISTS confirmed_ip TEXT`)
  ensured = true
}

export interface OfferRow extends Record<string, unknown> {
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

function slugifyForOfferNumber(s: string): string {
  return s.trim().toUpperCase()
    .replace(/GMBH|AG|UG|KG|OHG|GBR|E\.K\.|LLC|INC|LTD|CORP/gi, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10) || 'KUNDE'
}

/** Get next sequential counter for the current year: AN-YYYY-COMPANY-NNN */
async function nextOfferCounter(year: number): Promise<number> {
  try {
    const prefix = `AN-${year}-`
    const res = await db.execute<{ max: string | null }>(sql`
      SELECT MAX(CAST(SPLIT_PART(offer_number, '-', 4) AS INTEGER)) AS max
      FROM offers
      WHERE offer_number LIKE ${prefix + '%'}
    `)
    const rows = res as unknown as Array<{ max: string | null }>
    const current = rows[0]?.max ? parseInt(String(rows[0].max), 10) : 0
    return (Number.isFinite(current) ? current : 0) + 1
  } catch {
    return 1
  }
}

async function genOfferNumber(customerName: string, customerCompany?: string | null): Promise<string> {
  const year = new Date().getFullYear()
  const base = customerCompany?.trim() || customerName
  const slug = slugifyForOfferNumber(base)
  const counter = await nextOfferCounter(year)
  return `AN-${year}-${slug}-${counter.toString().padStart(3, '0')}`
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
  return res as unknown as OfferRow[]
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
  return res as unknown as OfferRow[]
}

export async function getOfferBySalt(salt: string): Promise<OfferRow | null> {
  await ensureOfferSchema()
  const res = await db.execute<OfferRow>(sql`
    SELECT * FROM offers WHERE access_salt = ${salt} LIMIT 1
  `)
  return (res as unknown as OfferRow[])[0] ?? null
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
  const offerNumber = await genOfferNumber(input.customerName, input.customerCompany)
  const accessSalt = genSalt()
  const res = await db.execute<OfferRow>(sql`
    INSERT INTO offers (offer_number, customer_name, customer_company, customer_email,
                        access_salt, title, subtitle, tagline)
    VALUES (${offerNumber}, ${input.customerName}, ${input.customerCompany ?? null},
            ${input.customerEmail ?? null}, ${accessSalt}, ${input.title},
            ${input.subtitle ?? null}, ${input.tagline ?? null})
    RETURNING *
  `)
  return (res as unknown as OfferRow[])[0]
}

export async function recordOfferEvent(offerId: string, eventType: string, actorEmail?: string | null, metadata?: Record<string, unknown>) {
  // Also emit a global Wave-9 event for webhook subscribers and MCP consumers
  try {
    const { emitAsync } = await import('@/lib/events/emit')
    emitAsync({
      category: 'offer',
      type: `offer.${eventType.replace(/_/g, '.')}`,
      payload: { offerId, actorEmail, metadata },
      source: 'offers-query',
      offerId,
      idempotencyKey: `offer:${offerId}:${eventType}:${Date.now()}`,
    })
  } catch {}

  await ensureOfferSchema()
  await db.execute(sql`
    INSERT INTO offer_events (offer_id, event_type, actor_email, metadata)
    VALUES (${offerId}, ${eventType}, ${actorEmail ?? null}, ${JSON.stringify(metadata ?? {})}::jsonb)
  `)
}

// ─── Update (admin-only, called from server actions) ─────────────────────────
export interface OfferUpdate {
  title?: string
  subtitle?: string | null
  tagline?: string | null
  customerName?: string
  customerCompany?: string | null
  customerEmail?: string | null
  understandingSection?: object
  empathySection?: object
  programs?: object
  economicResults?: object
  sectionOrder?: object
  validUntil?: string  // ISO date
  status?: 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'expired' | 'cancelled'
  // Wave 2.C — AI-Context
  recipientRole?: string | null
  meetingNotes?: string | null
  programId?: string | null
  aiPrompt?: string | null
  sweatEquityEnabled?: boolean
  sweatEquityPercent?: number | null
  // Wave 2.F — Customer branding + guarantee
  customerLogoUrl?: string | null
  customerLogoUrlBw?: string | null
  guaranteeText?: string | null
  // Wave 3 — Zahlarten/Rhythmen für Angebots-Annahme
  paymentCardEnabled?: boolean
  paymentInvoiceEnabled?: boolean
  rhythmMonthlyEnabled?: boolean
  rhythmUpfrontEnabled?: boolean
  upfrontDiscountPct?: number | null
  track?: object
  teamMembers?: string[]
}

export async function updateOffer(id: string, update: OfferUpdate): Promise<void> {
  await ensureOfferSchema()
  // Build SET clauses dynamically using safe parameterised SQL
  const sets: ReturnType<typeof sql>[] = []
  if (update.title !== undefined) sets.push(sql`title = ${update.title}`)
  if (update.subtitle !== undefined) sets.push(sql`subtitle = ${update.subtitle}`)
  if (update.tagline !== undefined) sets.push(sql`tagline = ${update.tagline}`)
  if (update.customerName !== undefined) sets.push(sql`customer_name = ${update.customerName}`)
  if (update.customerCompany !== undefined) sets.push(sql`customer_company = ${update.customerCompany}`)
  if (update.customerEmail !== undefined) sets.push(sql`customer_email = ${update.customerEmail}`)
  if (update.understandingSection !== undefined) sets.push(sql`understanding_section = ${JSON.stringify(update.understandingSection)}::jsonb`)
  if (update.empathySection !== undefined) sets.push(sql`empathy_section = ${JSON.stringify(update.empathySection)}::jsonb`)
  if (update.programs !== undefined) sets.push(sql`programs = ${JSON.stringify(update.programs)}::jsonb`)
  if (update.economicResults !== undefined) sets.push(sql`economic_results = ${JSON.stringify(update.economicResults)}::jsonb`)
  if (update.sectionOrder !== undefined) sets.push(sql`section_order = ${JSON.stringify(update.sectionOrder)}::jsonb`)
  if (update.validUntil !== undefined) sets.push(sql`valid_until = ${update.validUntil}`)
  if (update.status !== undefined) sets.push(sql`status = ${update.status}::offer_status`)
  if (update.recipientRole !== undefined) sets.push(sql`recipient_role = ${update.recipientRole}`)
  if (update.meetingNotes !== undefined) sets.push(sql`meeting_notes = ${update.meetingNotes}`)
  if (update.programId !== undefined) sets.push(sql`program_id = ${update.programId}`)
  if (update.aiPrompt !== undefined) sets.push(sql`ai_prompt = ${update.aiPrompt}`)
  if (update.sweatEquityEnabled !== undefined) sets.push(sql`sweat_equity_enabled = ${update.sweatEquityEnabled}`)
  if (update.sweatEquityPercent !== undefined) sets.push(sql`sweat_equity_percent = ${update.sweatEquityPercent}`)
  if (update.customerLogoUrl !== undefined) sets.push(sql`customer_logo_url = ${update.customerLogoUrl}`)
  if (update.customerLogoUrlBw !== undefined) sets.push(sql`customer_logo_url_bw = ${update.customerLogoUrlBw}`)
  if (update.guaranteeText !== undefined) sets.push(sql`guarantee_text = ${update.guaranteeText}`)
  if (update.paymentCardEnabled !== undefined) sets.push(sql`payment_card_enabled = ${update.paymentCardEnabled}`)
  if (update.paymentInvoiceEnabled !== undefined) sets.push(sql`payment_invoice_enabled = ${update.paymentInvoiceEnabled}`)
  if (update.rhythmMonthlyEnabled !== undefined) sets.push(sql`rhythm_monthly_enabled = ${update.rhythmMonthlyEnabled}`)
  if (update.rhythmUpfrontEnabled !== undefined) sets.push(sql`rhythm_upfront_enabled = ${update.rhythmUpfrontEnabled}`)
  if (update.upfrontDiscountPct !== undefined) sets.push(sql`upfront_discount_pct = ${update.upfrontDiscountPct}`)
  if (update.track !== undefined) sets.push(sql`track = ${JSON.stringify(update.track)}::jsonb`)
  if (update.teamMembers !== undefined) sets.push(sql`team_members = ${JSON.stringify(update.teamMembers)}::jsonb`)
  if (!sets.length) return
  sets.push(sql`updated_at = now()`)
  const joined = sql.join(sets, sql`, `)
  await db.execute(sql`UPDATE offers SET ${joined} WHERE id = ${id}`)
}

export async function getOfferById(id: string): Promise<OfferRow | null> {
  await ensureOfferSchema()
  const res = await db.execute<OfferRow>(sql`SELECT * FROM offers WHERE id = ${id} LIMIT 1`)
  return (res as unknown as OfferRow[])[0] ?? null
}
