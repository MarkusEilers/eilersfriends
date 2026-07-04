'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { upsertEventType, deleteEventType, upsertHostProfile, type Question, type Reminder, type Visibility } from '@/lib/schedule/types-store'
import { setExtraCalendarActive, removeExtraCalendar } from '@/lib/schedule/store'
import { entityFor } from '@/lib/schedule/config'

async function guard() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) throw new Error('unauthorized')
}
function slugify(s: string) { return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) }

export type EventTypePayload = {
  id?: string; ownerSlug: string; slug?: string; name: string; description?: string; durationMin: number
  bufferBeforeMin: number; bufferAfterMin: number; maxPerDay: number | null; visibility: Visibility
  infoText?: string; questions: Question[]; reminders: Reminder[]; sort?: number
}

export async function saveEventTypeAction(p: EventTypePayload) {
  await guard()
  if (!entityFor(p.ownerSlug)) throw new Error('bad_owner')
  const name = (p.name || '').trim()
  if (!name) throw new Error('name_required')
  const slug = (p.slug && p.slug.trim()) ? slugify(p.slug) : slugify(name)
  const questions = (p.questions || []).filter(q => q.label?.trim()).map((q, i) => ({
    id: q.id && /^[a-z0-9-]+$/.test(q.id) ? q.id : `q${i + 1}`,
    label: q.label.trim(), type: (['text', 'textarea', 'select'].includes(q.type) ? q.type : 'text') as Question['type'],
    options: q.type === 'select' ? (q.options || []).map(o => o.trim()).filter(Boolean) : undefined,
    required: !!q.required,
  }))
  const reminders = (p.reminders || []).map(r => ({ hoursBefore: Math.max(0, Math.round(Number(r.hoursBefore) || 0)) })).filter(r => r.hoursBefore > 0)
  await upsertEventType({
    id: p.id, ownerSlug: p.ownerSlug, slug, name, description: (p.description || '').trim(),
    durationMin: Math.max(5, Math.round(p.durationMin || 30)),
    bufferBeforeMin: Math.max(0, Math.round(p.bufferBeforeMin || 0)), bufferAfterMin: Math.max(0, Math.round(p.bufferAfterMin || 0)),
    maxPerDay: p.maxPerDay == null || Number.isNaN(p.maxPerDay) ? null : Math.max(1, Math.round(p.maxPerDay)),
    visibility: (['live', 'internal', 'offline'].includes(p.visibility) ? p.visibility : 'live') as Visibility,
    infoText: (p.infoText || '').trim(), questions, reminders, sort: Math.round(p.sort || 0),
  })
  revalidatePath('/admin/schedule')
  revalidatePath(`/schedule/${p.ownerSlug}`)
}

export async function deleteEventTypeAction(id: string) {
  await guard()
  await deleteEventType(id)
  revalidatePath('/admin/schedule')
}

export async function saveHostProfileAction(slug: string, avatarUrl: string, intro: string) {
  await guard()
  await upsertHostProfile(slug, (avatarUrl || '').trim(), (intro || '').trim())
  revalidatePath('/admin/schedule')
}


export async function toggleCalendarAction(formData: FormData) {
  await guard()
  const id = String(formData.get('id') || '')
  const active = formData.get('active') === '1'
  if (id) await setExtraCalendarActive(id, active)
  revalidatePath('/admin/schedule')
}

export async function removeCalendarAction(formData: FormData) {
  await guard()
  const id = String(formData.get('id') || '')
  if (id) await removeExtraCalendar(id)
  revalidatePath('/admin/schedule')
}
