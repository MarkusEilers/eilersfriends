'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('Unauthorized')
  }
  return session
}

interface SaveTemplateInput {
  id?: string
  type: 'doi_confirmation' | 'doi_welcome' | 'sequence_step' | 'transactional'
  name: string
  locale: string
  subject: string
  bodyHtml: string
  bodyText?: string
  fromName?: string
  fromEmail?: string
  isDefault: boolean
}

export async function saveEmailTemplate(input: SaveTemplateInput) {
  await requireAdmin()

  const values = {
    type: input.type,
    name: input.name,
    locale: input.locale,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText || null,
    fromName: input.fromName || 'Eilers+Friends',
    fromEmail: input.fromEmail || 'hallo@eilersfriends.com',
    isDefault: input.isDefault,
    updatedAt: new Date(),
  }

  if (input.id) {
    await db.update(emailTemplates).set(values).where(eq(emailTemplates.id, input.id))
  } else {
    await db.insert(emailTemplates).values({ ...values, variables: [] })
  }

  revalidatePath('/admin/email-templates')
}

export async function deleteEmailTemplate(id: string) {
  await requireAdmin()
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id))
  revalidatePath('/admin/email-templates')
}
