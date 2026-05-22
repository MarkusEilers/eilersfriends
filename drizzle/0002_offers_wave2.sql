-- =============================================================================
-- Wave 2 — Offers + Templates + Events (idempotent)
-- Paste into Supabase SQL Editor and run once
-- =============================================================================

-- Add 'client' to user_role enum (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'client' AND enumtypid = 'user_role'::regtype
  ) THEN
    ALTER TYPE "user_role" ADD VALUE 'client';
  END IF;
END $$;

-- Offer-related enums
CREATE TYPE IF NOT EXISTS "offer_status" AS ENUM ('draft', 'sent', 'viewed', 'signed', 'paid', 'expired', 'cancelled');
CREATE TYPE IF NOT EXISTS "offer_track_type" AS ENUM ('main', 'parallel', 'combined');
CREATE TYPE IF NOT EXISTS "offer_pricing_type" AS ENUM ('DIY', 'DWY', 'DFY');

-- ─── OFFERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "offers" (
  "id"                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "offer_number"                VARCHAR(64) NOT NULL UNIQUE,
  -- Customer
  "customer_name"               VARCHAR(255) NOT NULL,
  "customer_company"            VARCHAR(255),
  "customer_email"              VARCHAR(255),
  "customer_user_id"            UUID REFERENCES "users"("id") ON DELETE SET NULL,
  -- Secret access
  "access_salt"                 VARCHAR(64) NOT NULL UNIQUE,
  -- Headlines
  "title"                       VARCHAR(255) NOT NULL,
  "subtitle"                    TEXT,
  "tagline"                     TEXT,
  -- Content blobs
  "understanding_section"       JSONB DEFAULT '{}'::jsonb,
  "empathy_section"             JSONB DEFAULT '{}'::jsonb,
  "intro_sections"              JSONB DEFAULT '[]'::jsonb,
  "programs"                    JSONB DEFAULT '[]'::jsonb,
  "partner_logos"               JSONB DEFAULT '[]'::jsonb,
  "section_order"               JSONB DEFAULT '[]'::jsonb,
  -- Timeline
  "timeline_start_date"         DATE,
  "timeline_rhythm_weeks"       INTEGER DEFAULT 2,
  "timeline_breaks"             JSONB DEFAULT '[]'::jsonb,
  -- Sweat Equity
  "sweat_equity_enabled"        BOOLEAN NOT NULL DEFAULT FALSE,
  "sweat_equity_percent"        INTEGER,
  -- Economic results
  "economic_results"            JSONB DEFAULT '[]'::jsonb,
  -- Validity
  "valid_from"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "valid_until"                 TIMESTAMPTZ NOT NULL,
  -- Status
  "status"                      "offer_status" NOT NULL DEFAULT 'draft',
  -- Signature
  "signed_at"                   TIMESTAMPTZ,
  "signed_by_name"              VARCHAR(255),
  "signed_by_email"             VARCHAR(255),
  "signature_data"              TEXT,
  "selected_pricing_option"     VARCHAR(64),
  -- Stripe
  "stripe_checkout_session_id"  VARCHAR(255),
  "stripe_payment_intent_id"    VARCHAR(255),
  "paid_at"                     TIMESTAMPTZ,
  -- Versioning
  "version_number"              INTEGER NOT NULL DEFAULT 1,
  "parent_offer_id"             UUID,
  "created_at"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "offers_access_salt_idx"     ON "offers" ("access_salt");
CREATE INDEX IF NOT EXISTS "offers_customer_user_idx"   ON "offers" ("customer_user_id");
CREATE INDEX IF NOT EXISTS "offers_status_idx"          ON "offers" ("status");
CREATE INDEX IF NOT EXISTS "offers_parent_offer_idx"    ON "offers" ("parent_offer_id");

-- ─── BUILDING BLOCK TEMPLATES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "offer_building_block_templates" (
  "id"                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"                       VARCHAR(255) NOT NULL,
  "description"                 TEXT,
  "roles"                       JSONB DEFAULT '[]'::jsonb,
  "inputs"                      JSONB DEFAULT '[]'::jsonb,
  "outputs"                     JSONB DEFAULT '[]'::jsonb,
  "duration_days"               INTEGER DEFAULT 1,
  "sort_order"                  INTEGER DEFAULT 0,
  "created_at"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PHASE TEMPLATES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "offer_phase_templates" (
  "id"                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "number"                      INTEGER NOT NULL,
  "title"                       VARCHAR(255) NOT NULL,
  "description"                 TEXT,
  "color"                       VARCHAR(32) DEFAULT 'gray',
  "sort_order"                  INTEGER DEFAULT 0,
  "created_at"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PHASE ↔ BUILDING BLOCK JUNCTION ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "offer_phase_building_blocks" (
  "id"                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "phase_template_id"           UUID NOT NULL REFERENCES "offer_phase_templates"("id") ON DELETE CASCADE,
  "building_block_template_id"  UUID NOT NULL REFERENCES "offer_building_block_templates"("id") ON DELETE CASCADE,
  "sort_order"                  INTEGER DEFAULT 0,
  "created_at"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("phase_template_id", "building_block_template_id")
);

-- ─── INFOTAINMENT TEMPLATES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "offer_infotainment_templates" (
  "id"                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"                       VARCHAR(255) NOT NULL,
  "type"                        VARCHAR(32) NOT NULL DEFAULT 'mixed',
  "content"                     TEXT,
  "image_url"                   TEXT,
  "video_url"                   TEXT,
  "layout"                      VARCHAR(16) DEFAULT 'left',
  "sort_order"                  INTEGER DEFAULT 0,
  "is_active"                   BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── OFFER EVENTS (audit trail) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "offer_events" (
  "id"                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "offer_id"                    UUID NOT NULL REFERENCES "offers"("id") ON DELETE CASCADE,
  "event_type"                  VARCHAR(32) NOT NULL,
  "actor_email"                 VARCHAR(255),
  "metadata"                    JSONB DEFAULT '{}'::jsonb,
  "created_at"                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "offer_events_offer_idx" ON "offer_events" ("offer_id");
CREATE INDEX IF NOT EXISTS "offer_events_type_idx"  ON "offer_events" ("event_type");
