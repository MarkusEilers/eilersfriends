/**
 * Ein Layout für alle Mails von Eilers+Friends: weiß, ruhig, wie ein Brief.
 * Keine Kästen, keine farbigen Kopfzeilen. Unten das Logo, Termin, Datenschutz, Impressum.
 */

export type MailLang = 'de' | 'en' | 'es'
const SITE = 'https://www.eilersfriends.com'
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif"

const FOOT: Record<MailLang, { book: string; privacy: string; imprint: string }> = {
  de: { book: 'Termin vereinbaren', privacy: 'Datenschutz', imprint: 'Impressum' },
  en: { book: 'Book a call', privacy: 'Privacy', imprint: 'Imprint' },
  es: { book: 'Reservar una llamada', privacy: 'Privacidad', imprint: 'Aviso legal' },
}

const pre = (l: MailLang) => (l === 'de' ? '' : `/${l}`)

/** Ist das schon ein komplettes HTML-Dokument? Dann nicht noch einmal einwickeln. */
export const isFullDocument = (html: string) => /<html[\s>]|<!doctype/i.test(html)

/** Knopf im Stil der Website, aber schlicht: blau, abgerundet, mailtauglich. */
export function mailButton(url: string, label: string) {
  return `<p style="margin:28px 0"><a href="${url}" style="display:inline-block;background:#1A5FD4;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 24px;border-radius:999px;font-family:${FONT}">${label}</a></p>`
}

export function emailLayout(inner: string, opts: { lang?: MailLang; preheader?: string } = {}) {
  const lang = opts.lang ?? 'de'
  const f = FOOT[lang]
  const link = (href: string, label: string) => `<a href="${SITE}${href}" style="color:#605D5D;text-decoration:underline">${label}</a>`
  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title></title></head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff"><tr><td align="center" style="padding:36px 20px 28px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px"><tr><td align="left" style="font-family:${FONT};font-size:16px;line-height:1.6;color:#201E1D">
${inner}
</td></tr>
<tr><td align="left" style="padding-top:40px">
<div style="border-top:1px solid #E6E3E1;font-size:0;line-height:0">&nbsp;</div>
<a href="${SITE}${pre(lang) || '/'}"><img src="${SITE}/ef-logo.png" width="112" alt="Eilers+Friends" style="display:block;border:0;width:112px;height:auto;margin:22px 0 12px"></a>
<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.7;color:#605D5D">${link(`${pre(lang)}/schedule`, f.book)} &nbsp;·&nbsp; ${link(`${pre(lang)}/datenschutz`, f.privacy)} &nbsp;·&nbsp; ${link(`${pre(lang)}/impressum`, f.imprint)}</p>
</td></tr></table>
</td></tr></table>
</body></html>`
}
