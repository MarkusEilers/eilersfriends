import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Content-Ebene: kuratierter Katalog und Formate.
 *
 * Zwei Dinge, die in der Vorlaeufer-Implementierung fehlten oder zu duenn waren.
 *
 * Der Katalog dort (voice_approved_snippets) hatte das Richtige im Kern — Art,
 * Kanal, Status, Dubletten-Schutz —, aber er kannte kein ICP, er befuellte sich
 * nur aus der Redaktion, und sein performance_score wurde von der Sortierung
 * gelesen und nirgends berechnet. Er sortierte damit nach Haeufigkeit: das
 * Meistbenutzte nach oben, nicht das Beste.
 *
 * Hier lernt er aus vier Quellen mit unterschiedlichem Gewicht, und zwar als
 * Ereignisse statt als eine ueberschriebene Zahl. Wer nachrechnen will, warum
 * ein Satz oben steht, kann es. Und wer die Gewichte aendert, verliert die
 * Historie nicht.
 *
 * Formate gab es dort gar nicht — nur eine Textspalte `format` mit Werten wie
 * 'poll'. Ein Format im medialen Sinn ist etwas anderes: ein Name, ein fester
 * Platz in der Woche, eine wiedererkennbare Dramaturgie, ein eigenes Publikum.
 */

let ready = false

export async function ensureContentSchema() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS content_formats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id UUID,
      channel TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      promise TEXT,
      dramaturgy JSONB NOT NULL DEFAULT '[]'::jsonb,
      tone TEXT,
      target_length TEXT,
      cadence TEXT NOT NULL DEFAULT 'weekly',
      weekday SMALLINT,
      time_of_day TEXT,
      rituals JSONB NOT NULL DEFAULT '{}'::jsonb,
      dos JSONB NOT NULL DEFAULT '[]'::jsonb,
      donts JSONB NOT NULL DEFAULT '[]'::jsonb,
      pillars JSONB NOT NULL DEFAULT '[]'::jsonb,
      segment_key TEXT,
      status TEXT NOT NULL DEFAULT 'aktiv',
      started_at DATE,
      created_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS content_formats_slug_idx ON content_formats (company_id, channel, slug)`)

  // Die einzelnen Ausgaben eines Formats. Erst dadurch bekommt es eine
  // Geschichte — und "Folge 37" ist etwas, worauf sich ein Publikum bezieht.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS content_format_episodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      format_id UUID NOT NULL REFERENCES content_formats(id) ON DELETE CASCADE,
      episode_no INTEGER,
      title TEXT,
      planned_for DATE,
      published_at TIMESTAMPTZ,
      published_url TEXT,
      beat_id UUID,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS content_catalog (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id UUID,
      segment_key TEXT,
      kind TEXT NOT NULL,
      text TEXT NOT NULL,
      text_hash TEXT GENERATED ALWAYS AS (md5(lower(btrim(text)))) STORED,
      channel TEXT,
      format_id UUID REFERENCES content_formats(id) ON DELETE SET NULL,
      conviction_stage TEXT,
      pillar TEXT,
      status TEXT NOT NULL DEFAULT 'kandidat',
      persuasion_score SMALLINT,
      persuasion_note TEXT,
      claims_status TEXT NOT NULL DEFAULT 'ungeprueft',
      claims_hits JSONB NOT NULL DEFAULT '[]'::jsonb,
      confidence NUMERIC NOT NULL DEFAULT 0,
      usage_count INTEGER NOT NULL DEFAULT 0,
      last_used_at TIMESTAMPTZ,
      source TEXT NOT NULL DEFAULT 'agent',
      source_ref TEXT,
      created_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS content_catalog_dedupe_idx
    ON content_catalog (company_id, kind, text_hash, COALESCE(segment_key,''))`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS content_catalog_pick_idx
    ON content_catalog (company_id, kind, status, confidence DESC)`)

  // Jede Lernquelle ist ein Ereignis, keine ueberschriebene Zahl. Damit bleibt
  // nachvollziehbar, warum ein Satz oben steht — und ein geaendertes Gewicht
  // rechnet die Vergangenheit neu, statt sie zu loeschen.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS content_catalog_evidence (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      snippet_id UUID NOT NULL REFERENCES content_catalog(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      value NUMERIC,
      note TEXT,
      source_ref TEXT,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by UUID
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS content_catalog_evidence_idx ON content_catalog_evidence (snippet_id, kind)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS content_scoring_settings (
      company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
      weight_freigabe NUMERIC NOT NULL DEFAULT 1.0,
      weight_gepostet NUMERIC NOT NULL DEFAULT 2.0,
      weight_wirkung NUMERIC NOT NULL DEFAULT 3.0,
      weight_gespraech NUMERIC NOT NULL DEFAULT 5.0,
      saturation NUMERIC NOT NULL DEFAULT 12.0,
      promote_at NUMERIC NOT NULL DEFAULT 0.6,
      min_persuasion SMALLINT NOT NULL DEFAULT 6,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)

  // Claims-Regeln sind einstellbar, weil sie je Markt anders sind: was ein
  // Biotech-Anbieter nicht behaupten darf, ist fuer eine Agentur harmlos.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS content_claims_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      pattern TEXT NOT NULL,
      is_regex BOOLEAN NOT NULL DEFAULT true,
      severity TEXT NOT NULL DEFAULT 'pruefen',
      explanation TEXT,
      suggestion TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS content_claims_rules_idx ON content_claims_rules (company_id, is_active)`)

  ready = true
}
