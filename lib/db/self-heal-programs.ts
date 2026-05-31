// lib/db/self-heal-programs.ts
// programs + user_program_access — Stripe-backed checkout entities
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

let ensuredAt = 0
const TTL_MS = 60_000

export async function ensureProgramsTables() {
  const now = Date.now()
  if (now - ensuredAt < TTL_MS) return
  ensuredAt = now

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS programs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tagline TEXT,
      category TEXT NOT NULL DEFAULT 'membership',
      pricing_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
      checkout_content JSONB NOT NULL DEFAULT '{}'::jsonb,
      linked_frameworks JSONB NOT NULL DEFAULT '[]'::jsonb,
      delivery_format TEXT,
      enrollment_limit INT,
      enrollment_deadline TIMESTAMPTZ,
      stripe_product_id TEXT,
      brand_color TEXT,
      cover_image_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_paywall_for_wizard BOOLEAN NOT NULL DEFAULT false,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active, slug)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_program_access (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      pricing_tier_id TEXT NOT NULL,
      stripe_session_id TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      paid_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'pending',
      billing_data JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_upa_user ON user_program_access(user_id, status)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_upa_session ON user_program_access(stripe_session_id)`)

  // Pending checkout sessions (track who started but didn't finish)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS checkout_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
      pricing_tier_id TEXT NOT NULL,
      stripe_session_id TEXT NOT NULL UNIQUE,
      stripe_url TEXT,
      customer_email TEXT,
      customer_name TEXT,
      company TEXT,
      vat_id TEXT,
      billing_address JSONB,
      status TEXT NOT NULL DEFAULT 'created',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `)
}
