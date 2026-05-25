// ============================================================
// Wizard v2 · Self-Heal Migrations
// ============================================================
// CREATE TABLE IF NOT EXISTS — idempotent, kein drizzle-kit push nötig.
// Wird in jeder v2-API-Route am Anfang aufgerufen.

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

let v2EnsuredAt = 0
const TTL_MS = 60_000

export async function ensureBauplanV2Tables() {
  const now = Date.now()
  if (now - v2EnsuredAt < TTL_MS) return
  v2EnsuredAt = now

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_drafts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      product_slug TEXT NOT NULL DEFAULT 'b2b-angebote',
      title TEXT NOT NULL DEFAULT 'Mein B2B-Bauplan',
      language TEXT NOT NULL DEFAULT 'de',
      current_step_key TEXT NOT NULL DEFAULT '00-welcome',
      total_points INT NOT NULL DEFAULT 0,
      maximum_budget JSONB,
      published_at TIMESTAMPTZ,
      pdf_bauplan_url TEXT,
      pdf_onepager_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bauplan_drafts_user ON bauplan_drafts(user_id, product_slug)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_step_states (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      step_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked',
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      skipped_at TIMESTAMPTZ,
      points_awarded INT NOT NULL DEFAULT 0,
      UNIQUE (bauplan_id, step_key)
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_business_context (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL UNIQUE REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      market_position TEXT,
      target_market TEXT,
      business_model TEXT,
      business_model_free_text TEXT,
      competitive_positioning TEXT,
      researched_at TIMESTAMPTZ,
      created_by TEXT NOT NULL DEFAULT 'user',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_product (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL UNIQUE REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      product_name TEXT,
      product_type TEXT,
      product_summary TEXT,
      product_url TEXT,
      product_stage TEXT,
      researched_at TIMESTAMPTZ,
      created_by TEXT NOT NULL DEFAULT 'user',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_building_blocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      is_bonus BOOLEAN NOT NULL DEFAULT false,
      "order" INT NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_icp (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL UNIQUE REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      demographics JSONB NOT NULL DEFAULT '{}'::jsonb,
      currencies JSONB NOT NULL DEFAULT '[]'::jsonb,
      pains_gains JSONB NOT NULL DEFAULT '[]'::jsonb,
      interview_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
      researched_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_challenges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      topic TEXT NOT NULL,
      reality TEXT NOT NULL DEFAULT '',
      economic_impact TEXT NOT NULL DEFAULT '',
      kpi TEXT NOT NULL DEFAULT '',
      "order" INT NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_beef_radar_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      building_block_id UUID NOT NULL REFERENCES bauplan_building_blocks(id) ON DELETE CASCADE,
      "column" TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT 'user'
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_future_problems (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      problem TEXT NOT NULL,
      trigger TEXT NOT NULL DEFAULT '',
      solved_through UUID REFERENCES bauplan_building_blocks(id) ON DELETE SET NULL,
      solved_through_free_text TEXT,
      marginal_cost TEXT,
      "order" INT NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL DEFAULT 'user'
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_economic_clusters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      cluster_name TEXT NOT NULL,
      economic_value_per_unit BIGINT NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'company/year',
      confidence_level TEXT NOT NULL DEFAULT 'hypothese',
      methodology TEXT NOT NULL DEFAULT '',
      contained_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
      "order" INT NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL DEFAULT 'user'
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_bulletproof_plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL UNIQUE REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      starting_pain TEXT NOT NULL DEFAULT '',
      start_symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
      end_goal TEXT NOT NULL DEFAULT '',
      end_proof_points JSONB NOT NULL DEFAULT '[]'::jsonb,
      headline_promise TEXT NOT NULL DEFAULT '',
      phases JSONB NOT NULL DEFAULT '[]'::jsonb,
      roadmap_svg_path TEXT,
      rendered_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_phase_currencies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      phase_id TEXT NOT NULL,
      metric TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT '',
      baseline TEXT NOT NULL DEFAULT '',
      pessimistic TEXT NOT NULL DEFAULT '',
      realistic TEXT NOT NULL DEFAULT '',
      optimistic TEXT NOT NULL DEFAULT '',
      measured_at TEXT NOT NULL DEFAULT '',
      is_primary BOOLEAN NOT NULL DEFAULT true
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_pricing (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL UNIQUE REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
      marktest_reasoning TEXT NOT NULL DEFAULT '',
      anti_glatt_check BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_scarcity (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL UNIQUE REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      scarcity_type TEXT NOT NULL,
      scarcity_reason TEXT NOT NULL DEFAULT '',
      scarcity_proof JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_real BOOLEAN NOT NULL DEFAULT false
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_risk_reversal (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL UNIQUE REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      reversal_type TEXT NOT NULL,
      trigger_condition TEXT NOT NULL DEFAULT '',
      consequence TEXT NOT NULL DEFAULT '',
      anchor_phase_id TEXT,
      anchor_currency_id TEXT,
      espresso_test BOOLEAN NOT NULL DEFAULT false,
      refund_deadline INT
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_offer_identity (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL UNIQUE REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      subheadline TEXT,
      headline TEXT NOT NULL DEFAULT '',
      cta TEXT NOT NULL DEFAULT '',
      cta_secondary TEXT,
      generated_variants JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bauplan_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bauplan_id UUID NOT NULL REFERENCES bauplan_drafts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      step_key TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      points_delta INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bauplan_events_draft ON bauplan_events(bauplan_id, created_at DESC)`)
}
