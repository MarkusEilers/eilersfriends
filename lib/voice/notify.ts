import { PERSONS } from '@/lib/schedule/config'

function teamEmail(slug: string): string { return PERSONS.find(p => p.slug === slug)?.email || 'team@eilersfriends.com' }
function teamName(slug: string): string { return PERSONS.find(p => p.slug === slug)?.name || slug }
function esc(s: string) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)) }

export type NotifyInput = { person: string; dw?: number; callerName?: string; callerPhone?: string; callerEmail?: string; callerId?: string; transcript?: string; whenISO?: string }

// Schickt der Zielperson eine E-Mail mit Anrufversuch-Details (Resend). Absender via Env konfigurierbar.
export async function sendTeamNotification(o: NotifyInput): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { sent: false, error: 'no_resend' }
  const to = teamEmail(o.person)
  const from = process.env.VOICE_NOTIFY_FROM || 'Eilers+Friends Telefon <anruf@celero-workforce.com>'
  const when = o.whenISO ? new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'full', timeStyle: 'short' }).format(new Date(o.whenISO)) : ''
  const html = `<div style="font-family:Arial,sans-serif;color:#0D0D0B;max-width:640px">
    <h2>Anrufversuch für ${esc(teamName(o.person))}</h2>
    <p><b>Anrufer:</b> ${esc(o.callerName || '—')}<br>
    <b>Rückrufnummer:</b> ${esc(o.callerPhone || '—')}${o.callerEmail ? `<br><b>E-Mail:</b> ${esc(o.callerEmail)}` : ''}${o.callerId ? `<br><b>Aufgezeichnete Rufnummer:</b> ${esc(o.callerId)}` : ''}<br>
    ${when ? `<b>Uhrzeit:</b> ${esc(when)}<br>` : ''}${o.dw != null ? `<b>Durchwahl:</b> ${o.dw}` : ''}</p>
    ${o.transcript ? `<p><b>Transkript:</b></p><pre style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:8px;font-family:Arial,sans-serif;font-size:13px">${esc(o.transcript)}</pre>` : ''}
    <p style="color:#888;font-size:12px">Automatisch über die Telefon-Assistentin von eilersfriends.com.</p>
  </div>`
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: o.callerEmail || undefined, subject: `Anrufversuch: ${o.callerName || 'Anrufer'}${o.callerPhone ? ' · ' + o.callerPhone : ''}`, html }),
    })
    if (!r.ok) { const t = await r.text(); return { sent: false, error: t.slice(0, 200) } }
    return { sent: true }
  } catch (e) { return { sent: false, error: String(e) } }
}
