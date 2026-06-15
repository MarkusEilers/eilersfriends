import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

/** Idempotenter Seed der AI-Intensive-Programmzeile. Läuft serverseitig (DB-Env vorhanden). */
const AI_INTENSIVE_TIERS = [
  {
    id: 'ai-intensive-onetime',
    label: 'AI Intensive · 2 Tage',
    price: 897,
    currency: 'EUR',
    billing: 'one-time',
    stripe_price_id: '',
    is_highlighted: true,
    is_available: true,
    note: 'Alumni-Preis · Vorkasse',
  },
]

export async function ensureAiIntensiveProgram() {
  // Legacy-Drizzle-Spalten ggf. nullable machen (schema-egal, idempotent)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE programs ALTER COLUMN coach_id DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`)
  await db.execute(sql`DO $$ BEGIN ALTER TABLE programs ALTER COLUMN type DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`)
  await db.execute(sql`
    INSERT INTO programs (slug, name, tagline, category, brand_color, delivery_format,
      enrollment_limit, pricing_tiers, checkout_content, is_active, published_at, updated_at)
    VALUES ('salesmade-ai-intensive', 'SalesMade AI Intensive',
      'Gesprächsführung auf den Punkt — plus der komplette AI-Sales-Stack.',
      'workshop', '#1A5FD4', 'live',
      40, ${JSON.stringify(AI_INTENSIVE_TIERS)}::jsonb, '{}'::jsonb, true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name, tagline = EXCLUDED.tagline, category = EXCLUDED.category,
      brand_color = EXCLUDED.brand_color, delivery_format = EXCLUDED.delivery_format,
      enrollment_limit = EXCLUDED.enrollment_limit, pricing_tiers = EXCLUDED.pricing_tiers,
      is_active = true, updated_at = NOW()
  `)
}
