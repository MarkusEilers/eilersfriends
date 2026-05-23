'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { updateCardMeta, type CardMeta, type Deliverable } from '@/lib/db/queries/framework-meta'

const ALLOWED_ICONS: Deliverable['icon'][] = ['FileDown', 'Video', 'ClipboardList', 'Wand2', 'BookOpen', 'Sparkles']

export type SaveFrameworkMetaState =
  | { ok: true; savedAt: string }
  | { ok: false; error: string }
  | null

/**
 * Server action — kompatibel mit useActionState.
 * Erste Variante (Wrapper): (_prev, formData) → SaveFrameworkMetaState
 * Direkte Form-action ist nicht mehr empfohlen — bitte über FrameworkMetaForm wrappen.
 */
export async function saveFrameworkMetaAction(
  _prev: SaveFrameworkMetaState,
  formData: FormData,
): Promise<SaveFrameworkMetaState> {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
      return { ok: false, error: 'Nicht eingeloggt oder fehlende Berechtigung.' }
    }

    const slug = String(formData.get('slug') || '').trim()
    if (!slug) return { ok: false, error: 'slug fehlt im Formular.' }

    const posterTitle = String(formData.get('posterTitle') || '').trim()
    const posterSubtitle = String(formData.get('posterSubtitle') || '').trim()
    const tagline = String(formData.get('tagline') || '').trim()
    const agentLabel = String(formData.get('agentLabel') || '').trim()

    const toneFrom = String(formData.get('toneFrom') || '#0F1E3A').trim()
    const toneTo = String(formData.get('toneTo') || '#1A5FD4').trim()
    const toneAccent = String(formData.get('toneAccent') || '#5DDBF5').trim()

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

    return { ok: true, savedAt: new Date().toISOString() }
  } catch (err) {
    console.error('[saveFrameworkMetaAction] failed', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unbekannter Fehler beim Speichern.',
    }
  }
}
