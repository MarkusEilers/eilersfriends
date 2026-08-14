import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Strategie-Ebene ("13-Schritte-Programm") — Datenmodell + Self-Heal.
 *
 * Relational statt JSONB-Monolith (die GTM-Engine-Vorlage hielt alles in einem
 * einzigen strategy_data-Blob — ohne Fortschritt, Historie oder Mandantenfähigkeit).
 *
 *   strategy_steps          Katalog der Schritte (global definiert)
 *   strategy_step_blocks    Inhalts-Bausteine je Schritt (Opening Story, Unterschritt,
 *                           Exercise, Agent, Beispiel, Info, Tool) — verschachtelbar
 *   strategy_step_agents    KI-Agent je Baustein (Prompt + Tool-Schema + Kontext-Scopes)
 *
 *   strategy_products       Produkte eines Kunden — die 13 Schritte laufen JE PRODUKT
 *   strategy_step_states    Fortschritt + Inhalt je (Firma, Produkt, Schritt) inkl. Freigabe
 *   strategy_block_results  Ergebnisse einzelner Exercises / Agent-Läufe
 *   strategy_step_versions  Snapshot-Historie
 *   strategy_comments       Kommentare Kunde <-> Coach
 *   ai_runs                 Audit-Log aller KI-Läufe
 *
 * Scope: Schritte sind entweder 'company' (einmal je Kunde) oder 'product' (je Produkt).
 */

let ensured = false

