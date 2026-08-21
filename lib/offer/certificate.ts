import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { AuditRow } from './audit'

/**
 * Abschluss-Dokument im Stil einer „Certificate of Completion":
 * Seite 1 fasst das Angebot zusammen, Seite 2 listet die Beweiskette —
 * je Unterschrift Name, E-Mail, Zeitpunkt, IP und Prüfsumme.
 */

const NAVY = rgb(0.059, 0.118, 0.227)
const GREY = rgb(0.42, 0.45, 0.5)
const LINE = rgb(0.88, 0.9, 0.93)

/** pdf-lib-Standardschriften können nur WinAnsi — alles andere ersetzen. */
function safe(t: string): string {
  return (t ?? '')
    .replace(/[‘’‚]/g, "'").replace(/[“”„]/g, '"')
    .replace(/[–—]/g, '-').replace(/…/g, '...').replace(/ /g, ' ')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\xFF]/g, '?')
}

export async function buildCertificatePdf(input: {
  offerNumber: string
  title: string
  customer: string
  signers: { name: string; email: string; signedAt?: string | null; ip?: string | null; hash?: string | null }[]
  audit: AuditRow[]
  chainHead?: string
  amountLabel?: string
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const mono = await pdf.embedFont(StandardFonts.Courier)

  const A4: [number, number] = [595.28, 841.89]
  const M = 56

  // ── Seite 1 — Zusammenfassung ──────────────────────────────────────────
  let page = pdf.addPage(A4)
  let y = A4[1] - M

  page.drawText('EILERS FRIENDS', { x: M, y, size: 11, font: bold, color: NAVY })
  y -= 34
  page.drawText(safe('Angenommenes Angebot'), { x: M, y, size: 22, font: bold, color: NAVY })
  y -= 26
  page.drawText(safe(input.title).slice(0, 78), { x: M, y, size: 12, font, color: GREY })
  y -= 30
  page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 1, color: LINE })
  y -= 26

  const rows: [string, string][] = [
    ['Angebotsnummer', input.offerNumber],
    ['Kunde', input.customer],
    ['Unterzeichner', input.signers.map((s) => s.name).join(', ')],
    ['Angenommen am', new Date().toLocaleString('de-DE')],
  ]
  if (input.amountLabel) rows.push(['Investition', input.amountLabel])
  for (const [k, v] of rows) {
    page.drawText(safe(k), { x: M, y, size: 9, font: bold, color: GREY })
    page.drawText(safe(v).slice(0, 62), { x: M + 130, y, size: 10, font, color: NAVY })
    y -= 20
  }

  y -= 14
  page.drawText(safe('Unterschriften'), { x: M, y, size: 13, font: bold, color: NAVY })
  y -= 20
  for (const s of input.signers) {
    page.drawRectangle({ x: M, y: y - 52, width: A4[0] - 2 * M, height: 62, color: rgb(0.976, 0.98, 1) })
    page.drawText(safe(s.name), { x: M + 12, y: y - 4, size: 11, font: bold, color: NAVY })
    page.drawText(safe(s.email), { x: M + 12, y: y - 19, size: 9, font, color: GREY })
    const when = s.signedAt ? new Date(s.signedAt).toLocaleString('de-DE') : '-'
    page.drawText(safe(`Unterschrieben: ${when}   IP: ${s.ip ?? '-'}`), { x: M + 12, y: y - 33, size: 8, font, color: GREY })
    if (s.hash) page.drawText(safe(`Pruefsumme: ${s.hash}`), { x: M + 12, y: y - 46, size: 7, font: mono, color: GREY })
    y -= 74
    if (y < 120) { page = pdf.addPage(A4); y = A4[1] - M }
  }

  // ── Seite 2 — Beweiskette ──────────────────────────────────────────────
  page = pdf.addPage(A4)
  y = A4[1] - M
  page.drawText(safe('Beweiskette'), { x: M, y, size: 18, font: bold, color: NAVY })
  y -= 20
  page.drawText(safe('Jeder Eintrag ist per SHA-256 mit seinem Vorgaenger verkettet. Eine nachtraegliche'), { x: M, y, size: 8.5, font, color: GREY })
  y -= 12
  page.drawText(safe('Aenderung bricht alle folgenden Pruefsummen und ist damit erkennbar.'), { x: M, y, size: 8.5, font, color: GREY })
  y -= 22
  page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 1, color: LINE })
  y -= 18

  const LABEL: Record<string, string> = {
    invited: 'Link versendet', opened: 'Angebot geoeffnet', submitted: 'Unterschrift abgeschickt',
    signed: 'Unterschrift bestaetigt', finalized: 'Angebot angenommen',
  }
  for (const a of input.audit) {
    if (y < 90) { page = pdf.addPage(A4); y = A4[1] - M }
    page.drawText(safe(`#${a.seq}`), { x: M, y, size: 8, font: bold, color: GREY })
    page.drawText(safe(LABEL[a.event] ?? a.event), { x: M + 26, y, size: 9.5, font: bold, color: NAVY })
    page.drawText(safe(new Date(a.occurred_at).toLocaleString('de-DE')), { x: A4[0] - M - 118, y, size: 8, font, color: GREY })
    y -= 12
    const who = [a.actor_name, a.actor_email].filter(Boolean).join(' · ')
    if (who) { page.drawText(safe(who).slice(0, 80), { x: M + 26, y, size: 8, font, color: GREY }); y -= 11 }
    page.drawText(safe(`IP ${a.ip ?? '-'}`), { x: M + 26, y, size: 8, font, color: GREY }); y -= 11
    page.drawText(safe(a.entry_hash), { x: M + 26, y, size: 6.5, font: mono, color: GREY }); y -= 16
  }

  if (input.chainHead) {
    if (y < 70) { page = pdf.addPage(A4); y = A4[1] - M }
    y -= 6
    page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 1, color: LINE })
    y -= 16
    page.drawText(safe('Kopf der Kette'), { x: M, y, size: 9, font: bold, color: NAVY }); y -= 12
    page.drawText(safe(input.chainHead), { x: M, y, size: 7, font: mono, color: GREY })
  }

  const last = pdf.getPage(pdf.getPageCount() - 1)
  last.drawText(safe('Einfache elektronische Signatur mit Beweiskette (kein qualifiziertes Zertifikat nach eIDAS).'),
    { x: M, y: 44, size: 7, font, color: GREY })

  return pdf.save()
}
