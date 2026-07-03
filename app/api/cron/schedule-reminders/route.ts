import { NextRequest, NextResponse } from 'next/server'
import { dueBookingsForReminders, markReminderSent } from '@/lib/schedule/bookings-store'
import { sendMailAs } from '@/lib/schedule/graph'
import { entityFor } from '@/lib/schedule/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eilersfriends.com'
const TZ = 'Europe/Berlin'
function fullWhen(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const now = Date.now()
  let sent = 0, skipped = 0, failed = 0
  const due = await dueBookingsForReminders()
  for (const b of due) {
    const startMs = new Date(b.startUtc).getTime()
    for (const rem of (b.reminders || [])) {
      const h = Number(rem.hoursBefore)
      if (!h || b.remindersSent.includes(h)) continue
      const fireAt = startMs - h * 3600e3
      if (now < fireAt || now >= startMs) continue // noch nicht fällig / schon vorbei
      const ent = entityFor(b.ownerSlug)
      const manageUrl = `${SITE}/termin/${b.manageToken}`
      const html = `<div style="font-family:Arial,sans-serif;color:#0D0D0B">
        <p>Hallo ${b.customerName},</p>
        <p>kurze Erinnerung an Deinen Termin${ent ? ` mit ${ent.name}` : ''}:</p>
        <p style="font-size:16px;font-weight:700">${fullWhen(b.startUtc)} Uhr</p>
        ${b.joinUrl ? `<p><a href="${b.joinUrl}" style="background:#1A5FD4;color:#fff;text-decoration:none;padding:10px 18px;border-radius:9999px;font-weight:700;display:inline-block">Teams-Meeting öffnen</a></p>` : ''}
        <p>Musst Du verschieben oder absagen? <a href="${manageUrl}">Hier verwalten</a>.</p>
        <p>Bis gleich!<br>Eilers+Friends</p>
      </div>`
      const r = await sendMailAs(b.ownerSlug, b.customerEmail, `Erinnerung: Dein Termin ${fullWhen(b.startUtc)} Uhr`, html)
      if (r.ok) { await markReminderSent(b.id, h); sent++ }
      else if (r.error && /Mail\.Send|scope|AADSTS/i.test(r.error)) { skipped++ } // Scope fehlt (Host neu verbinden)
      else { failed++ }
    }
  }
  return NextResponse.json({ ok: true, sent, skipped, failed, checked: due.length })
}
