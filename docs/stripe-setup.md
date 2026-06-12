# Stripe Setup — SalesMade Academy Premium

**Live mode** · Account: EilersFriends (DE/EUR)

Configured: 2026-06-12

## Product
- ID: prod_Uh0RSFDBb1RyAR
- Name: SalesMade Academy · Premium Founding Member
- Tax code: txcd_20030000 (Educational services)

## Prices
- Yearly Upfront: price_1ThcQuHcbxS9gz2meFrcGpBj — 5485 EUR/year — `tax_behavior=exclusive`
- Monthly: price_1ThcQvHcbxS9gz2movOGKN1G — 549 EUR/month — `tax_behavior=exclusive`

## Vercel Env-Vars
- STRIPE_SECRET_KEY (encrypted, all targets) — rk_live restricted key
- STRIPE_PRICE_ACADEMY_YEARLY
- STRIPE_PRICE_ACADEMY_MONTHLY
- STRIPE_WEBHOOK_SECRET — PENDING (key needs `webhook_write` scope)

## Pending
- Webhook endpoint registration (after key permission update)
- /api/admin/seed-programs Bearer call