export async function ensureStrategySchema() {
  if (ensured) return

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='strategy_step_status') THEN
        CREATE TYPE strategy_step_status AS ENUM
          ('locked','available','in_progress','submitted','in_review','changes_requested','approved');
      END IF;
    END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='strategy_block_kind') THEN
        CREATE TYPE strategy_block_kind AS ENUM
          ('opening_story','substep','exercise','agent','example','info_why','info_how','tool','homework');
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_steps (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key           TEXT UNIQUE NOT NULL,
      title         TEXT NOT NULL,
      subtitle      TEXT,
      scope         TEXT NOT NULL DEFAULT 'product',
      sort_order    INTEGER NOT NULL DEFAULT 0,
      icon          TEXT,
      estimated_min INTEGER,
      is_active     BOOLEAN NOT NULL DEFAULT true,
      created_at    TIMESTAMPTZ DEFAULT now(),
      updated_at    TIMESTAMPTZ DEFAULT now()
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_step_blocks (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      step_id         UUID NOT NULL REFERENCES strategy_steps(id) ON DELETE CASCADE,
      parent_block_id UUID REFERENCES strategy_step_blocks(id) ON DELETE CASCADE,
      kind            strategy_block_kind NOT NULL,
      title           TEXT,
      body            TEXT,
      media_url       TEXT,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      fields          JSONB DEFAULT '[]'::jsonb,
      config          JSONB DEFAULT '{}'::jsonb,
      is_required     BOOLEAN NOT NULL DEFAULT false,
      created_at      TIMESTAMPTZ DEFAULT now(),
      updated_at      TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_step_blocks_step_idx ON strategy_step_blocks (step_id, sort_order)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_step_blocks_parent_idx ON strategy_step_blocks (parent_block_id)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_step_agents (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      block_id       UUID REFERENCES strategy_step_blocks(id) ON DELETE CASCADE,
      step_id        UUID REFERENCES strategy_steps(id) ON DELETE CASCADE,
      agent_key      TEXT NOT NULL,
      label          TEXT,
      system_prompt  TEXT NOT NULL,
      user_prompt    TEXT,
      tool_schema    JSONB DEFAULT '{}'::jsonb,
      context_scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
      model_role     TEXT NOT NULL DEFAULT 'strategy',
      is_active      BOOLEAN NOT NULL DEFAULT true,
      created_at     TIMESTAMPTZ DEFAULT now(),
      updated_at     TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS strategy_step_agents_key_idx ON strategy_step_agents (agent_key)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_products (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      slug        TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'active',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_by  UUID REFERENCES users(id),
      created_at  TIMESTAMPTZ DEFAULT now(),
      updated_at  TIMESTAMPTZ DEFAULT now(),
      archived_at TIMESTAMPTZ
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS strategy_products_slug_idx ON strategy_products (company_id, slug)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_step_states (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id    UUID REFERENCES strategy_products(id) ON DELETE CASCADE,
      step_id       UUID NOT NULL REFERENCES strategy_steps(id) ON DELETE CASCADE,
      status        strategy_step_status NOT NULL DEFAULT 'available',
      data          JSONB NOT NULL DEFAULT '{}'::jsonb,
      progress      INTEGER NOT NULL DEFAULT 0,
      assigned_to   UUID REFERENCES users(id),
      started_at    TIMESTAMPTZ,
      submitted_at  TIMESTAMPTZ,
      submitted_by  UUID REFERENCES users(id),
      reviewed_at   TIMESTAMPTZ,
      reviewed_by   UUID REFERENCES users(id),
      approved_at   TIMESTAMPTZ,
      approved_by   UUID REFERENCES users(id),
      review_note   TEXT,
      created_at    TIMESTAMPTZ DEFAULT now(),
      updated_at    TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS strategy_step_states_unique_product
    ON strategy_step_states (company_id, product_id, step_id) WHERE product_id IS NOT NULL`)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS strategy_step_states_unique_company
    ON strategy_step_states (company_id, step_id) WHERE product_id IS NULL`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_block_results (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      state_id    UUID NOT NULL REFERENCES strategy_step_states(id) ON DELETE CASCADE,
      block_id    UUID NOT NULL REFERENCES strategy_step_blocks(id) ON DELETE CASCADE,
      output      JSONB NOT NULL DEFAULT '{}'::jsonb,
      source      TEXT NOT NULL DEFAULT 'user',
      ai_run_id   UUID,
      created_by  UUID REFERENCES users(id),
      created_at  TIMESTAMPTZ DEFAULT now(),
      updated_at  TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_block_results_state_idx ON strategy_block_results (state_id)`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS strategy_block_results_unique ON strategy_block_results (state_id, block_id)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_step_versions (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      state_id   UUID NOT NULL REFERENCES strategy_step_states(id) ON DELETE CASCADE,
      snapshot   JSONB NOT NULL,
      label      TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_step_versions_state_idx ON strategy_step_versions (state_id, created_at DESC)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS strategy_comments (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      state_id    UUID NOT NULL REFERENCES strategy_step_states(id) ON DELETE CASCADE,
      block_id    UUID REFERENCES strategy_step_blocks(id) ON DELETE SET NULL,
      parent_id   UUID REFERENCES strategy_comments(id) ON DELETE CASCADE,
      author_id   UUID REFERENCES users(id),
      body        TEXT NOT NULL,
      is_internal BOOLEAN NOT NULL DEFAULT false,
      resolved_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ DEFAULT now(),
      updated_at  TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS strategy_comments_state_idx ON strategy_comments (state_id, created_at)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_runs (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
      product_id   UUID REFERENCES strategy_products(id) ON DELETE SET NULL,
      user_id      UUID REFERENCES users(id),
      purpose      TEXT,
      agent_key    TEXT,
      model        TEXT,
      input        JSONB,
      output       JSONB,
      tokens_in    INTEGER,
      tokens_out   INTEGER,
      duration_ms  INTEGER,
      ok           BOOLEAN DEFAULT true,
      error        TEXT,
      created_at   TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ai_runs_company_idx ON ai_runs (company_id, created_at DESC)`)

  ensured = true
}

/* ── Katalog der Schritte ─────────────────────────────────────────────────── */

export interface StepSeed {
  key: string
  title: string
  subtitle: string
  scope: 'company' | 'product'
  icon: string
  estimatedMin: number
}

export const STRATEGY_STEPS: StepSeed[] = [
  { key: 'foundation',    title: 'Fundament',        subtitle: 'Kultur, Origin Story und wofuer Ihr steht.',        scope: 'company', icon: 'building', estimatedMin: 45 },
  { key: 'success-goals', title: 'Was Erfolg heisst', subtitle: 'Objectives und Key Results fuer die Organisation.', scope: 'company', icon: 'target',   estimatedMin: 40 },

  { key: 'product-goals',      title: 'Produkt-Ziele',             subtitle: 'Was dieses Produkt erreichen soll.',              scope: 'product', icon: 'flag',       estimatedMin: 30 },
  { key: 'icp',                title: 'Ideales Kundenprofil',      subtitle: 'Wer kauft — und warum ausgerechnet bei Euch.',    scope: 'product', icon: 'users',      estimatedMin: 60 },
  { key: 'compete',            title: 'Wettbewerb',                subtitle: 'Wer sonst um dieselbe Entscheidung kaempft.',     scope: 'product', icon: 'swords',     estimatedMin: 45 },
  { key: 'beef-radar',         title: 'Beef Radar',                subtitle: 'WAS · WIE · WARUM — Euer echter Unterschied.',    scope: 'product', icon: 'radar',      estimatedMin: 60 },
  { key: 'conviction-path',    title: 'Ueberzeugungspfad',         subtitle: 'Welche Ueberzeugungen in welcher Reihenfolge.',   scope: 'product', icon: 'route',      estimatedMin: 75 },
  { key: 'signature-solution', title: 'Bulletproof Value Roadmap', subtitle: 'Der Weg vom IST zum SOLL, in Phasen.',            scope: 'product', icon: 'map',        estimatedMin: 75 },
  { key: 'irresistible-offer', title: 'Unwiderstehliches Angebot', subtitle: 'Mehr als Leistung und Preis.',                    scope: 'product', icon: 'gift',       estimatedMin: 60 },
  { key: 'soft-launch',        title: 'Soft Launch',               subtitle: 'Die Einfuehrung in Etappen statt mit Knall.',     scope: 'product', icon: 'rocket',     estimatedMin: 50 },
  { key: 'funnel-math',        title: 'Funnel-Mathematik',         subtitle: 'Welche Zahlen zu Eurem Ziel fuehren.',            scope: 'product', icon: 'calculator', estimatedMin: 45 },
  { key: 'high-value-content', title: 'High Value Content',        subtitle: 'Inhalte, die Autoritaet aufbauen.',               scope: 'product', icon: 'file-text',  estimatedMin: 60 },
  { key: 'ads-lab',            title: 'Ads Lab',                   subtitle: 'Anzeigen, die qualifizierte Gespraeche bringen.', scope: 'product', icon: 'megaphone',  estimatedMin: 45 },
  { key: 'landing-page',       title: 'Landingpage',               subtitle: 'Die Seite, auf der die Entscheidung faellt.',     scope: 'product', icon: 'layout',     estimatedMin: 50 },
  { key: 'outreach',           title: 'Outreach-Sequenz',          subtitle: '14 Beats — systematische Erstansprache.',         scope: 'product', icon: 'send',       estimatedMin: 75 },
]

export async function seedStrategySteps() {
  await ensureStrategySchema()
  for (let i = 0; i < STRATEGY_STEPS.length; i++) {
    const s = STRATEGY_STEPS[i]
    await db.execute(sql`
      INSERT INTO strategy_steps (key, title, subtitle, scope, sort_order, icon, estimated_min)
      VALUES (${s.key}, ${s.title}, ${s.subtitle}, ${s.scope}, ${i + 1}, ${s.icon}, ${s.estimatedMin})
      ON CONFLICT (key) DO UPDATE SET
        title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, scope = EXCLUDED.scope,
        sort_order = EXCLUDED.sort_order, icon = EXCLUDED.icon,
        estimated_min = EXCLUDED.estimated_min, updated_at = now()
    `)
  }
}

/* ── Lesezugriffe ─────────────────────────────────────────────────────────── */

export interface StrategyStepRow {
  id: string; key: string; title: string; subtitle: string | null
  scope: 'company' | 'product'; sort_order: number; icon: string | null
  estimated_min: number | null; is_active: boolean
}

export async function listSteps(scope?: 'company' | 'product'): Promise<StrategyStepRow[]> {
  await ensureStrategySchema()
  const res = scope
    ? await db.execute(sql`SELECT * FROM strategy_steps WHERE is_active AND scope = ${scope} ORDER BY sort_order`)
    : await db.execute(sql`SELECT * FROM strategy_steps WHERE is_active ORDER BY sort_order`)
  return res as unknown as StrategyStepRow[]
}

export interface StrategyProductRow {
  id: string; company_id: string; name: string; slug: string
  description: string | null; status: string; sort_order: number
}

export async function listProducts(companyId: string): Promise<StrategyProductRow[]> {
  await ensureStrategySchema()
  const res = await db.execute(sql`
    SELECT * FROM strategy_products
    WHERE company_id = ${companyId} AND status <> 'archived'
    ORDER BY sort_order, created_at
  `)
  return res as unknown as StrategyProductRow[]
}

export async function createProduct(input: { companyId: string; name: string; description?: string | null; createdBy?: string | null }) {
  await ensureStrategySchema()
  const slug = input.name.toLowerCase().normalize('NFKD')
    .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'produkt'
  const res = await db.execute(sql`
    INSERT INTO strategy_products (company_id, name, slug, description, created_by)
    VALUES (${input.companyId}, ${input.name}, ${slug}, ${input.description ?? null}, ${input.createdBy ?? null})
    ON CONFLICT (company_id, slug) DO UPDATE SET name = EXCLUDED.name, updated_at = now()
    RETURNING *
  `)
  return (res as unknown as StrategyProductRow[])[0]
}

/** Fortschritts-Uebersicht: alle Schritte + Status fuer ein Produkt (bzw. Firmen-Schritte). */
export async function listStepStates(companyId: string, productId?: string | null) {
  await ensureStrategySchema()
  const res = await db.execute(sql`
    SELECT st.id AS step_id, st.key, st.title, st.subtitle, st.scope, st.sort_order,
           st.icon, st.estimated_min,
           ss.id AS state_id, ss.status, ss.progress, ss.data,
           ss.submitted_at, ss.approved_at, ss.review_note
    FROM strategy_steps st
    LEFT JOIN strategy_step_states ss
      ON ss.step_id = st.id
     AND ss.company_id = ${companyId}
     AND ss.product_id IS NOT DISTINCT FROM ${productId ?? null}::uuid
    WHERE st.is_active
      AND (st.scope = 'company' OR ${productId ?? null}::uuid IS NOT NULL)
    ORDER BY st.sort_order
  `)
  return res as unknown as Array<Record<string, unknown>>
}

export async function ensureStepState(input: { companyId: string; productId?: string | null; stepId: string }) {
  await ensureStrategySchema()
  await db.execute(sql`
    INSERT INTO strategy_step_states (company_id, product_id, step_id, status)
    VALUES (${input.companyId}, ${input.productId ?? null}, ${input.stepId}, 'available')
    ON CONFLICT DO NOTHING
  `)
  const existing = await db.execute(sql`
    SELECT * FROM strategy_step_states
    WHERE company_id = ${input.companyId} AND step_id = ${input.stepId}
      AND product_id IS NOT DISTINCT FROM ${input.productId ?? null}::uuid
    LIMIT 1
  `)
  return (existing as unknown as Array<Record<string, unknown>>)[0]
}

/* ── Freigabe-Workflow ────────────────────────────────────────────────────── */

export type StepStatus = 'locked' | 'available' | 'in_progress' | 'submitted' | 'in_review' | 'changes_requested' | 'approved'

const ALLOWED: Record<StepStatus, StepStatus[]> = {
  locked: ['available'],
  available: ['in_progress'],
  in_progress: ['submitted', 'available'],
  submitted: ['in_review', 'in_progress'],
  in_review: ['approved', 'changes_requested'],
  changes_requested: ['in_progress'],
  approved: ['in_progress'],
}

export function canTransition(from: StepStatus, to: StepStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false
}

export async function saveStepData(stateId: string, data: unknown, progress?: number, userId?: string | null) {
  await ensureStrategySchema()
  await db.execute(sql`
    INSERT INTO strategy_step_versions (state_id, snapshot, label, created_by)
    SELECT id, data, 'autosave', ${userId ?? null} FROM strategy_step_states WHERE id = ${stateId}
  `)
  await db.execute(sql`
    UPDATE strategy_step_states
    SET data = ${JSON.stringify(data)}::jsonb,
        progress = COALESCE(${progress ?? null}, progress),
        status = CASE WHEN status = 'available' THEN 'in_progress'::strategy_step_status ELSE status END,
        started_at = COALESCE(started_at, now()),
        updated_at = now()
    WHERE id = ${stateId}
  `)
}

export async function transitionStep(stateId: string, to: StepStatus, userId?: string | null, note?: string | null) {
  await ensureStrategySchema()
  const cur = await db.execute(sql`SELECT status FROM strategy_step_states WHERE id = ${stateId} LIMIT 1`)
  const from = (cur as unknown as Array<{ status: StepStatus }>)[0]?.status
  if (!from) throw new Error('step state not found')
  if (!canTransition(from, to)) throw new Error(`Uebergang ${from} -> ${to} nicht erlaubt`)

  const stamps =
    to === 'submitted' ? sql`, submitted_at = now(), submitted_by = ${userId ?? null}`
    : to === 'in_review' ? sql`, reviewed_at = now(), reviewed_by = ${userId ?? null}`
    : to === 'approved' ? sql`, approved_at = now(), approved_by = ${userId ?? null}, progress = 100`
    : to === 'changes_requested' ? sql`, reviewed_at = now(), reviewed_by = ${userId ?? null}`
    : sql``

  await db.execute(sql`
    UPDATE strategy_step_states
    SET status = ${to}::strategy_step_status, review_note = COALESCE(${note ?? null}, review_note), updated_at = now() ${stamps}
    WHERE id = ${stateId}
  `)
  return { from, to }
}

/* ── Bausteine, Ergebnisse, Kommentare, Audit ─────────────────────────────── */

export async function listBlocks(stepId: string) {
  await ensureStrategySchema()
  const res = await db.execute(sql`
    SELECT b.*, a.agent_key, a.label AS agent_label, a.system_prompt, a.context_scopes, a.model_role
    FROM strategy_step_blocks b
    LEFT JOIN strategy_step_agents a ON a.block_id = b.id AND a.is_active
    WHERE b.step_id = ${stepId}
    ORDER BY b.sort_order
  `)
  return res as unknown as Array<Record<string, unknown>>
}

export async function saveBlockResult(input: {
  stateId: string; blockId: string; output: unknown
  source?: 'user' | 'agent'; aiRunId?: string | null; userId?: string | null
}) {
  await ensureStrategySchema()
  await db.execute(sql`
    INSERT INTO strategy_block_results (state_id, block_id, output, source, ai_run_id, created_by)
    VALUES (${input.stateId}, ${input.blockId}, ${JSON.stringify(input.output)}::jsonb,
            ${input.source ?? 'user'}, ${input.aiRunId ?? null}, ${input.userId ?? null})
    ON CONFLICT (state_id, block_id) DO UPDATE SET
      output = EXCLUDED.output, source = EXCLUDED.source,
      ai_run_id = EXCLUDED.ai_run_id, updated_at = now()
  `)
}

export async function listComments(stateId: string, includeInternal = false) {
  await ensureStrategySchema()
  const res = await db.execute(sql`
    SELECT c.*, u.name AS author_name, u.avatar_url AS author_avatar
    FROM strategy_comments c
    LEFT JOIN users u ON u.id = c.author_id
    WHERE c.state_id = ${stateId} ${includeInternal ? sql`` : sql`AND c.is_internal = false`}
    ORDER BY c.created_at
  `)
  return res as unknown as Array<Record<string, unknown>>
}

export async function addComment(input: {
  stateId: string; blockId?: string | null; parentId?: string | null
  authorId?: string | null; body: string; isInternal?: boolean
}) {
  await ensureStrategySchema()
  const res = await db.execute(sql`
    INSERT INTO strategy_comments (state_id, block_id, parent_id, author_id, body, is_internal)
    VALUES (${input.stateId}, ${input.blockId ?? null}, ${input.parentId ?? null},
            ${input.authorId ?? null}, ${input.body}, ${input.isInternal ?? false})
    RETURNING *
  `)
  return (res as unknown as Array<Record<string, unknown>>)[0]
}

export async function logAiRun(input: {
  companyId?: string | null; productId?: string | null; userId?: string | null
  purpose?: string; agentKey?: string; model?: string
  input?: unknown; output?: unknown
  tokensIn?: number; tokensOut?: number; durationMs?: number; ok?: boolean; error?: string | null
}) {
  await ensureStrategySchema()
  const res = await db.execute(sql`
    INSERT INTO ai_runs (company_id, product_id, user_id, purpose, agent_key, model,
                         input, output, tokens_in, tokens_out, duration_ms, ok, error)
    VALUES (${input.companyId ?? null}, ${input.productId ?? null}, ${input.userId ?? null},
            ${input.purpose ?? null}, ${input.agentKey ?? null}, ${input.model ?? null},
            ${JSON.stringify(input.input ?? null)}::jsonb, ${JSON.stringify(input.output ?? null)}::jsonb,
            ${input.tokensIn ?? null}, ${input.tokensOut ?? null}, ${input.durationMs ?? null},
            ${input.ok ?? true}, ${input.error ?? null})
    RETURNING id
  `)
  return (res as unknown as Array<{ id: string }>)[0]?.id
}
