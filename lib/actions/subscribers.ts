'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }
}

export async function setSubscriberStatus(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  const status = formData.get('status') as
    | 'pending' | 'active' | 'unsubscribed' | 'bounced'
  if (!id || !status) return
  await db
    .update(newsletterSubscribers)
    .set({ status, updatedAt: new Date() })
    .where(eq(newsletterSubscribers.id, id))
  revalidatePath('/admin/subscribers')
}

export async function deleteSubscriber(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  if (!id) return
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id))
  revalidatePath('/admin/subscribers')
}
