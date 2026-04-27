'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { programs, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }
  return session.user
}

export async function createProgram() {
  const user = await requireAdmin()
  // Resolve coachId — fallback to current user
  const [coach] = await db.select().from(users).where(eq(users.id, user.id as string)).limit(1)
  if (!coach) throw new Error('coach not found')

  const slug = `programm-${Date.now().toString(36)}`
  const [created] = await db
    .insert(programs)
    .values({
      coachId: coach.id,
      name: 'Neues Programm',
      slug,
      type: 'academy',
      ctaType: 'apply',
      status: 'draft',
    })
    .returning()
  redirect(`/admin/programs/${created.id}`)
}

export async function setProgramStatus(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  const status = formData.get('status') as 'draft' | 'published' | 'archived'
  if (!id || !status) return
  await db
    .update(programs)
    .set({ status, updatedAt: new Date() })
    .where(eq(programs.id, id))
  revalidatePath('/admin/programs')
}

export async function deleteProgram(formData: FormData) {
  await requireAdmin()
  const id = formData.get('id') as string
  if (!id) return
  await db.delete(programs).where(eq(programs.id, id))
  revalidatePath('/admin/programs')
}
