import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { newsletterSubscribers, emailTemplates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { sendEmail, renderTemplate } from '@/lib/email/resend'
import {
  getDefaultDoiHtml,
  getDefaultDoiText,
  DEFAULT_DOI_SUBJECT,
} from '@/lib/email/doi-template'

const schema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  source: z.string().optional().default('website'),
  locale: z.string().optional().default('de'),
  consentGiven: z.boolean().optional().default(true),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, firstName, source, locale, consentGiven } = schema.parse(body)

    // ── 1. Save / upsert into our DB ──────────────────────────────────────────
    let subscriberId: string | null = null
    let isNew = false
    let doiToken: string | null = null

    try {
      const existing = await db
        .select({
          id: newsletterSubscribers.id,
          status: newsletterSubscribers.status,
          doiConfirmedAt: newsletterSubscribers.doiConfirmedAt,
        })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email))
        .limit(1)

      if (existing.length === 0) {
        // Neuer Subscriber
        doiToken = randomUUID()
        const inserted = await db
          .insert(newsletterSubscribers)
          .values({
            email,
            firstName: firstName ?? null,
            source,
            status: 'pending',
            lists: ['general'],
            consentGiven,
            consentAt: consentGiven ? new Date() : null,
            doiToken,
            doiSentAt: new Date(),
          })
          .returning({ id: newsletterSubscribers.id })
        subscriberId = inserted[0]?.id ?? null
        isNew = true
      } else if (existing[0].status === 'unsubscribed') {
        // Explizit abgemeldete Subscriber nicht neu aufnehmen
        return NextResponse.json({ success: true, resubscribe: false })
      } else if (!existing[0].doiConfirmedAt) {
        // Noch nicht bestätigt — neuen Token generieren und erneut senden
        doiToken = randomUUID()
        await db
          .update(newsletterSubscribers)
          .set({ doiToken, doiSentAt: new Date(), updatedAt: new Date() })
          .where(eq(newsletterSubscribers.email, email))
        subscriberId = existing[0].id
        isNew = false // Nicht wirklich neu, aber DOI wird erneut gesendet
      } else {
        // Bereits bestätigt — idempotent, kein erneutes Senden
        return NextResponse.json({ success: true, alreadyConfirmed: true })
      }
    } catch (dbErr) {
      console.error('DB error:', dbErr)
      return NextResponse.json(
        { error: 'Database error', detail: String(dbErr) },
        { status: 500 },
      )
    }

    // ── 2. DOI-Email via Resend senden ────────────────────────────────────────
    if (doiToken) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://eilersfriends.com'
      const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${doiToken}`
      const year = new Date().getFullYear().toString()
      const variables = {
        firstName: firstName ?? '',
        confirmUrl,
        year,
      }

      try {
        // Versuche DB-Template zu laden (für Admin-Editierbarkeit)
        let subject = DEFAULT_DOI_SUBJECT
        let html = getDefaultDoiHtml(variables)
        let text = getDefaultDoiText(variables)

        try {
          const templates = await db
            .select()
            .from(emailTemplates)
            .where(
              and(
                eq(emailTemplates.type, 'doi_confirmation'),
                eq(emailTemplates.locale, locale),
                eq(emailTemplates.isDefault, true)
              )
            )
            .limit(1)

          if (templates.length > 0) {
            const tpl = templates[0]
            subject = renderTemplate(tpl.subject, variables)
            html = renderTemplate(tpl.bodyHtml, variables)
            text = tpl.bodyText ? renderTemplate(tpl.bodyText, variables) : text
          }
        } catch (_) {
          // Kein DB-Template → Fallback auf hardcoded Template
        }

        await sendEmail({
          to: email,
          subject,
          html,
          text,
          fromName: 'Eilers+Friends',
          fromEmail: 'hallo@eilersfriends.com',
        })
      } catch (emailErr) {
        console.error('DOI email error:', emailErr)
        // Email-Fehler ist non-fatal — Subscriber ist gespeichert
        // In Production: Alert / Retry-Queue
      }
    }

    // ── 3. Beehiiv-Sync (optional, als Backup-Liste) ──────────────────────────
    const apiKey = process.env.BEEHIIV_API_KEY
    const pubId = process.env.BEEHIIV_PUBLICATION_ID

    if (apiKey && pubId && isNew) {
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
              send_welcome_email: false, // Wir senden unsere eigene DOI-Email
              double_opt_override: 'disabled', // Wir verwalten DOI selbst
              utm_source: source,
            }),
          }
        )

        if (res.ok) {
          const beehiivData = await res.json()
          const beehiivId = beehiivData?.data?.id as string | undefined
          if (beehiivId && subscriberId) {
            await db
              .update(newsletterSubscribers)
              .set({ beehiivId, beehiivSyncedAt: new Date(), updatedAt: new Date() })
              .where(eq(newsletterSubscribers.email, email))
          }
        } else {
          console.error('Beehiiv error:', await res.json())
        }
      } catch (beehiivErr) {
        console.error('Beehiiv fetch error:', beehiivErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Email-Adresse' }, { status: 400 })
    }
    console.error('Newsletter subscribe error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
