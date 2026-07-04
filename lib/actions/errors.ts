'use server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { clearErrors } from '@/lib/errors/store'

export async function clearErrorsAction() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) throw new Error('unauthorized')
  await clearErrors()
  revalidatePath('/admin/errors')
}
