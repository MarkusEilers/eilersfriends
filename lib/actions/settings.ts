'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { setSetting } from '@/lib/db/queries/settings'

const ALLOWED_KEYS = new Set([
  'calendly.markus',
  'calendly.aljona',
])

export async function updateSettingAction(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }
  const key = String(formData.get('key') || '')
  const value = String(formData.get('value') || '').trim()
  if (!ALLOWED_KEYS.has(key)) {
    throw new Error(`unknown setting key: ${key}`)
  }
  if (value && !value.startsWith('https://')) {
    throw new Error('Calendly-URLs müssen mit https:// beginnen.')
  }
  await setSetting(key, value)
  revalidatePath('/admin/settings')
  revalidatePath('/kontakt')
  revalidatePath('/de/kontakt')
}
