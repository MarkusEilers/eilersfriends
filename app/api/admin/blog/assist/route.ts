import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { assist, type AssistKind } from '@/lib/blog/assist'

export const runtime = 'nodejs'
export const maxDuration = 120

const KINDS: AssistKind[] = ['kuerzen', 'auszug', 'untertitel', 'schlagworte', 'voice', 'bildprompt', 'uebersetzen']

/** Die Helfer. Sie liefern Vorschlaege zurueck und aendern nichts am Beitrag. */
export async function POST(req: Request) {
  const s = await auth()
  if (s?.user?.role !== 'admin' && s?.user?.role !== 'coach') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  if (!KINDS.includes(body?.kind)) {
    return NextResponse.json({ error: `kind muss eines sein von: ${KINDS.join(', ')}` }, { status: 400 })
  }
  try {
    return NextResponse.json({ ok: true, kind: body.kind, result: await assist(body.kind, body) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
