import { VERBOTENE_BEGRIFFE } from './verbote.generated'

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
  /**
   * Der Message-Lock: der eine Satz, der unveraendert und in voller Kraft im
   * Text stehen muss. Er ist der einzige Faenger gegen die Fehlerklasse, die
   * sonst niemand sieht — die Botschaft wird abgeschwaecht oder gedreht, und
   * der Text bleibt dabei tadellos.
   */
  lock?: string | null
  /** linkedin | newsletter | cold-email | thread | carousel | short | reel */
  kanal?: string | null
}

/**
 * Kanal-Grenzen aus der Entscheidungsmatrix.
 *
 * Zaehlbar, also Code. Ein Modell, das man bittet, unter neunzig Woertern zu
 * bleiben, bleibt manchmal darunter; eine Funktion, die zaehlt, immer.
 */
const KANAL_GRENZEN: Record<string, {
  woerter?: [number, number]; einheiten?: [number, number]; einheit?: string; hinweis?: string
}> = {
  'cold-email': { woerter: [40, 90], hinweis: 'Cold-Mail über 90 Wörter wird nicht gelesen. Betreff unter 6 Wörtern.' },
  linkedin: { woerter: [80, 300], hinweis: 'Die ersten drei Zeilen entscheiden. Links gehören in den ersten Kommentar.' },
  newsletter: { woerter: [400, 1200], hinweis: 'Drei Akte, 25/50/25 mit zehn Prozent Spiel.' },
  thread: { einheiten: [8, 12], einheit: 'Tweets', hinweis: 'Der erste Tweet trägt achtzig Prozent.' },
  carousel: { einheiten: [7, 12], einheit: 'Slides', hinweis: 'Eine Idee pro Slide.' },
  short: { woerter: [60, 180], hinweis: 'Unter einer Minute gesprochen.' },
  reel: { woerter: [60, 180] },
}

const PERSONIFIED = /\b(die|der|das)?\s*(Zahl|Zahlen|Markt|Märkte|Daten|Studie|Technologie|KI|Software|Plan|Pläne|Planung|Prozess|Prozesse|System|Systeme|Lücke)\s+(sagt|sagen|fordert|fordern|spricht|sprechen|redet|reden|antwortet|antworten|verlangt|will|wollen|weiß|wissen|meint|meinen|schweigt|schweigen|zurückreden|zurückredet|zurückmeldet|zurückmelden|zurückspricht)\b/gi

/**
 * Eigenlob.
 *
 * Unsere eigenen Sachen — das Rechenblatt, das Werkzeug, das Material — duerfen
 * vorkommen. Sie duerfen nur nicht gelobt werden, bevor der Leser weiss, worum
 * es ueberhaupt geht. Wer im ersten Drittel erklaert, wie praktisch sein Tool
 * ist, hat den Kontext uebersprungen und verkauft in ein Vakuum.
 */
const EIGENES = /\b(Rechenblatt|Rechenhilfe|Werkzeug|Tool|Template|Vorlage|Checkliste|Playbook|unser(e|es)? (Material|Modell|Verfahren|Ansatz))\b/gi
const LOB = /\b(einfach|schnell|praktisch|klar|sofort|kein(e)? [A-Za-zä-ü]+monster|in fünf Minuten|auf einen Blick|ohne Aufwand|gibt dir|macht sichtbar|reicht (schon|aus))\b/i

/**
 * Sichtbares Geruest.
 *
 * Eine Vorlage, die im fertigen Text noch als Vorlage zu erkennen ist. Das
 * klassische Beispiel ist die Warum-jetzt-warum-du-Eroeffnung, die im Profil
 * als Bauanleitung steht und im Text als Aufzaehlung landet.
 */
