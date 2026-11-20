import { mailButton } from '@/lib/email/layout'

/**
 * Standard DOI-Bestätigungsmail (wird als Fallback genutzt wenn kein DB-Template vorhanden)
 * Variablen: {{firstName}}, {{confirmUrl}}, {{year}}
 */
export function getDefaultDoiHtml(variables: {
  firstName: string
  confirmUrl: string
  year: string
}): string {
  const { firstName, confirmUrl, year } = variables
  const greeting = firstName ? `Hey ${firstName},` : 'Hey,'

  void year
  return `<p style="margin:0 0 18px">${greeting}</p>
<p style="margin:0 0 18px">schön, dass Du dabei bist. Ein Klick noch, dann bist Du an Bord: Bitte bestätige Deine E-Mail-Adresse.</p>
${mailButton(confirmUrl, 'Ja, ich bestätige meine Anmeldung')}
<p style="margin:0 0 18px;font-size:13px;color:#605D5D">Falls der Knopf nicht funktioniert, kopiere diesen Link in Deinen Browser:<br><a href="${confirmUrl}" style="color:#605D5D">${confirmUrl}</a></p>
<p style="margin:0 0 18px;font-size:13px;color:#605D5D">Du hast Dich nicht angemeldet? Dann ignoriere diese Mail einfach, Du wirst nicht in unsere Liste aufgenommen.</p>
<p style="margin:28px 0 0">Markus Eilers<br><span style="color:#605D5D">Eilers+Friends</span></p>`
}

export function getDefaultDoiText(variables: {
  firstName: string
  confirmUrl: string
}): string {
  const greeting = variables.firstName ? `Hey ${variables.firstName},` : 'Hey,'
  return `${greeting}

Bitte bestätige deine Anmeldung bei Eilers+Friends.

Klick auf diesen Link, um deine Email-Adresse zu bestätigen:
${variables.confirmUrl}

Falls du dich nicht angemeldet hast, ignoriere diese Email einfach.

– Dein Eilers+Friends Team`
}

export const DEFAULT_DOI_SUBJECT = 'Bitte bestätige deine Anmeldung ✉️'
