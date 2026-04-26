import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  source: z.string().optional().default('website'),
  consentGiven: z.boolean().optional().default(true),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, firstName, source, consentGiven } = schema.parse(body)

    // 1. Save / upsert into our own DB first
    try {
      const existing = await db
        .select({ id: newsletterSubscribers.id, status: newsletterSubscribers.status })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(newsletterSubscribers).values({
          email,
          firstName: firstName ?? null,
          source,
          status: 'pending',
          lists: ['general'],
          consentGiven,
          consentAt: consentGiven ? new Date() : null,
        })
      } else if (existing[0].status === 'unsubscribed') {
        // Don't re-subscribe someone who explicitly unsubscribed
        return NextResponse.json({ success: true, resubscribe: false })
      }
      // If already pending/active, just continue (idempotent)
    } catch (dbErr) {
      console.error('DB insert error:', dbErr)
      // Don't fail the whole request if DB is not yet set up
    }

    // 2. Forward to Beehiiv if configured
    const apiKey = process.env.BEEHIIV_API_KEY
    const pubId = process.env.BEEHIIV_PUBLICATION_ID

    if (apiKey && pubId) {
      try {
        const res = await fetch(
          `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              email,
              first_name: firstName,
              reactivate_existing: false,
              send_welcome_email: true,
              double_opt_override: 'enabled',
              utm_source: source,
            }),
          }
        )

        if (res.ok) {
          const beehiivData = await res.json()
          const beehiivId = beehiivData?.data?.id

          // Update DB with Beehiiv ID
          if (beehiivId) {
            try {
              await db
                .update(newsletterSubscribers)
                .set({ beehiivId, beehiivSyncedAt: new Date(), status: 'active', updatedAt: new Date() })
                .where(eq(newsletterSubscribers.email, email))
            } catch (_) {
              // non-fatal
            }
          }
        } else {
          const err = await res.json()
          console.error('Beehiiv error:', err)
        }
      } catch (beehiivErr) {
        console.error('Beehiiv fetch error:', beehiivErr)
        // Beehiiv errors are non-fatal — subscriber is in our DB
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    console.error('Newsletter subscribe error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