const GERUEST = /(warum (genau )?jetzt\?[^?]{0,120}warum (du|sie|ihr)\?)|(\bwarum dieses thema\?)|(drei (dinge|punkte), in dieser reihenfolge)|(danach hast du:)/gi
const HONESTY = /\b(ganz ehrlich|klartext|ohne bullshit|die ehrliche (rechnung|bandbreite)|ich sag'?s wie es ist|mal ehrlich)\b/gi
const HYPE = /\b(game.?changer|revolutionär|bahnbrechend|explosive? (ergebnisse|wachstum)|auf steroiden|absolut einzigartig)\b/gi
const EMPTY = /\b(der (kunde|mensch) im mittelpunkt|innovation und qualität|gemeinsam in die zukunft|ganzheitliche lösung)\b/gi

/**
 * Virtue-Signalling.
 *
 * Saetze, die beteuern, dass wir nichts verkaufen wollen. Sie erreichen das
 * Gegenteil: Wer sagt „ohne versteckten Pitch", erinnert den Leser daran, dass
 * ein Pitch moeglich waere. Die Absicht zeigt sich im Verhalten, nicht in der
 * Ankuendigung.
 */
const VIRTUE = /\b(ohne (versteckten |verdeckten )?(pitch|hintergedanken|agenda)|wir (wollen|haben) (auch )?nicht vor,? (Dich|Sie|euch)|nicht überzeugen|kein verkaufsgespräch|kostet (logischerweise |natürlich )?nichts|wir sind (herstellerneutral|unabhängig)|ganz ohne verpflichtung|unverbindlich und kostenlos)\b/gi

/**
 * Unterstellungen.
 *
 * Der Text erklaert dem Leser, was er weiss, fuehlt oder kennt. Manchmal als
 * Schmeichelei („Wer draussen Verantwortung traegt, weiss…"), manchmal als
 * Vertraulichkeit („Du kennst das"). Beides nimmt ihm die Antwort ab, bevor er
 * sie geben konnte.
 */
const PRESUME = /(wer [^.!?]{5,70}[,:]? wei(ß|ss)t?[ ,]|jede(r|n)?,? der [^.!?]{5,60}[,:]? wei(ß|ss)|du kennst das|sie kennen das|wir alle wissen|das kennst du|sicher kennst du|wie du (sicher |vermutlich )?wei(ß|ss)t|du (spürst|merkst|weißt) (das |es )?(längst|selbst|genau))/gi

/**
 * Fake-Contradiction.
 *
 * „nicht X, sondern Y", wo niemand X behauptet hat. Klingt nach Haltung und ist
 * ein Strohmann.
 */
const FAKE_CONTRA = /\b(nicht\s+\w+(?:en|n)?,\s*sondern\s+\w+)/gi

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

  // Die Verbotsliste kommt aus forbidden-words.md und wird erzeugt, nicht
  // getippt (scripts/verbote-generieren.py). Dazu, was ein Mandant zusaetzlich
  // gesperrt hat.
  const verbote: Array<{ wort: string; gruppe: string; kontext?: boolean }> = [
    ...VERBOTENE_BEGRIFFE,
    ...(input.banned ?? []).filter(Boolean).map((w) => ({ wort: w, gruppe: 'eigene Sperre' })),
  ]
  for (const v of verbote) {
    const re = new RegExp(
      `(^|[^a-zà-ÿ])(${v.wort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})([^a-zà-ÿ]|$)`, 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      push({
        rule: v.kontext ? 'Wort nur in einer Lesart erlaubt' : 'verbotenes Wort',
        severity: v.kontext ? 'warnung' : 'fehler',
        quote: around(text, m.index), position: m.index,
        hint: v.kontext
          ? `„${v.wort}“ ist bildlos gesperrt (${v.gruppe}). Wenn es hier woertlich gemeint ist, bleibt es.`
          : `„${v.wort}“ ist gesperrt (${v.gruppe}).`,
      })
      if (findings.length > 80) break
    }
    if (findings.length > 80) break
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
  scan(VIRTUE, 'Virtue-Signalling', 'fehler',
    'Wer beteuert, nichts zu wollen, erinnert an das Gegenteil. Die Absicht zeigt sich im Verhalten.')
  scan(PRESUME, 'Unterstellung', 'fehler',
    'Der Text sagt dem Leser, was er weiß oder fühlt. Das nimmt ihm die Antwort ab. Beobachtung statt Zuschreibung.')
  scan(FAKE_CONTRA, 'Fake-Contradiction', 'warnung',
    'Hat jemand das Gegenteil behauptet? Wenn nein, ist es ein Strohmann.')

  {
    const re = /(^|[^a-zà-ÿ])(Leute)([^a-zà-ÿ]|$)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      push({
        rule: 'Leute', severity: 'warnung', quote: around(text, m.index), position: m.index,
        hint: 'Klingt im geschriebenen Text herablassend. „Menschen" trägt dieselbe Bedeutung ohne den Beiklang.',
      })
    }
  }

  /**
   * Der Schluss.
   *
   * Hier sammeln sich die Klischees, weil der Text zu Ende ist und noch etwas
   * passieren soll. Eine Frage, die niemand beantwortet, ist kein Schluss.
   */
  {
    const last = text.trim().split(/\n{2,}/).slice(-1)[0] ?? ''
    const KLISCHEE = [
      /was würde passieren, wenn/i, /die einladung steht/i, /lass uns (gemeinsam|reden)/i,
      /melde dich (einfach )?(gern|jederzeit)/i, /ich freue mich auf (den austausch|deine nachricht)/i,
      /was denkst du\?/i, /wie siehst du das\?/i, /sprich mich an/i,
    ]
    for (const re of KLISCHEE) {
      const m = re.exec(last)
      if (m) {
        push({
          rule: 'Klischee im Schluss', severity: 'fehler',
          quote: last.slice(Math.max(0, m.index - 20), m.index + 70).trim(),
          hint: 'Eine Frage, die niemand beantwortet, ist kein Schluss. Etwas Konkretes anbieten oder aufhören.',
        })
        break
      }
    }
  }

  /**
   * Der Message-Lock.
   *
   * Nicht auf Zeichengleichheit geprueft — ein Text, der den Satz wortwoertlich
   * einbaut, klingt oft nach Einbau. Geprueft wird, ob die tragenden Woerter
   * des Locks beieinander im Text vorkommen: verschwindet die Haelfte, ist die
   * Botschaft verschwunden, egal wie schoen der Rest ist.
   */
  if (input.lock && input.lock.trim().length > 12) {
    const STOPP = new Set(['und', 'oder', 'der', 'die', 'das', 'ein', 'eine', 'einen', 'dem', 'den',
      'ist', 'sind', 'war', 'wird', 'werden', 'hat', 'haben', 'nicht', 'mit', 'von', 'für', 'auf',
      'als', 'wie', 'dass', 'sich', 'auch', 'nur', 'man', 'sie', 'wir', 'ihr', 'was', 'wer'])
    const kern = input.lock.toLowerCase().split(/[^a-zà-ÿ0-9]+/)
      .filter((w) => w.length > 3 && !STOPP.has(w))
    const hay = text.toLowerCase()
    const drin = kern.filter((w) => hay.includes(w.slice(0, Math.max(4, w.length - 2))))
    const quote = kern.length ? drin.length / kern.length : 1
    if (quote < 0.6) {
      push({
        rule: 'Message-Lock fehlt', severity: 'fehler',
        quote: input.lock.slice(0, 120),
        hint: `Nur ${Math.round(quote * 100)} Prozent der tragenden Wörter der Kernbotschaft stehen im Text. `
          + `Fehlt: ${kern.filter((w) => !drin.includes(w)).slice(0, 6).join(', ')}. `
          + 'Die Botschaft ist unantastbar — der Ton darf sich ändern, sie nie.',
      })
    } else if (quote < 0.8) {
      push({
        rule: 'Message-Lock abgeschwächt', severity: 'warnung',
        quote: input.lock.slice(0, 120),
        hint: `${Math.round(quote * 100)} Prozent der Kernbotschaft sind da. Steht sie in voller Kraft oder nur angedeutet?`,
      })
    }
  }

  /** Kanal-Grenzen — zaehlbar, also gezaehlt. */
  if (input.kanal) {
    const g = KANAL_GRENZEN[input.kanal]
    if (g) {
      const w = text.trim().split(/\s+/).filter(Boolean).length
      if (g.woerter && (w < g.woerter[0] || w > g.woerter[1])) {
        push({
          rule: 'Kanal-Grenze', severity: w > g.woerter[1] ? 'fehler' : 'warnung',
          quote: `${w} Wörter`,
          hint: `${input.kanal} liegt bei ${g.woerter[0]}–${g.woerter[1]} Wörtern.${g.hinweis ? ' ' + g.hinweis : ''}`,
        })
      }
      if (g.einheiten) {
        const n = text.split(/\n{2,}/).filter((p) => p.trim().length > 15).length
        if (n < g.einheiten[0] || n > g.einheiten[1]) {
          push({
            rule: 'Kanal-Grenze', severity: 'warnung', quote: `${n} ${g.einheit ?? 'Teile'}`,
            hint: `${input.kanal}: ${g.einheiten[0]}–${g.einheiten[1]} ${g.einheit ?? 'Teile'}.${g.hinweis ? ' ' + g.hinweis : ''}`,
          })
        }
      }
    }
  }

  /**
   * Die Ueberschriften als eigener Text.
   *
   * Sie werden oefter gelesen als der Rest. Zwei Fehler sind so haeufig, dass
   * sie sich zaehlen lassen: die Frage, die sich niemand stellt, und die
   * Ueberschrift ueber unsere Veranstaltung statt ueber seine Sache.
   */
  {
    const heads = text.split('\n').filter((l) => /^#{2,3}\s+/.test(l)).map((l) => l.replace(/^#+\s*/, '').trim())
    const fragen = heads.filter((h) => h.endsWith('?'))
    if (heads.length >= 4 && fragen.length > 2) {
      push({
        rule: 'zu viele Fragen als Überschrift', severity: 'warnung',
        quote: fragen.slice(0, 3).join(' · '),
        hint: `${fragen.length} von ${heads.length} Zwischenüberschriften sind Fragen. Höchstens zwei.`,
      })
    }
    const META = /\b(was bleibt|zum schluss|fazit|zusammenfassung|das wichtigste in kürze|nach dem (webcast|termin|vortrag|call)|worum es (hier )?geht)\b/i
    for (const h of heads) {
      if (META.test(h)) {
        push({
          rule: 'Meta-Überschrift', severity: 'fehler', quote: h,
          hint: 'Die Überschrift handelt von unserem Dokument, nicht von seiner Sache. '
            + 'Das fragt sich in Wahrheit niemand.',
        })
      }
      // Etwas Anfassbares: Zahl, Eigenname, Rolle, Ort, Uhrzeit.
      const konkret = /\d|\b(Monteur|Techniker|Vorstand|Team|Filiale|Standort|Schicht|Uhr|Montag|Regal|Halle|Baustelle|Prozent|Euro)/i
      if (h.length > 18 && !konkret.test(h) && !META.test(h)) {
        push({
          rule: 'Überschrift ohne Konkretes', severity: 'warnung', quote: h,
          hint: 'Keine Zahl, kein Ort, keine Rolle, kein Ding. Eine Überschrift aus lauter Abstrakta bleibt nicht hängen.',
        })
      }
    }
  }

  scan(GERUEST, 'sichtbares Gerüst', 'fehler',
    'Die Vorlage schaut durch. Der Leser soll den Inhalt sehen, nicht die Bauanleitung.')

  /**
   * Die Frage als Standard-Einstieg.
   *
   * Eine rhetorische Frage zieht — zwei hintereinander ermueden, und neun von
   * elf sind ein Tic. Sie ersetzen dann die Arbeit, die ein konkreter Einstieg
   * macht: jemanden zeigen, irgendwo, zu einer Zeit.
   */
  {
    const absaetze = text.split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith('#') && !p.startsWith('*') && p.split(/\s+/).length > 12)
    const ersterSatz = (p: string) => p.split(/(?<=[.!?])\s/)[0] ?? p
    const fragt = absaetze.map((p) => ersterSatz(p).trimEnd().endsWith('?'))
    const anzahl = fragt.filter(Boolean).length

    if (absaetze.length >= 4 && anzahl / absaetze.length > 0.34) {
      push({
        rule: 'Frage als Standard-Einstieg', severity: 'fehler',
        quote: `${anzahl} von ${absaetze.length} Absätzen beginnen mit einer Frage`,
        hint: 'Die rhetorische Frage ist zur Masche geworden. Sie ersetzt keinen Einstieg — '
          + 'ein Mensch, ein Ort, ein Zeitpunkt ziehen stärker. Höchstens jeder dritte Absatz.',
      })
    }
    for (let i = 1; i < fragt.length; i++) {
      if (fragt[i] && fragt[i - 1]) {
        push({
          rule: 'zwei Fragen hintereinander', severity: 'warnung',
          quote: ersterSatz(absaetze[i]).slice(0, 90),
          hint: 'Der vorige Absatz begann auch mit einer Frage.',
        })
        break
      }
    }

    /**
     * Der Kontext zuerst.
     *
     * Der erste Absatz muss verankern: wer, wo, wann, worum. Eine Frage ueber
     * eine Abstraktion ist kein Einstieg — sie setzt voraus, was sie erst
     * herstellen muesste. "Welcher Plan? Wo draussen?" ist die Reaktion, die
     * diese Regel verhindern soll.
     */
    const kopf = absaetze[0] ?? ''
    if (kopf) {
      if (ersterSatz(kopf).trimEnd().endsWith('?')) {
        push({
          rule: 'Text beginnt mit einer Frage', severity: 'fehler',
          quote: ersterSatz(kopf).slice(0, 110),
          hint: 'Der erste Satz stellt eine Frage über etwas, das der Leser noch nicht kennt. '
            + 'Erst die Szene, dann die Frage.',
        })
      }
      // Anker: Eigenname, Datum, Zahl mit Einheit, Ort, Zeitangabe.
      const anker = [
        /\b(19|20)\d{2}\b/, /\b\d+\s?(Prozent|%|Euro|€|Standorte?|Menschen|Minuten|Stunden|Tage|Wochen|Monate)/i,
        /\b(im|am|seit|letzte[nsr]?|vergangene[nsr]?)\s+(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Quartal|Jahr|Webcast|Termin)/i,
        /\b[A-ZÄÖÜ][a-zä-ü]+\s[A-ZÄÖÜ][a-zä-ü]+\b/,
      ]
      if (!anker.some((re) => re.test(kopf))) {
        push({
          rule: 'kein Kontext im Einstieg', severity: 'fehler',
          quote: kopf.slice(0, 120),
          hint: 'Im ersten Absatz steht kein Mensch, kein Ort, kein Datum, keine Zahl mit Einheit. '
            + 'Der Leser weiß nicht, wovon die Rede ist.',
        })
      }
    }

    /** Eigenlob vor dem Kontext — nur im ersten Drittel geprueft. */
    const drittel = Math.ceil(absaetze.length / 3)
    absaetze.slice(0, Math.max(1, drittel)).forEach((p) => {
      const e = new RegExp(EIGENES.source, 'i').exec(p)
      if (e && LOB.test(p)) {
        push({
          rule: 'Eigenlob vor dem Kontext', severity: 'fehler',
          quote: p.slice(Math.max(0, e.index - 30), e.index + 90).trim(),
          hint: `„${e[0]}" wird gelobt, bevor der Leser das Problem kennt. Erst die Lage, dann das Mittel — `
            + 'und auch dann beschreiben, was es tut, statt wie gut es ist.',
        })
      }
    })
  }

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
