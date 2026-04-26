import { Resend } from 'resend'

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
export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = 'Eilers+Friends',
  fromEmail = 'hallo@eilersfriends.com',
}: SendEmailOptions) {
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
