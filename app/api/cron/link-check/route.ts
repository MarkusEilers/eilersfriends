import { NextResponse } from 'next/server'
import { runLinkCheck } from '@/lib/links/check'
import { sendReport } from '@/lib/notify/report'

export const runtime = 'nodejs'
export const maxDuration = 300

/** Nächtlicher Link-Check: kaputte externe Links ausblenden, reparierte wieder einblenden, Markus kurz informieren. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const r = await runLinkCheck()
  const li = (x: Record<string, unknown>) => `<li><a href="${x.url}">${x.url}</a> — auf ${((x.pages as string[]) ?? []).join(', ')}${x.detail ? ` <span style="color:#888">(${x.detail})</span>` : ''}</li>`
  if (r.newlyHidden.length || r.restored.length) {
    await sendReport(`Website: ${r.newlyHidden.length} Link(s) ausgeblendet${r.restored.length ? `, ${r.restored.length} wieder da` : ''}`, `
      ${r.newlyHidden.length ? `<p><b>Nicht erreichbar — auf der Website ausgeblendet</b> (bitte Link korrigieren oder dem Anbieter Bescheid geben):</p><ul>${r.newlyHidden.map(li).join('')}</ul>` : ''}
      ${r.restored.length ? `<p><b>Wieder erreichbar — wieder eingeblendet:</b></p><ul>${r.restored.map(li).join('')}</ul>` : ''}
      <p>Geprüft: ${r.checked} externe Links auf ${r.pages} Seiten.</p>`)
  }
  return NextResponse.json({ ok: true, checked: r.checked, hidden: r.stillHidden.length, newlyHidden: r.newlyHidden.length, restored: r.restored.length })
}
