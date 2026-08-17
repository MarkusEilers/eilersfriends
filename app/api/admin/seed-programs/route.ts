// app/api/admin/seed-programs/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureProgramsTables } from '@/lib/db/self-heal-programs'

export const runtime = 'nodejs'

const SEED_TOKEN = process.env.SEED_TOKEN

const ACADEMY_PREMIUM = {
  slug: 'salesmade-academy-premium',
  name: 'SalesMade Academy · Premium Founding Member',
  tagline: 'Selling is not Magic. It\'s an exact craft that can be learned.',
  category: 'membership',
  brand_color: '#1A5FD4',
  delivery_format: 'hybrid',
  enrollment_limit: 30,
  // Kein festes Datum mehr — das Launch-Fenster rolliert (lib/programs/launch-window.ts)
  enrollment_deadline: null as string | null,
  pricing_tiers: [
    {
      id: 'yearly-upfront',
      label: 'Yearly Upfront',
      price: 5800,
      currency: 'EUR',
      billing: 'yearly',
      stripe_price_id: process.env.STRIPE_PRICE_ACADEMY_YEARLY ?? '',
      is_highlighted: true,
      is_available: true,
      note: 'Lifetime Bonus: Preis bleibt für immer eingefroren — auch wenn die Academy später teurer wird.',
    },
    {
      id: 'monthly',
      label: 'Monatlich',
      price: 580,
      currency: 'EUR',
      billing: 'monthly',
      stripe_price_id: process.env.STRIPE_PRICE_ACADEMY_MONTHLY ?? '',
      is_highlighted: false,
      is_available: true,
      note: 'Monatlich kündbar. Lifetime Bonus gilt nur für Yearly Upfront.',
    },
  ],
  checkout_content: {
    promise: {
      headline: 'Das bekommst Du.',
      bullets: [
        { num: '1', title: 'Simulation & individuelles Assessment der 13 Skills', body: 'Du startest mit einer realen Sales-Simulation. Heraus kommt Dein Skill-Profil über 13 Dimensionen — von Discovery bis Close. Klar, ehrlich, mit Diagnose statt mit Plattituden.' },
        { num: '2', title: 'Individueller Entwicklungs-Fahrplan', body: 'Aus dem Assessment baut die Academy Deinen persönlichen Fahrplan: welche Skills, in welcher Reihenfolge, in welcher Dosierung. Kein One-Size-Fits-All.' },
        { check: true, title: '7 Frameworks · Schritt-für-Schritt', body: 'B2B-Angebote-Bauplan, Discovery-Scorecard, Pipeline-Builder, Win-Back-Sequenz, Negotiation-Map, Account-Plan, Forecast-Disziplin.' },
        { check: true, title: 'Jeden Monat 1:1 Sparring & Coaching mit Markus', body: '90 Minuten exklusive Zeit mit Markus, einmal monatlich. Du bringst Deinen echten Deal, Markus arbeitet live mit Dir.' },
        { check: true, title: 'Playbook-Library · 47 Templates', body: 'Pitches, Forecasts, Discovery-Notes, Win-Loss-Reviews — alle aus Markus\' B2B-Praxis, kopierbereit.' },
        { check: true, title: 'WhatsApp-Sparring · werktäglich', body: 'Stelle Markus die Deal-Frage am Morgen, hab die Antwort am Nachmittag. Persönlich, direkt, kein Kalender-Block.' },
        { check: true, title: 'Quartals-Review · 90 Min · 1-on-1', body: 'Pipeline-Check, Bauplan-Anpassung, Forecast-Korrektur. Mit echten Zahlen, nicht mit Hoffnung.' },
        { check: true, title: 'Community · Founding 30 Cohort', body: 'Andere B2B-Gründer, die genauso ticken. Asynchron im Member-Bereich, monatlich live. Markus moderiert mit.' },
      ],
    },
    outcomes: {
      headline: 'Sechs Sachen, die ab Tag eins anders laufen.',
      eyebrow: 'Das wird möglich',
      items: [
        'Verkaufen ohne unnötige Rabatte.',
        'Keine Deals, die slippen.',
        'Kundengewinnung über Mehrwerte (Value).',
        'Keine Besuche aus Hoffnung.',
        'Verkaufen ohne Hinterherjagen.',
        'Kunden, die ihr Wort halten.',
      ],
    },
    typical_effects: {
      headline: 'Was Klienten messbar verändert haben.',
      eyebrow: 'Typische Effekte',
      stats: [
        { value: '28 → 53 %', label: 'Annahmequote', color: '#F05A1A' },
        { value: '+579 %', label: 'SaaS-Umsatz / 6 Mo', color: '#1A5FD4' },
        { value: '< 3 Mo', label: 'Sales-Cycle', color: '#D4192B' },
        { value: '3x', label: 'verkauft sich besser', color: '#0D0D0B' },
      ],
      note: 'Quellen: Arman-Ad-Text-001 (2023), Customer-Cases GMG/NFON/ionder/Perelik/five9s — alle dokumentiert.',
    },
    testimonials: {
      headline: 'Was Klienten sagen.',
      eyebrow: 'Referenzen',
      items: [
        { quote: 'Wir verkaufen uns Ihr Zeug hier ja selbst.', author: 'Kunde nach drei Wochen Bauplan-Arbeit' },
        { quote: 'Sales-Cycle von 14 auf 3 Wochen. Der CFO im Pitch hat die Tabelle abfotografiert.', author: 'IT-Security-Anbieter, Wien' },
        { quote: 'Markus, das Blatt hat mehr verkauft als ich.', author: 'Sales-Coach, München' },
      ],
    },
    why_now: {
      headline: 'Warum jetzt.',
      bullets: [
        '<strong>Aktuelle Launch-Phase läuft.</strong> Nach Ablauf des Fensters startet die nächste Runde zum dann gültigen Preis.',
        '<strong>Lifetime Bonus gilt jetzt.</strong> Dein Jahres-Preis von 5.800 € bleibt für immer eingefroren — auch wenn die Academy später teurer wird.',
        '<strong>Markus persönlich, bis 30.</strong> Über 30 Founding-Member skaliert Markus\' Zeit nicht mehr ohne Wartelisten.',
        '<strong>Der nächste Pitch zählt jetzt.</strong> Wer das Bauplan-Framework nach Tag 7 anwendet, sieht den Effekt im nächsten Kunden-Gespräch.',
      ],
    },
    faqs: [
      { q: 'Was passiert nach dem Kauf?', a: 'Du bekommst eine Email mit Account-Setup, WhatsApp-Einladung und dem ersten Onboarding-Call-Link binnen 24 Stunden.' },
      { q: 'Was bedeutet der „Lifetime Bonus" konkret?', a: 'Du zahlst jährlich 5.800 € für Deine Premium Membership. Der Lifetime Bonus, den Du als Founding-30-Member bekommst: Dein Jahres-Preis bleibt für immer eingefroren. Selbst wenn die Academy in zwei Jahren auf 8.000 € oder 12.000 € pro Jahr steigt — Du zahlst weiter Deine 5.800 €, solange Du dabei bist.' },
      { q: 'Risikoumkehr?', a: '14 Tage Geld zurück, ohne Frage. Wenn Du nach den ersten zwei Sessions feststellst, dass das nicht passt — Email an team@eilersfriends.com, voller Refund.' },
      { q: 'Wie funktioniert die Reverse-Charge bei UStID?', a: 'Wenn Du eine gültige UStID außerhalb DE angibst, stellen wir steuerfrei (Reverse-Charge §13b UStG). Bei DE-UStID gilt 19 % MwSt.' },
    ],
  },
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!SEED_TOKEN || token !== SEED_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await ensureProgramsTables()

  const p = ACADEMY_PREMIUM
  await db.execute(sql`
    INSERT INTO programs (slug, name, tagline, category, brand_color, delivery_format,
      enrollment_limit, enrollment_deadline, pricing_tiers, checkout_content,
      is_active, published_at, updated_at)
    VALUES (${p.slug}, ${p.name}, ${p.tagline}, ${p.category}, ${p.brand_color},
      ${p.delivery_format}, ${p.enrollment_limit}, ${p.enrollment_deadline},
      ${JSON.stringify(p.pricing_tiers)}::jsonb, ${JSON.stringify(p.checkout_content)}::jsonb,
      true, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name, tagline = EXCLUDED.tagline, category = EXCLUDED.category,
      brand_color = EXCLUDED.brand_color, delivery_format = EXCLUDED.delivery_format,
      enrollment_limit = EXCLUDED.enrollment_limit, enrollment_deadline = EXCLUDED.enrollment_deadline,
      pricing_tiers = EXCLUDED.pricing_tiers, checkout_content = EXCLUDED.checkout_content,
      updated_at = NOW()
  `)

  return NextResponse.json({ ok: true, seeded: p.slug })
}
