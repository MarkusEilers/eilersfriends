import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureCompanyProfile } from '@/lib/db/self-heal'
import { ensureBauplanV2Tables } from '@/lib/db/self-heal-v2'

export const runtime = 'nodejs'
export const maxDuration = 30
function rowsOf<T>(r: unknown): T[] { if (Array.isArray(r)) return r as T[]; if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] } return [] }

export async function POST(_r: Request, { params }: { params: Promise<{ draftId: string }> }) {
  const s = await auth(); if (!s?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId } = await params
  await ensureCompanyProfile(); await ensureBauplanV2Tables()
  const profile = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT industry, target_audience FROM company_profile WHERE user_id = ${s.user.id} LIMIT 1`))[0]
  const product = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT product_name, product_summary FROM bauplan_product WHERE bauplan_id = ${draftId} LIMIT 1`))[0]
  const plan = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT name, end_goal FROM bauplan_bulletproof_plans WHERE bauplan_id = ${draftId} LIMIT 1`))[0]

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 })

  const systemPrompt = `Du generierst 5 Naming-Patterns fuer ein B2B-Angebot.
PATTERNS: mechanism (z.B. "Wachstumsmotor"), outcome (z.B. "CFO-Survival"), time (z.B. "12-Wochen-Bauplan"), anti-pattern (z.B. "Anti-Pitch-Programm"), inside-joke (z.B. "Excel-Entzug fuer Sales").
KEINE Pseudo-griechischen Woerter ("FlowSync 360"). KEINE Tech-Bro-Komposita. Konkret + branchen-spezifisch.
Headline pro Variante: 1 Satz, USer-Outcome-fokussiert, max 1 Targeting-Detail.
CTA: Mikro-Schritt (z.B. "45-Min-Sparring buchen"), nicht Makro.

Antwort als JSON.`

  const userPrompt = `PRODUKT: ${product?.product_name ?? '—'} — ${product?.product_summary ?? '—'}
ZIELGRUPPE: ${profile?.target_audience ?? '—'} (${profile?.industry ?? '—'})
METHODIK: ${plan?.name ?? '—'}
END-GOAL: ${plan?.end_goal ?? '—'}

Gib 5 Varianten zurueck:
{
  "variants": [
    { "pattern": "mechanism", "name": "...", "headline": "...", "cta": "...", "espressoTestPassed": true },
    { "pattern": "outcome", "name": "...", "headline": "...", "cta": "...", "espressoTestPassed": true },
    { "pattern": "time", "name": "...", "headline": "...", "cta": "...", "espressoTestPassed": true },
    { "pattern": "anti-pattern", "name": "...", "headline": "...", "cta": "...", "espressoTestPassed": true },
    { "pattern": "inside-joke", "name": "...", "headline": "...", "cta": "...", "espressoTestPassed": true }
  ]
}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.7, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] }),
    })
    if (!res.ok) return NextResponse.json({ error: `OpenAI ${res.status}` }, { status: 502 })
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? '{}'
    let parsed: Record<string, unknown> = {}
    try { parsed = JSON.parse(content) } catch { return NextResponse.json({ error: 'AI returned non-JSON' }, { status: 502 }) }
    return NextResponse.json({ ok: true, variants: parsed.variants ?? [] })
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }) }
}
