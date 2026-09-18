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
  /**
   * Das Ausgangsmaterial. Ist es da, wird geprueft, ob Zitate und Zahlen darin
   * vorkommen — die einzige Pruefung, die Erfindung ueberhaupt fassen kann.
   */
  material?: string | null
}

const PERSONIFIED = /\b(die|der|das)\s+(Zahl|Zahlen|Markt|Märkte|Daten|Studie|Technologie|KI|Software)\s+(sagt|sagen|fordert|fordern|spricht|sprechen|verlangt|will|weiß|meint)\b/gi
const HONESTY = /\b(ganz ehrlich|klartext|ohne bullshit|die ehrliche (rechnung|bandbreite)|ich sag'?s wie es ist|mal ehrlich)\b/gi
const HYPE = /\b(game.?changer|revolutionär|bahnbrechend|explosive? (ergebnisse|wachstum)|auf steroiden|absolut einzigartig)\b/gi
const EMPTY = /\b(der (kunde|mensch) im mittelpunkt|innovation und qualität|gemeinsam in die zukunft|ganzheitliche lösung)\b/gi

const around = (text: string, i: number, len = 70) =>
  text.slice(Math.max(0, i - 25), Math.min(text.length, i + len)).replace(/\s+/g, ' ').trim()

/** Zeichen-Dreiergruppen — faengt Wiederholungen, die kein Wort teilen. */
function trigrams(s: string): Map<string, number> {
  const t = ` ${s.toLowerCase().replace(/[^a-zà-ÿ0-9äöüß ]/gi, ' ').replace(/\s+/g, ' ').trim()} `
  const m = new Map<string, number>()
  for (let i = 0; i <= t.length - 3; i++) {
    const k = t.slice(i, i + 3)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

function similarity(a: string, b: string): number {
  const ga = trigrams(a), gb = trigrams(b)
  let inter = 0, sa = 0, sb = 0
  for (const [k, v] of ga) { sa += v; if (gb.has(k)) inter += Math.min(v, gb.get(k) as number) }
  for (const [, v] of gb) sb += v
  return sa + sb === 0 ? 0 : (2 * inter) / (sa + sb)
}

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
    // Formal richtig und in der Wirkung daneben: die Ansprache taucht erst am
    // Ende auf, davor redet der Text nur ueber sich selbst.
    const re = want === 'du' ? /\b(du|dich|dir|dein)/i : want === 'ihr' ? /\b(ihr|euch|eure|euer)/i : /\bSie\b/
    const first = text.search(re)
    if (first > 0 && first / text.length > 0.55) {
      push({
        rule: 'Ansprache kommt spät', severity: 'warnung',
        quote: `erst nach ${Math.round((first / text.length) * 100)} % des Textes`,
        hint: 'Bis dahin redet der Text über sich. Den Leser früher adressieren.',
      })
    }
  }

  /**
   * „aber" als Konjunktion.
   *
   * Steht in der Verbotsliste an erster Stelle, weil es den eigenen Satz
   * aushebelt. Am Satzanfang oder nach einem Komma ist es die Konjunktion; in
   * „aber auch" oder als Adverb mitten im Satz kann es stehen bleiben.
   */
  {
    const re = /(^|[.!?]\s+|,\s*)(aber)\b/gim
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      push({
        rule: '„aber" als Konjunktion', severity: 'fehler',
        quote: around(text, m.index), position: m.index,
        hint: 'Hebelt den eigenen Satz aus. Ersatz: ein Punkt, oder eine neue Beobachtung.',
      })
    }
  }

  /**
   * Erfindung.
   *
   * Der einzige Fehler, den ein Modell ueber den eigenen Text nie findet — es
   * hat den Satz ja gerade geschrieben und haelt ihn fuer richtig. Ein Zitat,
   * das im Material nicht steht, ist erfunden. Eine Zahl, die dort nicht steht,
   * auch. Beides faellt keiner Stilregel auf und traegt am weitesten.
   */
  if (input.material) {
    const hay = input.material.toLowerCase().replace(/\s+/g, ' ')

    const quotes = text.match(/[„“"”»]([^„“"”»]{12,220})[„“"”«]/g) ?? []
    for (const raw of quotes) {
      const inner = raw.replace(/^[„“"”»]|[„“"”«]$/g, '').trim()
      const probe = inner.slice(0, 40).toLowerCase().replace(/\s+/g, ' ')
      if (!hay.includes(probe)) {
        push({
          rule: 'Zitat nicht im Material', severity: 'fehler',
          quote: inner.slice(0, 90),
          hint: 'So steht es nirgends. Entweder belegen oder als eigene Formulierung ohne Anführung schreiben.',
        })
      }
    }

    const nums = new Set((text.match(/\b\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?\b/g) ?? []))
    const bare = hay.replace(/[.\s]/g, '')
    for (const n of nums) {
      const clean = n.replace(/[.\s]/g, '')
      if (clean.length < 2) continue
      if (['2024', '2025', '2026', '2027'].includes(clean)) continue
      if (!bare.includes(clean)) {
        push({
          rule: 'Zahl nicht im Material', severity: 'fehler', quote: n,
          hint: 'Diese Zahl steht nicht im Ausgangsmaterial. Streichen oder als Rechenbeispiel kenntlich machen.',
        })
      }
    }
  }

  /**
   * Zwischenueberschriften.
   *
   * Nach der Ueberschrift ueberfliegt der Leser als Erstes alle
   * Zwischenueberschriften — sie sind der zweite Text im Text. Ein Etikett wie
   * „Ursache 2: Wissen und Koennen" sagt, was kommt. „Er steht also jetzt
   * morgens um vier da" laesst weiterlesen. Der Doppelpunkt ist fast immer das
   * Zeichen, dass es ein Etikett geworden ist.
   */
  {
    const heads = (text.match(/^#{2,3}\s+(.+)$/gm) ?? []).map((h) => h.replace(/^#+\s+/, '').trim())
    const etiketten = heads.filter((h) => /:/.test(h) && h.split(':')[0].split(/\s+/).length <= 4)
    if (etiketten.length >= 2) {
      push({
        rule: 'Überschriften als Etikett', severity: 'warnung',
        quote: etiketten.slice(0, 3).join(' · '),
        hint: 'Sagt, was kommt, statt weiterlesen zu lassen. Der Doppelpunkt ist meist das Zeichen.',
      })
    }
    const nummeriert = heads.filter((h) => /^(teil|kapitel|schritt|ursache|punkt)\s*\d|^\d+[.)]/i.test(h))
    if (nummeriert.length >= 2) {
      push({
        rule: 'Überschriften durchnummeriert', severity: 'hinweis',
        quote: nummeriert.slice(0, 3).join(' · '),
        hint: 'Eine Nummer baut keine Spannung. Was macht diesen Abschnitt lesenswert?',
      })
    }
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 1)

  /**
   * Wiederholung.
   *
   * Der haeufigste Fehler nach der Revision: derselbe Gedanke steht zweimal
   * hintereinander, einmal als Satz und einmal als Variante davon. Ein Modell
   * sieht das nicht, weil es beim zweiten Mal denselben Gedanken hatte.
   */
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < Math.min(sentences.length, i + 5); j++) {
      const a = sentences[i].trim(), b = sentences[j].trim()
      if (a.split(/\s+/).length < 5 || b.split(/\s+/).length < 5) continue
      if (similarity(a, b) >= 0.62) {
        push({
          rule: 'Wiederholung', severity: 'fehler',
          quote: `${a.slice(0, 60)}… / ${b.slice(0, 60)}…`,
          hint: 'Derselbe Gedanke zweimal. Einen streichen, den anderen schaerfen.',
        })
        break
      }
    }
  }
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
