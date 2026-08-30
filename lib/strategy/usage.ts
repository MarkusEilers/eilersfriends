import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

/**
 * Verbrauch und Kundenkonto.
 *
 * Jeder KI-Lauf erzeugt einen Eintrag im Kontobuch: Datum, Aktion, Tokens,
 * unsere Kosten und der Betrag, den der Kunde zahlt. Der Saldo läuft mit.
 *
 * Preise stehen in einer Tabelle, nicht im Code — Modellpreise ändern sich,
 * und alte Läufe müssen mit dem damals gültigen Preis bewertet bleiben.
 */

let ensured = false

export async function ensureUsageSchema() {
  if (ensured) return

  // Modellpreise, gültig ab einem Datum. Beträge in EUR je 1 Mio. Tokens.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_model_prices (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      model          TEXT NOT NULL,
      input_per_1m   NUMERIC(10,4) NOT NULL,
      output_per_1m  NUMERIC(10,4) NOT NULL,
      currency       TEXT NOT NULL DEFAULT 'EUR',
      valid_from     DATE NOT NULL DEFAULT CURRENT_DATE,
      note           TEXT,
      created_at     TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ai_model_prices_lookup ON ai_model_prices (model, valid_from DESC)`)

  // Abrechnungseinstellungen je Kunde
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS billing_settings (
      company_id       UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
      markup_factor    NUMERIC(6,2) NOT NULL DEFAULT 3.0,
      base_fee_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency         TEXT NOT NULL DEFAULT 'EUR',
      mode             TEXT NOT NULL DEFAULT 'prepaid',   -- prepaid | postpaid
      low_balance_at   NUMERIC(10,2) NOT NULL DEFAULT 10, -- Warnschwelle
      is_active        BOOLEAN NOT NULL DEFAULT true,
      updated_at       TIMESTAMPTZ DEFAULT now()
    )`)

  // Das Kontobuch: eine Zeile je Vorgang, Saldo läuft mit
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS usage_ledger (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      product_id    UUID,
      occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      kind          TEXT NOT NULL,          -- usage | topup | base_fee | adjustment
      action        TEXT NOT NULL,          -- z.B. 'Recherche · NovoDaily'
      agent_key     TEXT,
      model         TEXT,
      tokens_in     INTEGER NOT NULL DEFAULT 0,
      tokens_out    INTEGER NOT NULL DEFAULT 0,
      cost_eur      NUMERIC(12,6) NOT NULL DEFAULT 0,   -- was es uns kostet
      amount_eur    NUMERIC(12,4) NOT NULL DEFAULT 0,   -- was der Kunde zahlt (negativ = Belastung)
      markup_factor NUMERIC(6,2),
      balance_after NUMERIC(12,4) NOT NULL DEFAULT 0,
      ai_run_id     UUID,
      note          TEXT,
      created_by    UUID REFERENCES users(id),
      created_at    TIMESTAMPTZ DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS usage_ledger_company ON usage_ledger (company_id, occurred_at DESC)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS usage_ledger_run ON usage_ledger (ai_run_id)`)

  ensured = true
}

export interface Price { model: string; input_per_1m: number; output_per_1m: number }

/** Der zum Zeitpunkt gültige Preis. Ohne Eintrag: 0 — dann fällt es im Konto auf. */
export async function priceFor(model: string, at?: Date): Promise<Price | null> {
  await ensureUsageSchema()
  const res = await db.execute(sql`
    SELECT model, input_per_1m::float8 AS input_per_1m, output_per_1m::float8 AS output_per_1m
    FROM ai_model_prices
    WHERE model = ${model} AND valid_from <= ${(at ?? new Date()).toISOString().slice(0, 10)}::date
    ORDER BY valid_from DESC LIMIT 1`)
  return (res as unknown as Price[])[0] ?? null
}

export async function settingsFor(companyId: string) {
  await ensureUsageSchema()
  await db.execute(sql`
    INSERT INTO billing_settings (company_id) VALUES (${companyId}) ON CONFLICT (company_id) DO NOTHING`)
  const res = await db.execute(sql`
    SELECT markup_factor::float8 AS markup_factor, base_fee_monthly::float8 AS base_fee_monthly,
           currency, mode, low_balance_at::float8 AS low_balance_at, is_active
    FROM billing_settings WHERE company_id = ${companyId}`)
  return (res as unknown as { markup_factor: number; base_fee_monthly: number; currency: string; mode: string; low_balance_at: number; is_active: boolean }[])[0]
}

export async function balanceOf(companyId: string): Promise<number> {
  await ensureUsageSchema()
  const res = await db.execute(sql`
    SELECT COALESCE(SUM(amount_eur), 0)::float8 AS bal FROM usage_ledger WHERE company_id = ${companyId}`)
  return (res as unknown as { bal: number }[])[0]?.bal ?? 0
}

/**
 * Einen KI-Lauf verbuchen. Kosten aus der Preistabelle, Betrag mit Aufschlag.
 * Belastungen sind negativ, Aufladungen positiv — der Saldo ist die Summe.
 */
export async function recordUsage(input: {
  companyId: string; productId?: string | null
  action: string; agentKey?: string | null; model: string
  tokensIn: number; tokensOut: number
  aiRunId?: string | null; occurredAt?: Date
}): Promise<{ costEur: number; amountEur: number; balance: number }> {
  await ensureUsageSchema()
  const at = input.occurredAt ?? new Date()
  const price = await priceFor(input.model, at)
  const cost = price
    ? (input.tokensIn / 1_000_000) * price.input_per_1m + (input.tokensOut / 1_000_000) * price.output_per_1m
    : 0
  const s = await settingsFor(input.companyId)
  const amount = -(cost * (s?.markup_factor ?? 3))
  const balance = (await balanceOf(input.companyId)) + amount

  await db.execute(sql`
    INSERT INTO usage_ledger (company_id, product_id, occurred_at, kind, action, agent_key, model,
      tokens_in, tokens_out, cost_eur, amount_eur, markup_factor, balance_after, ai_run_id)
    VALUES (${input.companyId}, ${input.productId ?? null}, ${at.toISOString()}, 'usage', ${input.action},
      ${input.agentKey ?? null}, ${input.model}, ${input.tokensIn}, ${input.tokensOut},
      ${cost}, ${amount}, ${s?.markup_factor ?? 3}, ${balance}, ${input.aiRunId ?? null})`)
  return { costEur: cost, amountEur: amount, balance }
}

/** Guthaben aufladen. */
export async function topUp(input: { companyId: string; amountEur: number; note?: string; userId?: string | null }) {
  await ensureUsageSchema()
  const balance = (await balanceOf(input.companyId)) + input.amountEur
  await db.execute(sql`
    INSERT INTO usage_ledger (company_id, kind, action, amount_eur, balance_after, note, created_by)
    VALUES (${input.companyId}, 'topup', 'Guthaben aufgeladen', ${input.amountEur}, ${balance},
            ${input.note ?? null}, ${input.userId ?? null})`)
  return balance
}

/** Monatliche Grundgebühr buchen (idempotent je Monat). */
export async function chargeBaseFee(companyId: string, monthISO?: string) {
  await ensureUsageSchema()
  const month = monthISO ?? new Date().toISOString().slice(0, 7)
  const s = await settingsFor(companyId)
  if (!s || Number(s.base_fee_monthly) <= 0) return null
  const exists = await db.execute(sql`
    SELECT 1 FROM usage_ledger WHERE company_id = ${companyId} AND kind = 'base_fee'
      AND to_char(occurred_at, 'YYYY-MM') = ${month} LIMIT 1`)
  if ((exists as unknown as unknown[]).length) return null
  const amount = -Number(s.base_fee_monthly)
  const balance = (await balanceOf(companyId)) + amount
  await db.execute(sql`
    INSERT INTO usage_ledger (company_id, kind, action, amount_eur, balance_after, occurred_at)
    VALUES (${companyId}, 'base_fee', ${'Grundgebühr ' + month}, ${amount}, ${balance}, ${month + '-01'}::timestamptz)`)
  return balance
}

export interface LedgerRow {
  occurred_at: string; kind: string; action: string; agent_key: string | null
  model: string | null; tokens_in: number; tokens_out: number
  cost_eur: number; amount_eur: number; balance_after: number
}

export async function ledger(companyId: string, limit = 100): Promise<LedgerRow[]> {
  await ensureUsageSchema()
  const res = await db.execute(sql`
    SELECT occurred_at, kind, action, agent_key, model, tokens_in, tokens_out,
           cost_eur::float8 AS cost_eur, amount_eur::float8 AS amount_eur, balance_after::float8 AS balance_after
    FROM usage_ledger WHERE company_id = ${companyId}
    ORDER BY occurred_at DESC, created_at DESC LIMIT ${limit}`)
  return res as unknown as LedgerRow[]
}

/** Monatsübersicht für die Rechnung. */
export async function monthlySummary(companyId: string) {
  await ensureUsageSchema()
  const res = await db.execute(sql`
    SELECT to_char(occurred_at, 'YYYY-MM') AS month,
           count(*) FILTER (WHERE kind = 'usage') AS runs,
           COALESCE(SUM(tokens_in), 0) AS tokens_in,
           COALESCE(SUM(tokens_out), 0) AS tokens_out,
           COALESCE(SUM(cost_eur) FILTER (WHERE kind = 'usage'), 0)::float8 AS cost_eur,
           COALESCE(SUM(-amount_eur) FILTER (WHERE amount_eur < 0), 0)::float8 AS billed_eur,
           COALESCE(SUM(amount_eur) FILTER (WHERE kind = 'topup'), 0)::float8 AS topups_eur
    FROM usage_ledger WHERE company_id = ${companyId}
    GROUP BY 1 ORDER BY 1 DESC`)
  return res as unknown as Array<{ month: string; runs: number; tokens_in: number; tokens_out: number; cost_eur: number; billed_eur: number; topups_eur: number }>
}
