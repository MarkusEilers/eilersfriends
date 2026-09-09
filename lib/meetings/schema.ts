import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Besprechungen.
 *
 * Die eine Entscheidung, an der alles haengt: **Karten gehoeren dem Strang, nicht
 * dem einzelnen Termin.** Wer sie am Meeting festmacht, muss sie beim naechsten
 * Mal kopieren — und hat danach dieselbe Aufgabe n-mal in der Datenbank, mit n
 * Zustaenden und keiner Geschichte. Hier liegt eine Karte einmal im Strang und
 * traegt ihre Bewegungen als Ereignisse. "Mitnehmen von Meeting zu Meeting" ist
 * dann kein Vorgang, sondern der Normalzustand: es gibt nichts mitzunehmen.
 *
 * Das Meeting ist der Moment, in dem jemand auf den Strang schaut. Beim
 * Abschliessen wird eingefroren, wie es aussah — fuer das Protokoll. Der Strang
 * laeuft danach weiter.
 *
 * Die Wurzel ist die Organisation. `companies` ist heute die Organisationstabelle
 * (mit domain und merged_into, genau den Feldern, die das OS-Modell fuer
 * organizations vorsieht). `contacts` entsteht hier zum ersten Mal — Teilnehmer
 * mit E-Mail sind der kanonische Kontakt, dedupliziert ueber die Adresse.
 */

let ready = false

