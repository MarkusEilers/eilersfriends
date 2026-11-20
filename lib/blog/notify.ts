import { createHmac, timingSafeEqual } from 'crypto'
import { AUTHORS, type Author } from './authors'

/**
 * Benachrichtigung und Freigabe aus der Mail.
 *
 * Der Knopf in der Mail fuehrt nicht direkt auf die Aktion, sondern auf eine
 * Seite mit genau einem Knopf. Das ist kein Umweg aus Vorsicht: Mailprogramme
 * und Virenscanner rufen Links in Nachrichten von sich aus auf. Waere die
 * Freigabe ein einfacher Aufruf, wuerde der erste Scanner jeden Kommentar
 * freischalten, den er sieht.
 */

const secret = () => process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'ef-blog'

export function signToken(commentId: string, action: string): string {
  return createHmac('sha256', secret()).update(`${commentId}:${action}`).digest('hex').slice(0, 40)
}

export function verifyToken(commentId: string, action: string, token: string): boolean {
  const expected = Buffer.from(signToken(commentId, action))
  const got = Buffer.from(token ?? '')
  return expected.length === got.length && timingSafeEqual(expected, got)
}

export const MODERATION_RECIPIENTS = ['markus@eilers.at', 'aljona@eilers.at']

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function moderationMail(input: {
  author: Author
  postTitle: string; postSlug: string
  commentId: string
  name: string; email: string; body: string
  score: number; flags: Array<{ rule: string; kind: string }>
  baseUrl: string
}) {
  const link = (action: 'freigeben' | 'ablehnen') =>
    `${input.baseUrl}/blog/moderation?c=${input.commentId}&a=${action}&t=${signToken(input.commentId, action)}`

  const flagList = input.flags.length
    ? `<ul style="margin:8px 0 0;padding-left:18px;color:#B45309;font-size:13px">${
        input.flags.map((f) => `<li>${esc(f.rule)} <span style="color:#9CA3AF">(${esc(f.kind)})</span></li>`).join('')
      }</ul>`
    : '<p style="margin:8px 0 0;color:#6B7280;font-size:13px">Keine Regel hat angeschlagen — zurueckgehalten wegen der Summe.</p>'

  const html = `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#605D5D">Kommentar wartet</p>
<p style="margin:0 0 20px;font-size:20px;font-weight:bold">${esc(input.postTitle)}</p>
<p style="margin:0 0 10px;font-size:14px;color:#605D5D"><strong style="color:#201E1D">${esc(input.name)}</strong> &lt;${esc(input.email)}&gt;</p>
<p style="margin:0 0 20px;padding-left:14px;border-left:3px solid ${input.author.accent};white-space:pre-wrap">${esc(input.body.slice(0, 1200))}</p>
<p style="margin:0;font-size:14px"><strong>Verdachtswert ${input.score} von 100</strong></p>
${flagList}
<p style="margin:26px 0 10px"><a href="${link('freigeben')}" style="display:inline-block;background:${input.author.accent};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:bold">Freigeben</a>
<a href="${link('ablehnen')}" style="display:inline-block;margin-left:8px;color:#605D5D;text-decoration:underline;padding:12px 8px;font-size:14px">Ablehnen</a></p>
<p style="margin:0 0 14px;font-size:12px;color:#605D5D">Der Knopf öffnet eine Seite mit einer letzten Bestätigung. Sonst würde der erste Virenscanner, der diese Mail liest, den Kommentar freischalten.</p>
<p style="margin:0;font-size:13px;color:#605D5D"><a href="${input.baseUrl}/admin/blog/kommentare" style="color:#605D5D">Alle wartenden Kommentare</a> · <a href="${input.baseUrl}/blog/${input.postSlug}" style="color:#605D5D">Beitrag ansehen</a></p>`

  return { subject: `Kommentar wartet: ${input.postTitle}`, html }
}

export function authorFor(slug?: string | null): Author {
  return AUTHORS[(slug ?? '') as Author['slug']] ?? AUTHORS.markus
}
