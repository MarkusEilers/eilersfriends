/**
 * Der Linter.
 *
 * Er ist Code und bleibt Code. Ein Modell, das seine eigenen Regeln prueft,
 * findet zuverlaessig nichts — das hat sich beim Beef Radar zweimal gezeigt:
 * die Regel stand im Prompt und wurde trotzdem umgangen, einmal als Liefermenge
 * statt Wirkung, einmal als erfundene Prozentzahl mit Annahme-Klammer.
 *
 * Was hier faellt, faellt ohne Diskussion. Was hier durchgeht, ist deshalb noch
 * nicht gut — dafuer gibt es Menschen.
 */

export type Severity = 'fehler' | 'warnung' | 'hinweis'

export interface Finding {
  rule: string
  severity: Severity
  quote: string
  hint: string
  position?: number
}

export interface LintInput {
  text: string
  banned?: string[]
  /** 'du' | 'ihr' | 'sie' — erzwingt Durchgaengigkeit */
  address?: string | null
  targetWords?: number | null
}

const PERSONIFIED = /\b(die|der|das)\s+(Zahl|Zahlen|Markt|Märkte|Daten|Studie|Technologie|KI|Software)\s+(sagt|sagen|fordert|fordern|spricht|sprechen|verlangt|will|weiß|meint)\b/gi
const HONESTY = /\b(ganz ehrlich|klartext|ohne bullshit|die ehrliche (rechnung|bandbreite)|ich sag'?s wie es ist|mal ehrlich)\b/gi
const HYPE = /\b(game.?changer|revolutionär|bahnbrechend|explosive? (ergebnisse|wachstum)|auf steroiden|absolut einzigartig)\b/gi
const EMPTY = /\b(der (kunde|mensch) im mittelpunkt|innovation und qualität|gemeinsam in die zukunft|ganzheitliche lösung)\b/gi

const around = (text: string, i: number, len = 70) =>
  text.slice(Math.max(0, i - 25), Math.min(text.length, i + len)).replace(/\s+/g, ' ').trim()

export function lint(input: LintInput): { findings: Finding[]; stats: Record<string, number> } {
  const text = input.text ?? ''
  const findings: Finding[] = []
  const push = (f: Finding) => findings.push(f)

  for (const w of input.banned ?? []) {
    if (!w) continue
    const re = new RegExp(`(^|[^a-zà-ÿ])(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([^a-zà-ÿ]|$)`, 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      push({
        rule: 'verbotenes Wort', severity: 'fehler', quote: around(text, m.index),
        hint: `„${w}“ ist gesperrt.`, position: m.index,
      })
      if (findings.length > 60) break
    }
  }

  const scan = (re: RegExp, rule: string, severity: Severity, hint: string) => {
    let m: RegExpExecArray | null
    const r = new RegExp(re.source, re.flags)
    while ((m = r.exec(text))) push({ rule, severity, quote: around(text, m.index), hint, position: m.index })
  }

  scan(PERSONIFIED, 'personifiziertes Abstraktum', 'fehler',
    'Zahlen sagen nichts, Märkte fordern nichts. Nenne, wer handelt.')
  scan(HONESTY, 'Ehrlichkeits-Marker', 'fehler',
    'Der Leser hört: sonst lügt ihr also. Die Beobachtung einfach nennen.')
  scan(HYPE, 'Lautstärke ohne Beleg', 'warnung', 'Belegen oder streichen.')
  scan(EMPTY, 'Floskel ohne mögliches Gegenteil', 'warnung',
    'Wenn niemand widersprechen würde, steht da nichts.')

  const bangs = (text.match(/!/g) ?? []).length
  if (bangs > 0) {
    push({ rule: 'Ausrufezeichen', severity: 'warnung', quote: `${bangs}×`, hint: 'Lautstärke ersetzt kein Argument.' })
  }

  // Ansprache: ein Wechsel mitten im Text ist kein Stil, sondern Unaufmerksamkeit.
  const du = (text.match(/\b(du|dich|dir|dein[eranms]*)\b/gi) ?? []).length
  const ihr = (text.match(/\b(ihr|euch|eure[rnms]*|euer)\b/gi) ?? []).length
  const sie = (text.match(/\bSie\b/g) ?? []).length
  const forms: Array<[string, number]> = [['du', du], ['ihr', ihr], ['sie', sie]]
  const used = forms.filter(([, n]) => n > 2)
  if (used.length > 1) {
    push({
      rule: 'Ansprache wechselt', severity: 'fehler',
      quote: used.map(([f, n]) => `${f}: ${n}`).join(' · '),
      hint: 'Eine Ansprache, durchgehend.',
    })
  }
  if (input.address) {
    const want = input.address.toLowerCase()
    const got = used.sort((a, b) => b[1] - a[1])[0]?.[0]
    if (got && got !== want) {
      push({ rule: 'falsche Ansprache', severity: 'fehler', quote: `${got} statt ${want}`, hint: `Gewünscht war ${want}.` })
    }
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 1)
  const mini = sentences.filter((s) => s.trim().split(/\s+/).length <= 4).length
  if (sentences.length > 8 && mini < 2) {
    push({
      rule: 'kein Rhythmus', severity: 'hinweis', quote: `${mini} kurze Sätze bei ${sentences.length}`,
      hint: 'Ein kurzer Satz nach einem langen trägt weiter als drei mittlere.',
    })
  }

  if (input.targetWords) {
    const off = (words - input.targetWords) / input.targetWords
    if (Math.abs(off) > 0.25) {
      push({
        rule: 'Länge daneben', severity: 'warnung',
        quote: `${words} statt ${input.targetWords} Wörter`,
        hint: off > 0 ? 'Zu lang — kürzen, nicht zusammenfassen.' : 'Zu kurz — ausführen, nicht dehnen.',
      })
    }
  }

  return {
    findings,
    stats: {
      woerter: words, saetze: sentences.length, mini_saetze: mini, ausrufezeichen: bangs,
      fehler: findings.filter((f) => f.severity === 'fehler').length,
      warnungen: findings.filter((f) => f.severity === 'warnung').length,
    },
  }
}

export function lintReport(findings: Finding[]): string {
  if (!findings.length) return 'Keine Befunde.'
  return findings
    .map((f) => `- [${f.severity}] ${f.rule}: „${f.quote}“ — ${f.hint}`)
    .join('\n')
}
