import { NextResponse } from 'next/server'
import { sweep } from '@/lib/agents/drive'

export const runtime = 'nodejs'
export const maxDuration = 300

/** Sicherheitsnetz, kein Motor: einmal taeglich das aufheben, was liegen blieb. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, aufgeraeumt: await sweep() })
}
