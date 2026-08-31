import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureContentSchema } from './schema'

/**
 * Claims-Pruefung nach einstellbaren Regeln.
 *
 * Was gesagt werden darf, ist eine Frage des Marktes, nicht des Geschmacks. Ein
 * Biotech-Anbieter darf keine Heilwirkung behaupten; einer Agentur ist derselbe
 * Satz gleichgueltig. Deshalb gehoeren die Regeln in die Datenbank und nicht in
 * den Code — und sie gelten je Kunde.
 *
 * Die Pruefung ersetzt keinen Juristen. Sie sorgt dafuer, dass niemand einen
 * Satz freigibt, ohne ihn gesehen zu haben.
 */

export type Severity = 'hinweis' | 'pruefen' | 'unzulaessig'

export interface ClaimsRule {
  id: string; category: string; pattern: string; is_regex: boolean
  severity: Severity; explanation: string | null; suggestion: string | null
}

export interface ClaimsHit {
  rule_id: string; category: string; severity: Severity
  matched: string; explanation: string | null; suggestion: string | null
}

/** Regeln, die fuer alle gelten (company_id IS NULL), plus die des Kunden. */
export async function rulesFor(companyId: string): Promise<ClaimsRule[]> {
  await ensureContentSchema()
  const rows = await db.execute(sql`
    SELECT id, category, pattern, is_regex, severity, explanation, suggestion
    FROM content_claims_rules
    WHERE is_active AND (company_id IS NULL OR company_id = ${companyId})`)
  return rows as unknown as ClaimsRule[]
}

export function applyRules(text: string, rules: ClaimsRule[]): ClaimsHit[] {
  const hits: ClaimsHit[] = []
  for (const r of rules) {
    let matched: string | null = null
    if (r.is_regex) {
      try {
        const m = new RegExp(r.pattern, 'iu').exec(text)
        if (m) matched = m[0]
      } catch { /* kaputte Regel darf den Lauf nicht stoppen */ }
    } else if (text.toLowerCase().includes(r.pattern.toLowerCase())) {
      matched = r.pattern
    }
    if (matched) {
      hits.push({
        rule_id: r.id, category: r.category, severity: r.severity,
        matched, explanation: r.explanation, suggestion: r.suggestion,
      })
    }
  }
  return hits
}

const RANK: Record<Severity, number> = { hinweis: 1, pruefen: 2, unzulaessig: 3 }

export function verdictOf(hits: ClaimsHit[]): 'unbedenklich' | Severity {
  if (!hits.length) return 'unbedenklich'
  return hits.reduce<Severity>((worst, h) => (RANK[h.severity] > RANK[worst] ? h.severity : worst), 'hinweis')
}

/** Einen Baustein pruefen und das Ergebnis an ihm vermerken. */
export async function checkSnippet(snippetId: string): Promise<{ status: string; hits: ClaimsHit[] }> {
  await ensureContentSchema()
  const rows = await db.execute(sql`SELECT company_id, text FROM content_catalog WHERE id = ${snippetId}`)
  const row = (rows as unknown as { company_id: string; text: string }[])[0]
  if (!row) throw new Error('Baustein nicht gefunden')
  const hits = applyRules(row.text, await rulesFor(row.company_id))
  const status = verdictOf(hits)
  await db.execute(sql`
    UPDATE content_catalog SET claims_status = ${status}, claims_hits = ${JSON.stringify(hits)}::jsonb,
      status = CASE WHEN ${status} = 'unzulaessig' THEN 'gesperrt' ELSE status END,
      updated_at = now()
    WHERE id = ${snippetId}`)
  return { status, hits }
}

/** Freien Text pruefen, ohne ihn aufzunehmen — fuer den Editor. */
export async function checkText(companyId: string, text: string) {
  const hits = applyRules(text, await rulesFor(companyId))
  return { status: verdictOf(hits), hits }
}

/**
 * Startregeln. Bewusst knapp und bewusst streitbar — sie sollen im Gebrauch
 * geschaerft werden, nicht vollstaendig sein.
 */
export const STARTER_RULES: Array<Omit<ClaimsRule, 'id'>> = [
  { category: 'heilversprechen', pattern: '\\b(heilt|heilung|therapiert|kuriert|beseitigt (die )?krankheit)\\b',
    is_regex: true, severity: 'unzulaessig',
    explanation: 'Heilaussagen sind ausserhalb zugelassener Arzneimittel unzulaessig.',
    suggestion: 'Beschreibe die Massnahme und das beobachtbare Ergebnis, nicht die Heilung.' },
  { category: 'gesundheitsbezug', pattern: '\\b(beugt .{0,20}vor|schuetzt vor|verhindert .{0,20}(krankheit|mangel))\\b',
    is_regex: true, severity: 'pruefen',
    explanation: 'Praeventionsaussagen brauchen einen zugelassenen Health Claim.',
    suggestion: 'Auf einen zugelassenen Claim stuetzen oder als Beobachtung formulieren.' },
  { category: 'garantie', pattern: '\\b(garantiert|garantie auf (den )?erfolg|100 ?% (sicher|erfolg))\\b',
    is_regex: true, severity: 'pruefen',
    explanation: 'Erfolgszusagen binden — sie muessen einloesbar sein.',
    suggestion: 'Nur zusagen, was ohne Streit einloesbar ist. Sonst ein Versprechen mit Name und Frist.' },
  { category: 'superlativ', pattern: '\\b(der|die|das) (beste|einzige|fuehrende|sicherste)\\b',
    is_regex: true, severity: 'hinweis',
    explanation: 'Alleinstellungs-Superlative sind angreifbar, wenn sie nicht belegt sind.',
    suggestion: 'Beleg dazu oder Aussage konkretisieren.' },
  { category: 'ehrlichkeits_marker', pattern: '\\b(ganz ehrlich|klartext|ohne bullshit|die ehrliche (rechnung|bandbreite))\\b',
    is_regex: true, severity: 'hinweis',
    explanation: 'Der Leser hoert: sonst luegt ihr also. Untergraebt genau das Vertrauen, das der Satz aufbauen soll.',
    suggestion: 'Die Zahl oder Beobachtung einfach nennen, ohne ihre Wahrhaftigkeit zu beteuern.' },
]

export async function seedStarterRules(companyId?: string | null) {
  await ensureContentSchema()
  for (const r of STARTER_RULES) {
    await db.execute(sql`
      INSERT INTO content_claims_rules (company_id, category, pattern, is_regex, severity, explanation, suggestion)
      SELECT ${companyId ?? null}, ${r.category}, ${r.pattern}, ${r.is_regex}, ${r.severity}, ${r.explanation}, ${r.suggestion}
      WHERE NOT EXISTS (
        SELECT 1 FROM content_claims_rules
        WHERE pattern = ${r.pattern} AND company_id IS NOT DISTINCT FROM ${companyId ?? null})`)
  }
  return STARTER_RULES.length
}
