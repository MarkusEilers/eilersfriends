import { sendEmail } from '@/lib/email/resend'
import { sendReport } from '@/lib/notify/report'
import { SITE } from '@/lib/seo/site'
import type { AskFunnelDef, Lang } from './types'
import type { Submission } from './store'
import { reportToken } from './tokens'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export const confirmUrl = (id: string) => `${SITE}/api/ask/confirm?t=${encodeURIComponent(reportToken(id))}`

const COPY: Record<Lang, { subject: (t: string) => string; hello: (n: string | null) => string; body: string; button: string; small: string }> = {
  de: {
    subject: (t) => `Euer Report: ${t}`,
    hello: (n) => (n ? `Hallo ${n},` : 'Hallo,'),
    body: 'Euer voller Report ist fertig: alle neun Stufen mit Werten, Eure Engpässe in der Reihenfolge, in der Ihr sie angehen solltet, und unsere Empfehlung. Ein Klick bestätigt Eure Adresse und öffnet den Report.',
    button: 'Adresse bestätigen und Report öffnen',
    small: 'Ihr habt das nicht angefordert? Dann ignoriert diese Mail einfach, es passiert nichts weiter.',
  },
  en: {
    subject: (t) => `Your report: ${t}`,
    hello: (n) => (n ? `Hi ${n},` : 'Hi,'),
    body: 'Your full report is ready: all nine stages with scores, your bottlenecks in the order to tackle them, and our recommendation. One click confirms your address and opens the report.',
    button: 'Confirm address and open report',
    small: "Didn't request this? Just ignore this email, nothing else will happen.",
  },
  es: {
    subject: (t) => `Vuestro informe: ${t}`,
    hello: (n) => (n ? `Hola ${n}:` : 'Hola:'),
    body: 'Vuestro informe completo está listo: las nueve etapas con puntuación, vuestros cuellos de botella en el orden en que conviene abordarlos y nuestra recomendación. Un clic confirma vuestra dirección y abre el informe.',
    button: 'Confirmar dirección y abrir informe',
    small: '¿No lo habéis solicitado? Ignorad este correo, no pasará nada más.',
  },
}

/** Double-Opt-In: der Bestätigungslink ist zugleich der Report-Link. Awaited, sonst friert Vercel die Mail ein. */
export async function sendDoiMail(def: AskFunnelDef, id: string, lang: Lang, email: string, firstName: string | null) {
  const c = COPY[lang], url = confirmUrl(id)
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0D0D0B;max-width:560px">
<p>${esc(c.hello(firstName))}</p><p>${esc(c.body)}</p>
<p style="margin:28px 0"><a href="${url}" style="background:#1A5FD4;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;display:inline-block">${esc(c.button)}</a></p>
<p style="font-size:13px;color:#605D5D">${esc(url)}</p>
<p>Markus Eilers<br><span style="color:#605D5D">Eilers+Friends</span></p>
<p style="font-size:12px;color:#888">${esc(c.small)}</p></div>`
  await sendEmail({ to: email, subject: c.subject(def.title[lang]), html, text: `${c.hello(firstName)}\n\n${c.body}\n\n${url}\n\nMarkus Eilers` })
}

/** Kurze Nachricht an Markus, sobald jemand bestätigt hat. */
export async function notifyLead(def: AskFunnelDef, s: Submission) {
  const r = s.result, st = (k: string | null) => (k ? def.stages.find((x) => x.key === k)?.name.de ?? k : '–')
  const c = s.contact
  const ampel = r.stages.map((x) => `${x.status === 'red' ? '🔴' : x.status === 'yellow' ? '🟡' : '🟢'} ${esc(st(x.key))} ${x.score}`).join('<br>')
  await sendReport(`Neuer Lead aus ${def.kicker.de}: ${c?.company ?? ''}`, `
${s.brand.logo ? `<p><img src="${s.brand.logo}" alt="" style="max-height:48px;max-width:180px"></p>` : ''}<p><b>${esc(c?.company ?? '')}</b> · ${esc(c?.email ?? '')}${c?.phone ? ` · ${esc(c.phone)}` : ''}${c?.firstName ? ` · ${esc(c.firstName)}` : ''}</p>
<p>Engpass Nr. 1: <b>${esc(st(r.first))}</b> · rote Stufen: ${r.redCount} · Empfehlung: ${esc(def.ctas[r.cta]?.title.de ?? r.cta)}</p>
<p>${ampel}</p>
<p><a href="${SITE}/admin/ask">Alle Teilnahmen im Admin</a> · <a href="${SITE}/de/check/${def.slug}/report/${reportToken(s.id)}">Report ansehen</a></p>`)
}
