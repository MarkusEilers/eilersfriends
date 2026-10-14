import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'

/**
 * „Ansehen als" — Qualitätssicherung für Eilers+Friends.
 *
 * Admins und Coaches sehen den Kundenbereich einer Firma so, wie ihn ein
 * Team oder eine bestimmte Person sieht. Die Vorschau ist reine Ansicht:
 * Rechte und Filter wie beim Kunden, aber Abhaken und Vorschläge sind
 * gesperrt, damit niemand versehentlich im Namen des Kunden handelt.
 * Gilt nur, solange der Cookie gesetzt ist und die Sitzung admin/coach ist.
 */

export const VIEW_AS_COOKIE = 'ef_view_as'
export interface ViewAs { companyId: string; userId?: string; teamKey?: string; label?: string }

export async function getViewAs(): Promise<ViewAs | null> {
  const s = await auth()
  if (s?.user?.role !== 'admin' && s?.user?.role !== 'coach') return null
  const raw = (await cookies()).get(VIEW_AS_COOKIE)?.value
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as ViewAs
    return v && typeof v.companyId === 'string' ? v : null
  } catch { return null }
}
