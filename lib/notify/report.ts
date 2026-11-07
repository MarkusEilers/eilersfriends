import { sendEmail } from '@/lib/email/resend'

/** Kurze System-Nachricht an Markus (Übersetzungs-Check, Link-Check). */
export async function sendReport(subject: string, html: string) {
  const to = process.env.REPORT_EMAIL || 'markus@eilers.at'
  return sendEmail({ to, subject, html: `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.55;color:#0D0D0B">${html}<p style="color:#888;font-size:12px;margin-top:24px">Automatische Nachricht der Website · Admin → Page-Tree</p></div>` }).catch((e) => { console.error('[report]', e); return null })
}
