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

  const html = `<!DOCTYPE html><html lang="de"><body style="margin:0;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
    <div style="background:${input.author.deep};padding:22px 28px">
      <div style="color:rgba(255,255,255,.6);font-size:11px;letter-spacing:.16em;text-transform:uppercase">Kommentar wartet</div>
      <div style="color:#fff;font-size:17px;font-weight:700;margin-top:4px">${esc(input.postTitle)}</div>
    </div>
    <div style="padding:26px 28px">
      <div style="font-size:13px;color:#6B7280">
        <strong style="color:#111827">${esc(input.name)}</strong> &lt;${esc(input.email)}&gt;
      </div>
      <div style="margin-top:12px;padding:14px 16px;background:#F9FAFB;border-left:3px solid ${input.author.accent};border-radius:0 8px 8px 0;font-size:15px;line-height:1.6;color:#374151;white-space:pre-wrap">${esc(input.body.slice(0, 1200))}</div>

      <div style="margin-top:18px;padding:12px 14px;background:#FFFBEB;border-radius:8px">
        <div style="font-size:12px;font-weight:700;color:#92400E">Verdachtswert ${input.score} von 100</div>
        ${flagList}
      </div>

      <div style="margin-top:24px">
        <a href="${link('freigeben')}" style="display:inline-block;background:${input.author.accent};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:700">Freigeben</a>
        <a href="${link('ablehnen')}" style="display:inline-block;margin-left:8px;border:1px solid #E5E7EB;color:#6B7280;text-decoration:none;padding:11px 20px;border-radius:999px;font-size:14px;font-weight:600">Ablehnen</a>
      </div>
      <p style="margin-top:14px;font-size:12px;color:#9CA3AF">
        Der Knopf oeffnet eine Seite mit einer letzten Bestaetigung — sonst wuerde der erste Virenscanner,
        der diese Mail liest, den Kommentar freischalten.
      </p>
      <p style="margin-top:18px;font-size:12px;color:#9CA3AF">
        <a href="${input.baseUrl}/admin/blog/kommentare" style="color:#6B7280">Alle wartenden Kommentare</a> ·
        <a href="${input.baseUrl}/blog/${input.postSlug}" style="color:#6B7280">Beitrag ansehen</a>
      </p>
    </div>
  </div></body></html>`

  return { subject: `Kommentar wartet: ${input.postTitle}`, html }
}

export function authorFor(slug?: string | null): Author {
  return AUTHORS[(slug ?? '') as Author['slug']] ?? AUTHORS.markus
}
