import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, firstName } = schema.parse(body)

    const apiKey = process.env.BEEHIIV_API_KEY
    const pubId = process.env.BEEHIIV_PUBLICATION_ID

    if (!apiKey || !pubId) {
      return NextResponse.json({ error: 'Newsletter not configured' }, { status: 503 })
    }

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
          utm_source: 'website',
        }),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      console.error('Beehiiv error:', err)
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
