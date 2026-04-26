'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailSequences, emailSequenceSteps } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('Unauthorized')
  }
}

interface Step {
  id?: string
  templateId: string
  order: number
  delayHours: number
  isActive: boolean
}

interface SaveSequenceInput {
  id?: string
  name: string
  description: string
  trigger: string
  isActive: boolean
  locale: string
  steps: Step[]
}

export async function saveEmailSequence(input: SaveSequenceInput) {
  await requireAdmin()

  let sequenceId = input.id

  const values = {
    name: input.name,
    description: input.description || null,
    trigger: input.trigger as typeof emailSequences.$inferSelect['trigger'],
    isActive: input.isActive,
    locale: input.locale,
    updatedAt: new Date(),
  }

  if (sequenceId) {
    await db.update(emailSequences).set(values).where(eq(emailSequences.id, sequenceId))
    // Schritte neu anlegen: alte löschen, neue einfügen
    await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.sequenceId, sequenceId))
  } else {
    const inserted = await db.insert(emailSequences).values({ ...values, triggerFilter: {} }).returning({ id: emailSequences.id })
    sequenceId = inserted[0].id
  }

  // Schritte speichern
  if (input.steps.length > 0 && sequenceId) {
    await db.insert(emailSequenceSteps).values(
      input.steps.map((step) => ({
        sequenceId: sequenceId!,
        templateId: step.templateId,
        order: step.order,
        delayHours: step.delayHours,
        isActive: step.isActive,
      }))
    )
  }

  revalidatePath('/admin/email-sequences')
}

export async function deleteEmailSequence(id: string) {
  await requireAdmin()
  await db.delete(emailSequences).where(eq(emailSequences.id, id))
  revalidatePath('/admin/email-sequences')
}
