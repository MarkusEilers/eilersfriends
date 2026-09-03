import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Lead-Radar.
 *
 * Ein Lead ist hier nicht eine Firma, sondern ein Ereignis mit Ort und Datum:
 * eine Stellenanzeige, eine Registeraenderung, ein Zuschlag, ein Audit. Deshalb
 * traegt jede Zeile ihre Quelle und ihre Fundstelle — ohne die kann der Vertrieb
 * nicht anrufen, weil er nicht weiss, worauf er sich bezieht.
 *
 * Die Note A bis D wird gerechnet und nicht gesetzt, aus vier zaehlbaren
 * Merkmalen: Passung zum Profil, Staerke des Signals, Frische, und ob ein
 * Ansprechpartner mit Namen bekannt ist. Wer die Gewichte aendert, rechnet die
 * Vergangenheit neu — dasselbe Prinzip wie im Content-Katalog.
 */

let ready = false

export async function ensureLeadRadarSchema() {
  if (ready) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lead_radar (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id UUID,

      org_name TEXT NOT NULL,
      org_domain TEXT,
      branch TEXT,
      size_band TEXT,

      city TEXT NOT NULL,
      postal_code TEXT,
      country TEXT NOT NULL DEFAULT 'DE',
      lat DOUBLE PRECISION NOT NULL,
      lon DOUBLE PRECISION NOT NULL,

      source TEXT NOT NULL,
      source_url TEXT,
      signal TEXT NOT NULL,
      signal_kind TEXT NOT NULL DEFAULT 'sonstiges',
      signal_quote TEXT,
      signal_at TIMESTAMPTZ,

      contact_name TEXT,
      contact_role TEXT,
      contact_url TEXT,

      icp_match SMALLINT NOT NULL DEFAULT 0,
      icp_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
      signal_strength SMALLINT NOT NULL DEFAULT 0,
      score NUMERIC NOT NULL DEFAULT 0,
      rating TEXT NOT NULL DEFAULT 'D',

      status TEXT NOT NULL DEFAULT 'neu',
      assigned_to UUID,
      note TEXT,

      found_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS lead_radar_found_idx ON lead_radar (company_id, found_at DESC)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS lead_radar_rating_idx ON lead_radar (company_id, rating)`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS lead_radar_dedupe_idx
    ON lead_radar (company_id, md5(lower(org_name)), md5(lower(signal)))`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS lead_radar_settings (
      company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
      weight_icp NUMERIC NOT NULL DEFAULT 0.45,
      weight_signal NUMERIC NOT NULL DEFAULT 0.30,
      weight_freshness NUMERIC NOT NULL DEFAULT 0.15,
      weight_contact NUMERIC NOT NULL DEFAULT 0.10,
      cut_a NUMERIC NOT NULL DEFAULT 0.75,
      cut_b NUMERIC NOT NULL DEFAULT 0.55,
      cut_c NUMERIC NOT NULL DEFAULT 0.35,
      halflife_days NUMERIC NOT NULL DEFAULT 14,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  ready = true
}
