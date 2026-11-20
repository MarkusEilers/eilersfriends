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

    // Wave 9 — Event-Emit für CRM/Newsletter/Community-Sync
    try {
      const { emitAsync } = await import('@/lib/events/emit')
      emitAsync({
        category: 'subscriber',
        type: 'subscriber.confirmed',
        payload: {
          email: subscriber.email,
          firstName: subscriber.firstName ?? null,
          source: subscriber.source ?? null,
          subscriberId: subscriber.id,
        },
        source: 'newsletter-api',
        idempotencyKey: `subscriber.confirmed:${subscriber.id}`,
      })
    } catch { /* non-fatal */ }

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

    // 4b. Auto-enroll user in framework wizard if source maps to one
    try {
      const SOURCE_TO_FRAMEWORK: Record<string, string> = {
        'framework-b2b-angebote': 'b2b-angebote',
        'b2b-angebote': 'b2b-angebote',
      }
      const fwSlug = subscriber.source ? SOURCE_TO_FRAMEWORK[subscriber.source] : null
      if (fwSlug) {
        const { ensureWizardTables } = await import('@/lib/db/self-heal')
        const { sql: dsql } = await import('drizzle-orm')
        await ensureWizardTables()
        // Look up an existing user with the same email, or create one
        function rowsOf<T>(r: unknown): T[] {
          if (Array.isArray(r)) return r as T[]
          if (r && typeof r === 'object' && 'rows' in r) {
            const x = (r as { rows: unknown }).rows
            if (Array.isArray(x)) return x as T[]
          }
          return []
        }
        const userRowsRes = await db.execute(dsql`
          SELECT id FROM users WHERE email = ${subscriber.email} LIMIT 1
        `)
        const userRows = rowsOf<{ id: string }>(userRowsRes)
        let userId: string | null = userRows[0]?.id ?? null
        if (!userId) {
          const createdRes = await db.execute(dsql`
            INSERT INTO users (email, full_name, role, email_verified)
            VALUES (${subscriber.email}, ${subscriber.firstName ?? subscriber.email}, 'participant', now())
            ON CONFLICT (email) DO UPDATE SET email_verified = now()
            RETURNING id
          `)
          const created = rowsOf<{ id: string }>(createdRes)
          userId = created[0]?.id ?? null
        }
        if (userId) {
          await db.execute(dsql`
            INSERT INTO user_framework_state (user_id, framework_slug, current_step, progress, status)
            VALUES (${userId}, ${fwSlug}, 0, 0, 'active')
            ON CONFLICT (user_id, framework_slug) DO NOTHING
          `)
        }
      }
    } catch (enrollErr) {
      console.error('[doi/confirm] framework auto-enroll failed:', enrollErr)
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
    //    Plus: Framework-spezifisches Auto-Enrollment — wenn der Subscriber via
    //    Framework-Download kam, wird er zusätzlich in die zum Framework gehörende
    //    Sequenz aufgenommen (trigger_filter.framework_slug === subscriber.source).
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

      const sourceSlug = subscriber.source ?? null
      for (const sequence of activeSequences) {
        // Filter: wenn trigger_filter.framework_slug gesetzt ist, MUSS er matchen
        const filter = (sequence.triggerFilter ?? {}) as { framework_slug?: string; source?: string }
        const requiresFramework = typeof filter.framework_slug === 'string' && filter.framework_slug.length > 0
        const requiresSource = typeof filter.source === 'string' && filter.source.length > 0
        if (requiresFramework && filter.framework_slug !== sourceSlug) continue
        if (requiresSource && filter.source !== sourceSlug) continue

        await db.insert(emailSequenceEnrollments).values({
          subscriberId: subscriber.id,
          sequenceId: sequence.id,
          currentStep: 0,
          status: 'active',
          nextSendAt: new Date(), // Schritt 0 kann sofort starten
        }).onConflictDoNothing()
      }
    } catch (e) {
      console.error('[doi/confirm] sequence enrollment failed', e)
    }

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

  void year
  return `<p style="margin:0 0 18px">${greeting}</p>
<p style="margin:0 0 18px">Deine E-Mail-Adresse ist bestätigt. Willkommen in unserer Community für Gründerinnen, Gründer und Führungskräfte, die Vertrieb planbar machen wollen.</p>
<p style="margin:0 0 18px">In den nächsten Tagen bekommst Du von uns Einblicke zu planbaren Umsätzen, Teamführung und Wachstum, das trägt.</p>
<p style="margin:0 0 18px">Du hast eine Frage oder willst einfach Hallo sagen? Antworte auf diese Mail. Wir lesen jede.</p>
<p style="margin:28px 0 0">Markus und Aljona<br><span style="color:#605D5D">Eilers+Friends</span></p>`
}
