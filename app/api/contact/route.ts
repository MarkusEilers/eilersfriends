import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email/resend'

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  company: z.string().max(200).optional().or(z.literal('')),
  subject: z.string().max(200).optional().or(z.literal('')),
  message: z.string().min(10).max(5000),
})

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = ContactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bitte alle Pflichtfelder korrekt ausfüllen.' },
        { status: 400 },
      )
    }

    const { name, email, company, subject, message } = parsed.data
    const subj = subject?.trim() || `Neue Kontaktanfrage von ${name}`

    const html = `
      <h2>Neue Kontaktanfrage über eilersfriends.com</h2>
      <table cellpadding="6" style="font-family:system-ui,-apple-system,sans-serif;font-size:14px">
        <tr><td><strong>Name:</strong></td><td>${escape(name)}</td></tr>
        <tr><td><strong>Email:</strong></td><td><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
        ${company ? `<tr><td><strong>Unternehmen:</strong></td><td>${escape(company)}</td></tr>` : ''}
        ${subject ? `<tr><td><strong>Betreff:</strong></td><td>${escape(subject)}</td></tr>` : ''}
      </table>
      <h3>Nachricht</h3>
      <div style="white-space:pre-wrap;border-left:3px solid #F05A1A;padding-left:12px;font-family:system-ui,sans-serif;font-size:14px">
        ${escape(message)}
      </div>
    `.trim()

    const text = [
      `Neue Kontaktanfrage über eilersfriends.com`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Unternehmen: ${company}` : null,
      subject ? `Betreff: ${subject}` : null,
      ``,
      `Nachricht:`,
      message,
    ].filter(Boolean).join('\n')

    await sendEmail({
      to: 'team@eilersfriends.com',
      subject: subj,
      html,
      text,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] send failed', err)
    return NextResponse.json(
      { error: 'Senden fehlgeschlagen. Bitte später erneut versuchen.' },
      { status: 500 },
    )
  }
}
