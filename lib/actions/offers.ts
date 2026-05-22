'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createOffer } from '@/lib/db/queries/offers'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }
  return session
}

export async function createOfferAction(formData: FormData) {
  await requireAdmin()
  const customerName = String(formData.get('customerName') || '').trim()
  const customerCompany = String(formData.get('customerCompany') || '').trim() || null
  const customerEmail = String(formData.get('customerEmail') || '').trim() || null
  const title = String(formData.get('title') || '').trim()
  const subtitle = String(formData.get('subtitle') || '').trim() || null
  const tagline = String(formData.get('tagline') || '').trim() || null

  if (!customerName) throw new Error('customerName required')
  if (!title) throw new Error('title required')

  const offer = await createOffer({ customerName, customerCompany, customerEmail, title, subtitle, tagline })
  revalidatePath('/admin/offers')
  redirect(`/admin/offers/${offer.id}`)
}
