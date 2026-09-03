import { NextResponse } from 'next/server'
import { moderate } from '@/lib/blog/comments'
import { verifyToken } from '@/lib/blog/notify'

export const runtime = 'nodejs'

/**
 * Die Freigabe aus der Mail.
 *
 * Nur POST — ein Aufruf per GET waere von jedem Virenscanner ausloesbar, der die
 * Nachricht oeffnet. Die Seite dazu zeigt den Kommentar und hat genau einen Knopf.
 */
export async function POST(req: Request) {
  const { id, action, token } = (await req.json().catch(() => ({}))) ?? {}
  if (!id || !action || !token) return NextResponse.json({ error: 'unvollstaendig' }, { status: 400 })
  if (!['freigeben', 'ablehnen'].includes(action)) {
    return NextResponse.json({ error: 'unbekannte Aktion' }, { status: 400 })
  }
  if (!verifyToken(id, action, token)) {
    return NextResponse.json({ error: 'Dieser Link gilt nicht mehr' }, { status: 403 })
  }
  await moderate(id, action === 'freigeben' ? 'freigegeben' : 'abgelehnt')
  return NextResponse.json({ ok: true, status: action === 'freigeben' ? 'freigegeben' : 'abgelehnt' })
}
