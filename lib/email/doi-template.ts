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

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bitte bestätige deine Anmeldung</title>
  <style>
    body { margin: 0; padding: 0; background: #FAFAF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; }
    .header { background: #0A0D14; padding: 32px 40px; text-align: center; }
    .logo { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .logo span { color: #F05A1A; }
    .body { padding: 40px 40px 32px; }
    .body h1 { margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0D0D0B; line-height: 1.3; }
    .body p { margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #4b5563; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #F05A1A; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
    .divider { border: none; border-top: 1px solid #f3f4f6; margin: 32px 0; }
    .small { font-size: 13px; color: #9ca3af; line-height: 1.6; }
    .small a { color: #9ca3af; }
    .footer { background: #f9fafb; padding: 24px 40px; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Eilers<span>+</span>Friends</div>
    </div>
    <div class="body">
      <h1>Bitte bestätige deine Email-Adresse</h1>
      <p>${greeting}</p>
      <p>
        Schön, dass du dabei bist! Ein Klick, und du bist offiziell an Bord.
        Klick auf den Button unten, um deine Email-Adresse zu bestätigen und
        deinen Platz zu sichern.
      </p>
      <div class="btn-wrap">
        <a href="${confirmUrl}" class="btn">Ja, ich bestätige meine Anmeldung →</a>
      </div>
      <hr class="divider" />
      <p class="small">
        Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br />
        <a href="${confirmUrl}">${confirmUrl}</a>
      </p>
      <p class="small">
        Du hast dich nicht angemeldet? Dann ignoriere diese Email einfach —
        du wirst nicht in unsere Liste aufgenommen.
      </p>
    </div>
    <div class="footer">
      &copy; ${year} Eilers+Friends &middot; <a href="https://eilersfriends.com/datenschutz" style="color:#9ca3af">Datenschutz</a>
    </div>
  </div>
</body>
</html>`
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
