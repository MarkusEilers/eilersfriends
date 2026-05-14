'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { updateCardMeta, type CardMeta, type Deliverable } from '@/lib/db/queries/framework-meta'

const ALLOWED_ICONS: Deliverable['icon'][] = ['FileDown', 'Video', 'ClipboardList', 'Wand2', 'BookOpen', 'Sparkles']

export async function saveFrameworkMetaAction(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }

  const slug = String(formData.get('slug') || '').trim()
  if (!slug) throw new Error('slug required')

  const posterTitle = String(formData.get('posterTitle') || '').trim()
  const posterSubtitle = String(formData.get('posterSubtitle') || '').trim()
  const tagline = String(formData.get('tagline') || '').trim()
  const agentLabel = String(formData.get('agentLabel') || '').trim()

  const toneFrom = String(formData.get('toneFrom') || '#0F1E3A').trim()
  const toneTo = String(formData.get('toneTo') || '#1A5FD4').trim()
  const toneAccent = String(formData.get('toneAccent') || '#5DDBF5').trim()

  // Deliverables — 3 fixed rows, each with icon + label
  const deliverables: Deliverable[] = []
  for (let i = 0; i < 5; i++) {
    const icon = String(formData.get(`deliverable_${i}_icon`) || '').trim() as Deliverable['icon']
    const label = String(formData.get(`deliverable_${i}_label`) || '').trim()
    if (label && ALLOWED_ICONS.includes(icon)) {
      deliverables.push({ icon, label })
    }
  }

  const meta: CardMeta = {
    posterTitle: posterTitle || undefined,
    posterSubtitle: posterSubtitle || undefined,
    tagline: tagline || undefined,
    agentLabel: agentLabel || undefined,
    tone: { from: toneFrom, to: toneTo, accent: toneAccent },
    deliverables: deliverables.length > 0 ? deliverables : undefined,
  }

  await updateCardMeta(slug, meta)
  revalidatePath('/')
  revalidatePath('/frameworks')
  revalidatePath(`/frameworks/${slug}`)
  revalidatePath('/admin/frameworks')
  revalidatePath(`/admin/frameworks/${slug}`)
}
