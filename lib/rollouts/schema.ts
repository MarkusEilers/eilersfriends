import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureOrgSchema } from '@/lib/org/schema'

/**
 * Programm-Versionen, Rollouts und alles, was daran hängt.
 *
 * Vorlage und Instanz sind getrennt: Ein Programm wird als Version
 * eingefroren (Schnappschuss), ein Rollout ist diese Version bei einem
 * Kunden — mit Terminen, Häkchen und Abweichungen. So bleibt nachvollziehbar,
 * mit welchem Stand ein Kunde gearbeitet hat, auch wenn das Programm längst
 * weiterentwickelt wurde.
 */

let ready = false
export async function ensureRolloutSchema() {
  if (ready) return
  await ensureOrgSchema()
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS program_versions (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      program_id  UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      version     TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'released',
      snapshot    JSONB NOT NULL,
      changelog   TEXT,
      released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      released_by UUID,
      UNIQUE (program_id, version)
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rollouts (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      program_id         UUID NOT NULL REFERENCES programs(id),
      program_version_id UUID NOT NULL REFERENCES program_versions(id),
      offer_id           UUID,
      code_prefix        TEXT NOT NULL DEFAULT 'P',
      color              TEXT,
      title              TEXT NOT NULL,
      status             TEXT NOT NULL DEFAULT 'planned',
      start_date         DATE,
      end_date           DATE,
      cadence            TEXT NOT NULL DEFAULT 'biweekly',
      breaks             JSONB NOT NULL DEFAULT '[]'::jsonb,
      locale             TEXT NOT NULL DEFAULT 'de',
      phase              TEXT NOT NULL DEFAULT 'beta',
      created_from       TEXT NOT NULL DEFAULT 'manual',
      meta               JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS rollouts_company ON rollouts (company_id)`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS rollouts_offer_program ON rollouts (offer_id, program_id) WHERE offer_id IS NOT NULL`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rollout_steps (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rollout_id    UUID NOT NULL REFERENCES rollouts(id) ON DELETE CASCADE,
      step_key      TEXT NOT NULL,
      code          TEXT NOT NULL,
      sort_order    INT NOT NULL DEFAULT 0,
      planned_start DATE,
      planned_end   DATE,
      status        TEXT NOT NULL DEFAULT 'planned',
      done_at       TIMESTAMPTZ,
      done_by       UUID,
      joint_code    TEXT,
      override      JSONB NOT NULL DEFAULT '{}'::jsonb,
      note          TEXT,
      challenge     TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (rollout_id, code)
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rollout_items (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rollout_step_id UUID NOT NULL REFERENCES rollout_steps(id) ON DELETE CASCADE,
      kind            TEXT NOT NULL,
      label           TEXT NOT NULL,
      sort_order      INT NOT NULL DEFAULT 0,
      done_at         TIMESTAMPTZ,
      done_by         UUID,
      done_by_name    TEXT
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS rollout_items_step ON rollout_items (rollout_step_id)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rollout_changes (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rollout_id       UUID NOT NULL REFERENCES rollouts(id) ON DELETE CASCADE,
      rollout_step_id  UUID REFERENCES rollout_steps(id) ON DELETE SET NULL,
      proposed_by      UUID,
      proposed_by_name TEXT,
      kind             TEXT NOT NULL,
      payload          JSONB NOT NULL DEFAULT '{}'::jsonb,
      reason           TEXT,
      status           TEXT NOT NULL DEFAULT 'proposed',
      before           JSONB,
      decided_by       UUID,
      decided_at       TIMESTAMPTZ,
      decision_note    TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS step_resources (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      program_step_id UUID NOT NULL REFERENCES program_steps(id) ON DELETE CASCADE,
      kind            TEXT NOT NULL DEFAULT 'resource',
      title           TEXT NOT NULL,
      body            TEXT,
      url             TEXT,
      audience        TEXT[] NOT NULL DEFAULT '{}',
      offset_days     INT,
      is_internal     BOOLEAN NOT NULL DEFAULT false,
      sort_order      INT NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS step_resources_step ON step_resources (program_step_id)`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS signal_queue (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rollout_step_id   UUID NOT NULL REFERENCES rollout_steps(id) ON DELETE CASCADE,
      kind              TEXT NOT NULL,
      recipient_user_id UUID,
      recipient_email   TEXT NOT NULL,
      subject           TEXT NOT NULL,
      body_text         TEXT NOT NULL,
      scheduled_for     DATE,
      status            TEXT NOT NULL DEFAULT 'draft',
      approved_by       UUID,
      approved_at       TIMESTAMPTZ,
      sent_at           TIMESTAMPTZ,
      error             TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (rollout_step_id, kind, recipient_email)
    )`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_invites (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ,
      created_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  ready = true
}
