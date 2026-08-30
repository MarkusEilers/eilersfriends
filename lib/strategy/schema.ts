import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Wissensbasis der Strategie-Ebene.
 *
 * Ein Schritt produziert keine Antworten, sondern FAKTEN über den Kunden.
 * Fakten sind adressierbar (icp.pains, beef.what), haben Quelle, Konfidenz und
 * Historie. Jeder Agent deklariert, welche Fakten er liest und welche er
 * schreibt — daraus ergibt sich die Kontext-Zusammenstellung und die Frage,
 * welcher Schritt gerade blockiert ist.
 */

let ensured = false

export async function ensureFactSchema() {
  if (ensured) return

  // ── Registry: welche Fakten es überhaupt gibt ───────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_fact_keys (
      key          TEXT PRIMARY KEY,
      label        TEXT NOT NULL,
      scope        TEXT NOT NULL DEFAULT 'product',   -- company | product
      value_type   TEXT NOT NULL DEFAULT 'text',      -- text | list | object | number
      produced_by  TEXT,                              -- step_key
      description  TEXT,
      sort_order   INTEGER NOT NULL DEFAULT 0,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      created_at   TIMESTAMPTZ DEFAULT now(),
      updated_at   TIMESTAMPTZ DEFAULT now()
    )`)

  // ── Die Fakten eines Kunden ─────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_facts (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id     UUID REFERENCES strategy_products(id) ON DELETE CASCADE,
      key            TEXT NOT NULL,
      value          JSONB NOT NULL,
      source         TEXT NOT NULL DEFAULT 'user',    -- user | agent | research | import
      source_step_id UUID,
      source_block_id UUID,
      ai_run_id      UUID,
      evidence       TEXT,                            -- Beleg/Fundstelle
      confidence     NUMERIC NOT NULL DEFAULT 1.0,    -- 0..1
      status         TEXT NOT NULL DEFAULT 'confirmed', -- draft | confirmed | rejected
      is_current     BOOLEAN NOT NULL DEFAULT true,
      version        INTEGER NOT NULL DEFAULT 1,
      supersedes_id  UUID,
      created_by     UUID REFERENCES users(id),
      created_at     TIMESTAMPTZ DEFAULT now(),
      updated_at     TIMESTAMPTZ DEFAULT now()
    )`)
  // Nur EIN aktueller Fakt je (Firma, Produkt, Schlüssel)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS strategy_facts_current_product
    ON strategy_facts (company_id, product_id, key) WHERE is_current AND product_id IS NOT NULL`)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS strategy_facts_current_company
    ON strategy_facts (company_id, key) WHERE is_current AND product_id IS NULL`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_facts_lookup ON strategy_facts (company_id, key, is_current)`)

  // ── Versionierte Prompts ────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_prompts (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_key     TEXT NOT NULL,
      version       INTEGER NOT NULL DEFAULT 1,
      system_prompt TEXT NOT NULL,
      user_template TEXT,
      output_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
      consumes      TEXT[] DEFAULT ARRAY[]::TEXT[],
      produces      TEXT[] DEFAULT ARRAY[]::TEXT[],
      model_role    TEXT NOT NULL DEFAULT 'strategie',  -- strategie | copy | recherche | sounding_board | kritik | voice_check
      prompt_kind   TEXT NOT NULL DEFAULT 'facts',       -- facts | review | dialog
      model_override TEXT,
      temperature   NUMERIC DEFAULT 0.7,
      allow_research BOOLEAN NOT NULL DEFAULT false,
      template_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      is_active     BOOLEAN NOT NULL DEFAULT true,
      notes         TEXT,
      created_by    UUID REFERENCES users(id),
      created_at    TIMESTAMPTZ DEFAULT now(),
      updated_at    TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS strategy_prompts_version ON strategy_prompts (agent_key, version)`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS strategy_prompts_active ON strategy_prompts (agent_key) WHERE is_active`)

  // ── Eigene Vorlagen und Beispiele ───────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_templates (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      step_key    TEXT,                                -- NULL = global
      kind        TEXT NOT NULL DEFAULT 'example',     -- example | skeleton | snippet | style
      title       TEXT NOT NULL,
      body        TEXT NOT NULL,
      tags        TEXT[] DEFAULT ARRAY[]::TEXT[],
      is_gold     BOOLEAN NOT NULL DEFAULT false,
      locale      TEXT DEFAULT 'de',
      company_id  UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = für alle
      usage_count INTEGER NOT NULL DEFAULT 0,
      is_active   BOOLEAN NOT NULL DEFAULT true,
      created_by  UUID REFERENCES users(id),
      created_at  TIMESTAMPTZ DEFAULT now(),
      updated_at  TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_templates_step ON strategy_templates (step_key, is_active)`)

  // ── Befunde aus Kritik und Voice-Check ──────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_reviews (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
      product_id   UUID REFERENCES strategy_products(id) ON DELETE CASCADE,
      step_id      UUID,
      agent_key    TEXT NOT NULL,
      kind         TEXT NOT NULL DEFAULT 'kritik',   -- kritik | voice_check
      verdict      TEXT,                             -- ok | revise | kill
      findings     JSONB NOT NULL DEFAULT '[]'::jsonb,
      reviewed_text TEXT,
      ai_run_id    UUID,
      created_at   TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_reviews_lookup ON strategy_reviews (company_id, step_id, created_at DESC)`)

  // ai_runs um Prompt-Version erweitern
  await db.execute(sql`ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS prompt_id UUID`)
  await db.execute(sql`ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS prompt_version INTEGER`)
  await db.execute(sql`ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS model_role TEXT`)

  ensured = true
}
