import { NextRequest, NextResponse } from 'next/server'
import { freeSlots, createBooking } from '@/lib/schedule/graph'
import { typeBySlug, membersFor, entityFor } from '@/lib/schedule/config'
import { sendEmail } from '@/lib/email/resend'

export const runtime = 'nodejs'

function fmt(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const person = String(body.person || ''); const type = String(body.type || '')
  const slot = String(body.slot || ''); const name = String(body.name || '').slice(0, 120)
  const email = String(body.email || '').slice(0, 160); const note = String(body.note || '').slice(0, 2000)
  const t = typeBySlug(type); const ent = entityFor(person)
  if (!t || !ent || membersFor(person).length === 0 || !slot || !name || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: 'bad_params' }, { status: 400 })
  }
  // Re-validate slot is still free
  const { slots, connected } = await freeSlots(person, t.durationMin)
  if (!connected) return NextResponse.json({ error: 'not_connected' }, { status: 503 })
  if (!slots.includes(slot)) return NextResponse.json({ error: 'slot_taken' }, { status: 409 })

  const r = await createBooking(person, slot, t.durationMin, name, email, note)
  if (!r.ok) return NextResponse.json({ error: r.error || 'failed' }, { status: 502 })

  const end = new Date(new Date(slot).getTime() + t.durationMin * 60000).toISOString()
  const title = `${t.name} mit ${ent.name}`
  const when = fmt(slot)

  // Bestätigungsmail an den Bucher (best effort — Buchung gilt auch ohne Mail, MS-Einladung geht separat)
  try {
    const joinLine = r.joinUrl ? `<p style="margin:16px 0"><a href="${r.joinUrl}" style="background:#1A5FD4;color:#fff;text-decoration:none;padding:10px 18px;border-radius:9999px;font-weight:700;display:inline-block">Microsoft-Teams-Meeting öffnen</a></p>` : ''
    await sendEmail({
      to: email,
      subject: `Bestätigt: ${title} · ${when} Uhr`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#0D0D0B;max-width:520px">
        <p>Hallo ${name},</p>
        <p>Dein Termin steht:</p>
        <p style="font-size:16px;font-weight:700">${title}<br>${when} Uhr · ${t.durationMin} Minuten</p>
        ${joinLine}
        ${note ? `<p style="color:#555"><b>Dein Anliegen:</b><br>${note.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>` : ''}
        <p>Du bekommst zusätzlich eine Kalender-Einladung von Microsoft. Falls etwas dazwischenkommt, antworte einfach auf diese Mail.</p>
        <p>Bis bald!<br>Eilers+Friends</p>
      </div>`,
      text: `Hallo ${name},\n\nDein Termin steht:\n${title}\n${when} Uhr · ${t.durationMin} Minuten\n${r.joinUrl ? '\nTeams-Link: ' + r.joinUrl + '\n' : ''}\nDu bekommst zusätzlich eine Kalender-Einladung von Microsoft.\n\nBis bald!\nEilers+Friends`,
    })
  } catch { /* Mailversand darf die Buchung nicht scheitern lassen */ }

  return NextResponse.json({ ok: true, start: slot, end, joinUrl: r.joinUrl || null, title })
}
