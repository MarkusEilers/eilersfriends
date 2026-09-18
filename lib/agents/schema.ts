import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Die Dienst-Schicht unter der Oberflaeche.
 *
 * Drei Gedanken tragen das Ganze:
 *
 * 1. **Ein Agent ist Daten, kein Code.** Seine Schrittkette, seine Schemata und
 *    seine Wissenspakete stehen in der Datenbank. Ein neuer Agent braucht keinen
 *    Deploy — und ein Kunde kann seinen eigenen bekommen, ohne dass wir das Repo
 *    anfassen. Waere er eine Datei, koennte ihn niemand ausser uns aendern.
 *
 * 2. **Ein Lauf ist eine Zustandsmaschine mit Haltepunkten.** Ein Schreiblauf
 *    mit Recherche, drei Varianten und einer Revision sind acht bis zwoelf
 *    Modellaufrufe. In einen HTTP-Aufruf passt das nicht. Also: jeder Schritt
 *    eine Zeile, jeder Lauf fortsetzbar. Wer den Lauf antreibt — der Aufrufer,
 *    eine Warteschlange oder spaeter ein Arbeiter — aendert am Agenten nichts.
 *
 * 3. **Wissen kommt aus Paketen.** Voice-Charta, Verbote, Beispiele, Methode —
 *    je Mandant. Derselbe Agent, anderes Paket. Das ist der Unterschied zwischen
 *    einem Werkzeug, das wir benutzen, und einem, das wir verkaufen.
 */

let ready = false

export async function ensureAgentSchema() {
  if (ready) return

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      description TEXT,
      input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
      output_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
      steps JSONB NOT NULL DEFAULT '[]'::jsonb,
      knowledge JSONB NOT NULL DEFAULT '[]'::jsonb,
      scopes JSONB NOT NULL DEFAULT '["agents:run"]'::jsonb,
      default_model_role TEXT NOT NULL DEFAULT 'copy',
      is_active BOOLEAN NOT NULL DEFAULT true,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS agents_key_version_idx ON agents (key, version)`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS agents_active_idx ON agents (key) WHERE is_active`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_key TEXT NOT NULL,
      agent_version INTEGER NOT NULL,
      org_id UUID REFERENCES companies(id) ON DELETE SET NULL,
      product_id UUID,
      status TEXT NOT NULL DEFAULT 'offen',
      input JSONB NOT NULL DEFAULT '{}'::jsonb,
      output JSONB,
      assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
      error TEXT,
      cursor SMALLINT NOT NULL DEFAULT 0,
      tokens_in INTEGER NOT NULL DEFAULT 0,
      tokens_out INTEGER NOT NULL DEFAULT 0,
      cost_eur NUMERIC NOT NULL DEFAULT 0,
      amount_eur NUMERIC NOT NULL DEFAULT 0,
      created_by UUID,
      created_via TEXT NOT NULL DEFAULT 'ui',
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      finished_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS agent_runs_idx ON agent_runs (org_id, started_at DESC)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS agent_runs_open_idx ON agent_runs (status) WHERE status IN ('offen','laeuft')`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agent_run_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
      seq SMALLINT NOT NULL,
      step_key TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offen',
      input JSONB,
      output JSONB,
      model TEXT,
      tokens_in INTEGER NOT NULL DEFAULT 0,
      tokens_out INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER,
      error TEXT,
      started_at TIMESTAMPTZ,
      finished_at TIMESTAMPTZ
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS agent_run_steps_seq ON agent_run_steps (run_id, seq)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agent_artifacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
      step_key TEXT,
      kind TEXT NOT NULL,
      label TEXT,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS agent_artifacts_idx ON agent_artifacts (run_id, kind)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS knowledge_packs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS knowledge_packs_key_idx
    ON knowledge_packs (key, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid))`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS knowledge_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pack_id UUID NOT NULL REFERENCES knowledge_packs(id) ON DELETE CASCADE,
      key TEXT,
      title TEXT,
      body TEXT NOT NULL,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      weight SMALLINT NOT NULL DEFAULT 50,
      is_gold BOOLEAN NOT NULL DEFAULT false,
      sort SMALLINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS knowledge_items_idx ON knowledge_items (pack_id, sort)`)

  ready = true
}

/* ─────────────────────────── Typen ─────────────────────────── */

export type StepKind =
  | 'intake'      // Code: Eingaben normalisieren, Luecken zu Annahmen machen
  | 'kontext'     // Code: Wissenspakete, Strategie-Fakten, Katalog laden
  | 'recherche'   // Websuche, Fundstellen als Artefakt
  | 'modell'      // ein Modellaufruf mit Schema
  | 'faecher'     // derselbe Modellaufruf mehrfach, mit Variation
  | 'lint'        // Code: deterministische Pruefung
  | 'revision'    // Modell, nur Befunde beheben
  | 'sammeln'     // Code: Ergebnis zusammenstellen

export interface StepDef {
  key: string
  kind: StepKind
  title?: string
  /** Nur fuer 'modell' | 'faecher' | 'revision' */
  system?: string
  user?: string
  schema?: Record<string, unknown>
  modelRole?: string
  temperature?: number
  maxTokens?: number
  /** Fuer 'faecher': wie viele Durchlaeufe und womit sie sich unterscheiden */
  fanout?: number
  variants?: string[]
  /** Fuer 'recherche' */
  queries?: string[]
  /**
   * Woher die Fassungen kommen, die dieser Schritt prueft oder ueberarbeitet.
   * Ohne Angabe: die Entwuerfe. Damit laesst sich dieselbe Schrittart zweimal in
   * die Kette haengen — einmal vor und einmal nach der Revision.
   */
  source?: string
  /** Welcher Pruefbericht zugrunde liegt (fuer 'revision') */
  reports?: string
  /** Schritt ueberspringen, wenn diese Eingabe fehlt oder falsch ist */
  onlyIf?: string
  optional?: boolean
}

export interface AgentDef {
  id: string
  key: string
  version: number
  title: string
  description: string | null
  input_schema: Record<string, unknown>
  output_schema: Record<string, unknown>
  steps: StepDef[]
  knowledge: string[]
  scopes: string[]
  default_model_role: string
}
