import { NextResponse } from 'next/server'
import { buildPageTree } from '@/lib/pagetree/tree'
import { translateStale } from '@/lib/lp/translate'
import { logPageChange } from '@/lib/pagetree/log'
import { sendReport } from '@/lib/notify/report'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Wöchentlicher Übersetzungs-Check (Montag früh).
 * Landingpages auf „automatisch“: fehlende/veraltete Sektionen werden übersetzt.
 * Landingpages auf „prüfen“ und Code-Seiten: was fehlt oder veraltet ist, kommt in die Nachricht.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { nodes } = await buildPageTree()
  const done: string[] = [], open: string[] = []
  for (const n of nodes) {
    if (n.area !== 'public') continue
    const gaps = (['en', 'es'] as const).filter((l) => ['partial', 'missing', 'stale'].includes(n.langs[l].state))
    if (!gaps.length) continue
    const label = (l: 'en' | 'es') => {
      const s = n.langs[l]
      return `${l.toUpperCase()}: ${s.state === 'stale' ? `${s.stale} Sektion(en) veraltet` : s.state === 'missing' ? 'fehlt' : `${s.pct ?? 0} %`}`
    }
    if (n.kind === 'lp' && n.pageId) {
      if (n.mode === 'off') continue
      if (n.mode === 'auto') {
        const r = await translateStale(n.pageId, [...gaps]).catch(() => ({ translated: 0, failed: 1 }))
        if (r.translated) await logPageChange('lp', n.pageId, `Wöchentliche KI-Übersetzung (${r.translated} Sektionen)`)
        done.push(`<li><b>${n.path}</b> — ${r.translated} Sektion(en) übersetzt${r.failed ? `, ${r.failed} fehlgeschlagen` : ''}</li>`)
        continue
      }
      open.push(`<li><b>${n.path}</b> — ${gaps.map(label).join(' · ')}</li>`)
    } else if (n.kind === 'code' && (n.status ?? 'published') === 'published') {
      open.push(`<li><b>${n.path}</b> (Code) — ${gaps.map(label).join(' · ')}</li>`)
    }
  }
  if (done.length || open.length) {
    await sendReport('Website: Übersetzungs-Check der Woche', `
      <p>Kurzer Stand der Übersetzungen (EN/ES).</p>
      ${done.length ? `<p><b>Automatisch übersetzt</b></p><ul>${done.join('')}</ul>` : ''}
      ${open.length ? `<p><b>Offen — bitte prüfen oder im Page-Tree „Jetzt übersetzen“ klicken</b></p><ul>${open.join('')}</ul>` : ''}
      <p><a href="https://www.eilersfriends.com/admin/pagetree">Zum Page-Tree</a></p>`)
  }
  return NextResponse.json({ ok: true, translated: done.length, open: open.length })
}
