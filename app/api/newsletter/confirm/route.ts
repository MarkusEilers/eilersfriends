import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsletterSubscribers, emailTemplates, emailSequences, emailSequenceEnrollments } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { sendEmail, renderTemplate } from '@/lib/email/resend'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://eilersfriends.com'

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/?doi=invalid`)
  }

  try {
    // 1. Subscriber anhand des Tokens finden
    const subscribers = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.doiToken, token))
      .limit(1)

    if (subscribers.length === 0) {
      return NextResponse.redirect(`${baseUrl}/?doi=invalid`)
    }

    const subscriber = subscribers[0]

    // Bereits bestätigt → direkt weiterleiten
    if (subscriber.doiConfirmedAt) {
      return NextResponse.redirect(`${baseUrl}/?doi=already_confirmed`)
    }

    // 2. DOI bestätigen
    await db
      .update(newsletterSubscribers)
      .set({
        status: 'active',
        doiConfirmedAt: new Date(),
        doiToken: null, // Token nach Bestätigung löschen
        updatedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.id, subscriber.id))

    // 3. Beehiiv-Status auf active setzen (falls vorhanden)
    if (subscriber.beehiivId) {
      const apiKey = process.env.BEEHIIV_API_KEY
      const pubId = process.env.BEEHIIV_PUBLICATION_ID
      if (apiKey && pubId) {
        try {
          await fetch(
            `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions/${subscriber.beehiivId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({ status: 'active' }),
            }
          )
        } catch (_) { /* non-fatal */ }
      }
    }

    // 4. Welcome-Email senden
    try {
      const locale = 'de' // TODO: aus Subscriber-Daten ableiten
      const variables = {
        firstName: subscriber.firstName ?? '',
        year: new Date().getFullYear().toString(),
        loginUrl: `${baseUrl}/auth/login`,
      }

      let subject = '🎉 Du bist dabei! Willkommen bei Eilers+Friends'
      let html = getDefaultWelcomeHtml(variables)

      try {
        const templates = await db
          .select()
          .from(emailTemplates)
          .where(
            and(
              eq(emailTemplates.type, 'doi_welcome'),
              eq(emailTemplates.locale, locale),
              eq(emailTemplates.isDefault, true)
            )
          )
          .limit(1)

        if (templates.length > 0) {
          const tpl = templates[0]
          subject = renderTemplate(tpl.subject, variables)
          html = renderTemplate(tpl.bodyHtml, variables)
        }
      } catch (_) { /* Fallback auf hardcoded */ }

      await sendEmail({
        to: subscriber.email,
        subject,
        html,
        fromName: 'Markus & Aljona von Eilers+Friends',
        fromEmail: 'hallo@eilersfriends.com',
      })
    } catch (emailErr) {
      console.error('Welcome email error:', emailErr)
    }

    // 5. Email-Sequenz triggern (doi_confirmed)
    try {
      const activeSequences = await db
        .select()
        .from(emailSequences)
        .where(
          and(
            eq(emailSequences.trigger, 'doi_confirmed'),
            eq(emailSequences.isActive, true)
          )
        )

      for (const sequence of activeSequences) {
        await db.insert(emailSequenceEnrollments).values({
          subscriberId: subscriber.id,
          sequenceId: sequence.id,
          currentStep: 0,
          status: 'active',
          nextSendAt: new Date(), // Schritt 0 kann sofort starten
        }).onConflictDoNothing()
      }
    } catch (_) { /* non-fatal */ }

    // 6. Weiterleitung zur Danke-Seite
    return NextResponse.redirect(`${baseUrl}/?doi=confirmed`)
  } catch (err) {
    console.error('DOI confirm error:', err)
    return NextResponse.redirect(`${baseUrl}/?doi=error`)
  }
}

// ─── Default Welcome-Email ────────────────────────────────────────────────────

function getDefaultWelcomeHtml(variables: {
  firstName: string
  year: string
  loginUrl: string
}): string {
  const { firstName, year } = variables
  const greeting = firstName ? `Hey ${firstName}!` : 'Hey!'

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Willkommen bei Eilers+Friends</title>
  <style>
    body { margin: 0; padding: 0; background: #FAFAF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; }
    .header { background: #0A0D14; padding: 32px 40px; text-align: center; }
    .logo { color: #ffffff; font-size: 20px; font-weight: 700; }
    .logo span { color: #F05A1A; }
    .body { padding: 40px; }
    .body h1 { margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0D0D0B; }
    .body p { margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #4b5563; }
    .signature { margin-top: 32px; font-size: 15px; color: #0D0D0B; font-weight: 600; }
    .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Eilers<span>+</span>Friends</div>
    </div>
    <div class="body">
      <h1>${greeting} Du bist dabei!🎉</h1>
      <p>
        Deine Email-Adresse ist bestätigt — willkommen in unserer Community
        für ambitionierte Gründer:innen und Führungskräfte.
      </p>
      <p>
        In den nächsten Tagen bekommst du von uns wertvolle Einblicke zu den
        Themen planbare Umsätze, Teamführung und skalierbares Wachstum.
      </p>
      <p>
        Wenn du Fragen hast oder einfach Hallo sagen willst — antworte einfach
        auf diese Email. Wir freuen uns!
      </p>
      <div class="signature">
        Markus & Aljona<br />
        <span style="font-weight:400;color:#6b7280">Eilers+Friends</span>
      </div>
    </div>
    <div class="footer">
      &copy; ${year} Eilers+Friends &middot; <a href="https://eilersfriends.com/datenschutz" style="color:#9ca3af">Datenschutz</a>
    </div>
  </div>
</body>
</html>`
}
