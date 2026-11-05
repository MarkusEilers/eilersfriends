'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { setQuarterConfig } from '@/lib/mystery-shopping/slots'

export async function saveMysteryQuarterAction(formData: FormData) {
  const s = await auth()
  if (s?.user?.role !== 'admin') throw new Error('unauthorized')
  const quarter = String(formData.get('quarter') ?? '')
  if (!/^\d{4}-Q[1-4]$/.test(quarter)) throw new Error('Quartal ungültig')
  const capacity = Math.max(1, Math.min(200, Math.floor(Number(formData.get('capacity')) || 16)))
  const offset = Math.max(0, Math.min(capacity, Math.floor(Number(formData.get('offset')) || 0)))
  await setQuarterConfig(quarter, capacity, offset)
  revalidatePath('/admin/mystery-shopping')
}
