import { Resend } from 'resend'
import { sendMailAs } from '@/lib/schedule/graph'

export const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  fromName?: string
  fromEmail?: string
}

/**
 * Sendet eine Email via Resend.
 * fromEmail muss eine verifizierte Domain bei Resend haben.
 */
/**
 * Seit 21.10.2026: Mails mit Absender @eilersfriends.com gehen zuerst über
 * Microsoft 365 (Graph, Postfach der verbundenen Person, Standard: markus),
 * weil eilersfriends.com bei Resend nicht bestätigt ist. Resend bleibt der
 * Ersatz — und der Weg für alle anderen Absender (z. B. Celero-Webcast).
 * Abschalten: MAIL_VIA_GRAPH=off.
 */
const GRAPH_SLUG = process.env.MAIL_VIA_GRAPH_SLUG || 'markus'

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = 'Eilers+Friends',
  fromEmail = 'hallo@eilersfriends.com',
}: SendEmailOptions) {
  if (process.env.MAIL_VIA_GRAPH !== 'off' && /@eilersfriends\.com$/i.test(fromEmail)) {
    const g = await sendMailAs(GRAPH_SLUG, to, subject, html).catch((e: unknown) => ({ ok: false, error: String(e) }))
    if (g.ok) return { id: 'graph', via: 'graph' as const }
    console.error('[mail] Graph failed, trying Resend:', g.error)
  }
  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html,
    text: text ?? undefined,
  })

  if (error) {
    console.error('Resend error:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }

  return data
}

/**
 * Ersetzt Template-Variablen im Format {{variableName}} durch die übergebenen Werte.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '')
}
