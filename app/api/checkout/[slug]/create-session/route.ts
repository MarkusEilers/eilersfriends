// app/api/checkout/[slug]/create-session/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import Stripe from 'stripe'
import { ensureProgramsTables } from '@/lib/db/self-heal-programs'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 15

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

interface PricingTier {
  id: string
  label: string
  price: number
  currency: 'EUR' | 'USD' | 'GBP'
  billing: 'one-time' | 'monthly' | 'yearly' | 'lifetime'
  stripe_price_id: string
  is_available: boolean
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const session = await auth()
  const userId = session?.user?.id ?? null

  await ensureProgramsTables()

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const tierId = (body.tierId as string) ?? ''
  const customerEmail = (body.email as string) ?? ''
  const customerName = (body.name as string) ?? ''
  const company = (body.company as string) ?? ''
  const vatId = (body.vatId as string) ?? ''
  const billingAddress = (body.billingAddress as Record<string, unknown>) ?? {}
  const acceptTerms = Boolean(body.acceptTerms)
  const eventCity = (body.city as string) ?? ''
  const seats = Math.max(1, Math.min(200, Math.floor(Number(body.seats) || 1)))
  const freeSeats = Math.floor(seats / 5)
  const paidSeats = Math.max(1, seats - freeSeats)

  if (!customerEmail || !customerName) {
    return NextResponse.json({ error: 'Name + Email pflicht' }, { status: 400 })
  }
  if (!acceptTerms) {
    return NextResponse.json({ error: 'Bitte AGB akzeptieren' }, { status: 400 })
  }

  // Server-seitige Fallback-Angebote ohne DB-Row (Preis bleibt autoritativ).
  const FALLBACK: Record<string, { name: string; tiers: PricingTier[] }> = {
    'salesmade-ai-intensive': {
      name: 'SalesMade AI Intensive',
      tiers: [{
        id: 'ai-intensive-onetime', label: 'AI Intensive · 2 Tage', price: 897,
        currency: 'EUR', billing: 'one-time', stripe_price_id: '', is_available: true,
      }],
    },
    'mystery-shopping': {
      name: 'Mystery Shopping',
      tiers: [{
        id: 'mystery-onetime', label: 'Mystery Shopping', price: 1,
        currency: 'EUR', billing: 'one-time', stripe_price_id: '', is_available: true,
      }],
    },
  }

  const programRows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`SELECT id, slug, name, pricing_tiers FROM programs WHERE slug = ${slug} AND is_active = true LIMIT 1`)
  )
  let program: Record<string, unknown>
  let tiers: PricingTier[]
  if (programRows.length === 0) {
    const fb = FALLBACK[slug]
    if (!fb) {
      return NextResponse.json({ error: 'Programm nicht gefunden' }, { status: 404 })
    }
    program = { id: null, name: fb.name }
    tiers = fb.tiers
  } else {
    program = programRows[0]!
    tiers = (program.pricing_tiers ?? []) as PricingTier[]
  }
  const tier = tiers.find((t) => t.id === tierId && t.is_available)
  if (!tier) {
    return NextResponse.json({ error: 'Tier nicht verfügbar' }, { status: 400 })
  }
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY missing' }, { status: 500 })
  }
  const stripe = new Stripe(stripeKey)

  // Determine mode: subscription for recurring, payment for one-time
  const mode: Stripe.Checkout.SessionCreateParams.Mode =
    tier.billing === 'one-time' || tier.billing === 'lifetime' ? 'payment' : 'subscription'

  if (mode === 'subscription' && !tier.stripe_price_id) {
    return NextResponse.json({
      error: 'Stripe-Price-ID fehlt — für wiederkehrende Tiers bitte STRIPE_PRICE_* in Vercel-Env setzen.',
    }, { status: 500 })
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = tier.stripe_price_id
    ? [{ price: tier.stripe_price_id, quantity: paidSeats }]
    : [{
        price_data: {
          currency: (tier.currency || 'EUR').toLowerCase(),
          unit_amount: Math.round(tier.price * 100),
          tax_behavior: 'exclusive',
          product_data: { name: `${String(program.name)} — ${tier.label}` },
        },
        quantity: paidSeats,
      }]

  const origin = new URL(request.url).origin
  const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&slug=${slug}`
  const cancelUrl = `${origin}/checkout/${slug}?cancelled=1`

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      mode,
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: 'required',
      metadata: {
        kind: 'program-purchase',
        program_slug: slug,
        program_id: program.id ? String(program.id) : '',
        tier_id: tier.id,
        user_id: userId ?? '',
        customer_name: customerName,
        company,
        vat_id_supplied: vatId,
        total_seats: String(seats),
        paid_seats: String(paidSeats),
        free_seats: String(freeSeats),
        event_city: eventCity,
      },
      subscription_data: mode === 'subscription' ? {
        metadata: {
          program_slug: slug,
          tier_id: tier.id,
          user_id: userId ?? '',
        },
      } : undefined,
    })

    // Store pending session in DB for audit / recovery
    await db.execute(sql`
      INSERT INTO checkout_sessions (user_id, program_id, pricing_tier_id, stripe_session_id, stripe_url,
        customer_email, customer_name, company, vat_id, billing_address, status)
      VALUES (${userId}, ${program.id as string}, ${tier.id}, ${stripeSession.id}, ${stripeSession.url ?? ''},
        ${customerEmail}, ${customerName}, ${company}, ${vatId},
        ${JSON.stringify(billingAddress)}::jsonb, 'created')
    `)

    return NextResponse.json({ ok: true, url: stripeSession.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Stripe error: ' + msg }, { status: 500 })
  }
}
