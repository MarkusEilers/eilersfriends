import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  emailSequenceEnrollments,
  emailSequenceSteps,
  emailSequences,
  emailTemplates,
  newsletterSubscribers,
} from '@/lib/db/schema'
import { eq, and, lte, isNotNull } from 'drizzle-orm'
import { sendEmail, renderTemplate } from '@/lib/email/resend'

export async function GET(request: NextRequest) {
  // Vercel Cron absichern
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let processed = 0
  let errors = 0

  try {
    // Alle fälligen Enrollments holen (nextSendAt <= jetzt, status aktiv)
    const dueEnrollments = await db
      .select()
      .from(emailSequenceEnrollments)
      .where(
        and(
          eq(emailSequenceEnrollments.status, 'active'),
          isNotNull(emailSequenceEnrollments.nextSendAt),
          lte(emailSequenceEnrollments.nextSendAt, now)
        )
      )
      .limit(50) // Batch-Größe

    for (const enrollment of dueEnrollments) {
      try {
        // Nächsten Schritt der Sequenz holen
        const steps = await db
          .select()
          .from(emailSequenceSteps)
          .where(
            and(
              eq(emailSequenceSteps.sequenceId, enrollment.sequenceId),
              eq(emailSequenceSteps.isActive, true)
            )
          )
          .orderBy(emailSequenceSteps.order)

        const currentStepData = steps[enrollment.currentStep]

        if (!currentStepData) {
          // Keine weiteren Schritte → Sequenz abgeschlossen
          await db.update(emailSequenceEnrollments).set({
            status: 'completed',
            completedAt: now,
          }).where(eq(emailSequenceEnrollments.id, enrollment.id))
          continue
        }

        // Subscriber-Daten laden
        const subscribers = await db
          .select()
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.id, enrollment.subscriberId))
          .limit(1)

        const subscriber = subscribers[0]
        if (!subscriber || subscriber.status === 'unsubscribed') {
          await db.update(emailSequenceEnrollments).set({ status: 'unsubscribed' })
            .where(eq(emailSequenceEnrollments.id, enrollment.id))
          continue
        }

        // Template laden
        const templates = await db
          .select()
          .from(emailTemplates)
          .where(eq(emailTemplates.id, currentStepData.templateId))
          .limit(1)

        const template = templates[0]
        if (!template) continue

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://eilersfriends.com'
        const variables = {
          firstName: subscriber.firstName ?? '',
          email: subscriber.email,
          year: now.getFullYear().toString(),
          loginUrl: `${baseUrl}/auth/login`,
          confirmUrl: `${baseUrl}/api/newsletter/confirm?token=${subscriber.doiToken ?? ''}`,
        }

        // Email senden
        await sendEmail({
          to: subscriber.email,
          subject: renderTemplate(template.subject, variables),
          html: renderTemplate(template.bodyHtml, variables),
          text: template.bodyText ? renderTemplate(template.bodyText, variables) : undefined,
          fromName: template.fromName ?? 'Eilers+Friends',
          fromEmail: template.fromEmail ?? 'hallo@eilersfriends.com',
        })

        // Nächsten Schritt berechnen
        const nextStep = enrollment.currentStep + 1
        const nextStepData = steps[nextStep]

        if (nextStepData) {
          // Nächsten Send-Zeitpunkt berechnen
          const nextSendAt = new Date(now.getTime() + nextStepData.delayHours * 60 * 60 * 1000)
          await db.update(emailSequenceEnrollments).set({
            currentStep: nextStep,
            lastSentAt: now,
            nextSendAt,
          }).where(eq(emailSequenceEnrollments.id, enrollment.id))
        } else {
          // Letzter Schritt gesendet → abgeschlossen
          await db.update(emailSequenceEnrollments).set({
            currentStep: nextStep,
            lastSentAt: now,
            nextSendAt: null,
            status: 'completed',
            completedAt: now,
          }).where(eq(emailSequenceEnrollments.id, enrollment.id))
        }

        processed++
      } catch (err) {
        console.error(`Sequence enrollment ${enrollment.id} error:`, err)
        errors++
      }
    }
  } catch (err) {
    console.error('Cron sequences error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ processed, errors, timestamp: now.toISOString() })
}
