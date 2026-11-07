'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { setTranslationMode, type TranslateMode } from '@/lib/pagetree/settings'
import { translateStale } from '@/lib/lp/translate'
import { logPageChange } from '@/lib/pagetree/log'
import { runLinkCheck } from '@/lib/links/check'

async function requireAdmin() {
  const s = await auth()
  if (!s?.user || (s.user.role !== 'admin' && s.user.role !== 'coach')) throw new Error('unauthorized')
}

export async function setTranslationModeAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('pageId') || '')
  const mode = String(formData.get('mode') || 'check') as TranslateMode
  if (!id || !['off', 'check', 'auto'].includes(mode)) return
  await setTranslationMode(`lp:${id}`, mode)
  revalidatePath('/admin/pagetree')
}

/** Fehlende und veraltete Sektionen dieser Seite jetzt nach EN und ES übersetzen. */
export async function translateNowAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('pageId') || '')
  if (!id) return
  const r = await translateStale(id, ['en', 'es'])
  if (r.translated) await logPageChange('lp', id, `KI-Übersetzung EN/ES (${r.translated} Sektionen)`)
  revalidatePath('/admin/pagetree')
}

export async function runLinkCheckAction() {
  await requireAdmin()
  await runLinkCheck()
  revalidatePath('/admin/pagetree')
}