export async function ensureMeetingSchema() {
  if (ready) return

  // Schritt 1 der Adoptions-Reihenfolge aus dem OS-Modell.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      org_id UUID REFERENCES companies(id) ON DELETE SET NULL,
      first_name TEXT, last_name TEXT, role TEXT, phone TEXT,
      source TEXT,
      consent JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS contacts_org_idx ON contacts (org_id)`)

  /**
   * Kontakt und Zugang sind zwei Dinge, die derselbe Mensch sein kann.
   *
   * Ein Kontakt entsteht, weil jemand eine Adresse hinterlassen hat — in einem
   * Framework, einer Buchung, einer Besprechung. Ein Zugang entsteht, weil
   * jemand etwas gekauft hat oder bei uns arbeitet. Die allermeisten Kontakte
   * bekommen nie einen Zugang, und einige Zugaenge (wir selbst) sind keine
   * Kontakte.
   *
   * Deshalb keine gemeinsame Tabelle, sondern ein Verweis. Waeren es dieselben
   * Zeilen, haette jede Newsletter-Adresse eine Anmeldemoeglichkeit, und beim
   * Loeschen eines Zugangs faellt die halbe Historie mit.
   */
  await db.execute(sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id UUID`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS contacts_user_idx ON contacts (user_id)`)

  /** Der Bezug. Alles, was aufeinander aufsetzt, haengt hier. */
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_series (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      purpose TEXT,
      cadence TEXT,
      color TEXT,
      status TEXT NOT NULL DEFAULT 'aktiv',
      created_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)

  /** Zwei Bretter je Strang: Themen und Aktivitaeten. */
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_boards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      series_id UUID NOT NULL REFERENCES meeting_series(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      name TEXT NOT NULL,
      sort SMALLINT NOT NULL DEFAULT 0
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS meeting_boards_kind_idx ON meeting_boards (series_id, kind)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_board_columns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      board_id UUID NOT NULL REFERENCES meeting_boards(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      name TEXT NOT NULL,
      sort SMALLINT NOT NULL DEFAULT 0,
      color TEXT,
      is_done BOOLEAN NOT NULL DEFAULT false,
      is_parking BOOLEAN NOT NULL DEFAULT false
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS meeting_board_columns_key_idx ON meeting_board_columns (board_id, key)`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meetings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      series_id UUID REFERENCES meeting_series(id) ON DELETE SET NULL,
      org_id UUID REFERENCES companies(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'geplant',
      summary TEXT,
      transcript TEXT,
      transcript_source TEXT,
      transcript_url TEXT,
      share_token TEXT UNIQUE,
      closed_at TIMESTAMPTZ,
      created_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS meetings_series_idx ON meetings (series_id, starts_at DESC)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS meetings_org_idx ON meetings (org_id, starts_at DESC)`)

  /**
   * Je Teilnehmer ein eigener Zugang. Ein gemeinsamer Link waere bequemer und
   * wertlos: dann steht unter jeder Bewegung "jemand", und niemand kann eine
   * Aufgabe zugewiesen bekommen.
   */
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
      email TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'teilnehmer',
      token TEXT UNIQUE,
      invited_at TIMESTAMPTZ,
      opened_at TIMESTAMPTZ,
      attended BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS meeting_participants_uniq ON meeting_participants (meeting_id, lower(email))`)

  /**
   * Die Karten. Sie haengen am Strang und tragen, in welchem Meeting sie
   * entstanden und in welchem sie geschlossen wurden — daraus wird spaeter
   * "das lief seit vier Terminen mit".
   */
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      series_id UUID NOT NULL REFERENCES meeting_series(id) ON DELETE CASCADE,
      board_id UUID NOT NULL REFERENCES meeting_boards(id) ON DELETE CASCADE,
      column_id UUID REFERENCES meeting_board_columns(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      body TEXT,
      assignee_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
      due_date DATE,
      sort NUMERIC NOT NULL DEFAULT 1000,
      version INTEGER NOT NULL DEFAULT 1,
      origin_meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
      closed_meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
      closed_at TIMESTAMPTZ,
      carried_count SMALLINT NOT NULL DEFAULT 0,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS meeting_cards_board_idx ON meeting_cards (board_id, column_id, sort)`)

  /**
   * Jede Bewegung als Ereignis. Bei voller Mitarbeit ist das keine Kuer: ohne
   * Verlauf steht am Montag eine Karte woanders und niemand weiss, wer sie
   * verschoben hat.
   */
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_card_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      card_id UUID NOT NULL REFERENCES meeting_cards(id) ON DELETE CASCADE,
      meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
      kind TEXT NOT NULL,
      from_column UUID, to_column UUID,
      comment TEXT,
      actor_name TEXT, actor_email TEXT, actor_user_id UUID,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS meeting_card_events_idx ON meeting_card_events (card_id, created_at DESC)`)

  /** Entscheidungen. Eigene Tabelle, weil sie den Termin ueberdauern. */
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_decisions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      series_id UUID REFERENCES meeting_series(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      rationale TEXT,
      decided_by TEXT,
      consequence TEXT,
      supersedes_id UUID REFERENCES meeting_decisions(id) ON DELETE SET NULL,
      sort SMALLINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS meeting_decisions_idx ON meeting_decisions (meeting_id, sort)`)

  /**
   * Der eingefrorene Stand beim Abschliessen. Das Protokoll zeigt das lebende
   * Brett — dafuer ist es da. Was am Tag des Termins galt, muss trotzdem
   * nachlesbar bleiben, sonst ist es kein Protokoll, sondern eine Ansicht.
   */
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS meeting_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS meeting_snapshots_uniq ON meeting_snapshots (meeting_id)`)

  ready = true
}

/** Die Vorgabe je Brett. Wird beim Anlegen kopiert und ist danach aenderbar. */
export const BOARD_TEMPLATES = {
  themen: {
    name: 'Themen',
    columns: [
      { key: 'agenda', name: 'Agenda', color: '#6B7280' },
      { key: 'prio1', name: 'Prio 1', color: '#DC2626' },
      { key: 'prio2', name: 'Prio 2', color: '#D97706' },
      { key: 'prio3', name: 'Prio 3', color: '#0EA5E9' },
    ],
  },
  aktivitaeten: {
    name: 'Aktivitäten',
    columns: [
      { key: 'neu', name: 'Neu', color: '#6B7280' },
      { key: 'eingeplant', name: 'Eingeplant', color: '#0EA5E9' },
      { key: 'in_arbeit', name: 'In Arbeit', color: '#1A5FD4' },
      { key: 'off_track', name: 'Off Track', color: '#DC2626' },
      { key: 'erledigt', name: 'Erledigt', color: '#059669', is_done: true },
    ],
  },
} as const

export type BoardKind = keyof typeof BOARD_TEMPLATES
