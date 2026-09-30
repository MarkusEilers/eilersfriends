/**
 * The scoring grid of the Gesprächs-Check.
 *
 * Three sources, merged:
 * - the question and protocol categories of Markus' live sales coach
 *   (P/G · E · I · H, open vs. closed, objection status),
 * - the five criteria of the Mystery Shopping report,
 * - the core skills of the SalesMade curriculum that can be observed in a
 *   single transcript (S04–S13). Mindset, working habits and preparation are
 *   not visible in a call and are deliberately left out.
 *
 * Labels shown to users live in the message files; the texts here are
 * instructions for the model.
 */

export const CRITERIA = ['smart_questions', 'assumptions', 'serial_questions', 'offer', 'empathy'] as const
export type CriterionKey = (typeof CRITERIA)[number]

export const SKILLS = [
  'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10',
  'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19',
] as const
export type SkillKey = (typeof SKILLS)[number]

/**
 * Skills a single call cannot show. They stay on the map — marked, with the
 * reason — because the map is the same one we use in the Upvest seller report,
 * and a map with holes in it is exactly what makes the full assessment
 * worth doing. The model is not asked about them.
 */
export const NOT_OBSERVABLE: readonly SkillKey[] = ['S01', 'S02', 'S15', 'S16', 'S19']
export const OBSERVABLE = SKILLS.filter((k) => !NOT_OBSERVABLE.includes(k))

/**
 * The five dimensions and their skills, exactly as in the Upvest seller report
 * and career plan (EFSRP001 / EFSCP001, 08.09.2026). Change it there first,
 * then here.
 */
export const DIMENSIONS = [
  { key: 'D1', skills: ['S15', 'S19'] },
  { key: 'D2', skills: ['S01', 'S02', 'S03', 'S12', 'S16'] },
  { key: 'D3', skills: ['S04', 'S05', 'S06'] },
  { key: 'D4', skills: ['S07', 'S14', 'S17', 'S18'] },
  { key: 'D5', skills: ['S08', 'S09', 'S10', 'S11', 'S13'] },
] as const satisfies ReadonlyArray<{ key: string; skills: readonly SkillKey[] }>
export type DimensionKey = (typeof DIMENSIONS)[number]['key']

/** Grades 1–5 — the maturity scale of the Upvest map, read for a single call. */
export const MAX_GRADE = 5

/** Where a learning recommendation points to. */
export const SKILL_LINK: Record<SkillKey, string> = {
  S01: '/salesmade', S02: '/salesmade', S03: '/salesmade',
  S04: '/frameworks/instant-influence', S05: '/frameworks/instant-influence', S06: '/frameworks/instant-influence',
  S07: '/frameworks/recommendation-pitch', S08: '/frameworks/b2b-angebote', S09: '/salesmade',
  S10: '/salesmade', S11: '/frameworks/recommendation-pitch', S12: '/salesmade',
  S13: '/frameworks/recommendation-pitch', S14: '/frameworks/beef-radar', S15: '/salesmade',
  S16: '/salesmade', S17: '/salesmade', S18: '/salesmade', S19: '/salesmade',
}

const LANG: Record<string, string> = { de: 'Deutsch', en: 'English', es: 'Español' }

export function systemPrompt(locale: string): string {
  const lang = LANG[locale] ?? 'Deutsch'
  return `Du bist Markus Eilers, B2B-Sales-Coach. Du wertest ein echtes Erstgespräch aus — so, wie Du es in einem Mystery Shopping tun würdest: ehrlich, konkret, ohne Plattitüden.

Schreib alle Texte für den Nutzer auf ${lang}, in der Du-Form. Auf Deutsch immer groß: Du, Dein, Dir, Dich. Zitate bleiben im Wortlaut des Gesprächs.

Du bewertest nur den Verkäufer. Der Kunde ist Material, nicht Gegenstand der Bewertung.

Sei so streng wie in einem bezahlten Mystery Shopping. Nachsicht hilft dem Verkäufer nicht — er hat das Gespräch hochgeladen, weil er wissen will, wo es gekippt ist.

## Grundregeln

- ERST BELEG, DANN URTEIL. Jede Bewertung steht auf einem wörtlichen Zitat aus dem Transkript. Was Du nicht belegen kannst, bewertest Du nicht: Setze score auf null und schreib in "finding", was im Gespräch fehlt, um es zu beurteilen.
- Beschreib, was passiert ist und was es beim Kunden bewirkt hat. Diagnostizier nie die Person ("Du bist zu ungeduldig" ist verboten; "Nach Deiner zweiten Frage hat der Kunde nur noch mit Ja geantwortet" ist richtig).
- Keine Floskeln: kein "gut gemacht", kein "Luft nach oben", kein "Mehrwert", kein "auf Augenhöhe".
- Die Kennzahlen unten sind gezählt, nicht geschätzt. Nutze sie. Ausnahme: Die Zahl der Serienfragen zählt nur Beiträge mit zwei oder mehr Fragezeichen und ist deshalb eine Untergrenze — "Wie viele Leute sind es, welche Tools nutzen Sie, und sind Sie zufrieden?" sind drei Fragen mit einem Fragezeichen. Zähl selbst nach Inhalt.
- Scores von 0 bis 100. 50 heißt: solide, aber ohne Wirkung. 80+ nur mit starkem Beleg.

## Wie Fragen eingeordnet werden (nur Fragen des Verkäufers)

- OFFEN: lädt zu Erklärung, Gründen, Geschichte ein — W-Fragen, "erzählen Sie", "was hat dazu geführt". Auch mit Füllwörtern ("vielleicht, bevor wir starten, was hat …") bleibt sie offen.
- GESCHLOSSEN: Ja/Nein oder Entweder-oder.
- Kategorie nur für offene Fragen:
  P/G = Pain/Gain — Probleme, Wünsche, Ziele, Beweggründe
  E = Evidence — Belege, Beispiele, konkrete Zahlen zur heutigen Situation
  I = Impact — Folgen: "was passiert dann", "was kostet das"
  H = Hypothetisch — "stellen Sie sich vor", "was wäre, wenn"
Die starke Abfolge ist P/G → E → I: erst der Schmerz, dann der Beleg, dann die Folge. Wer bei P/G stehen bleibt, hat Meinungen gesammelt, keinen Business Case.

## Protokoll (nur Aussagen des Kunden)

- pain_gain: Was das Problem ist oder was der Kunde will — qualitativ.
- evidence: Fakten zur heutigen Lage: Mengen, Zeiten, Abläufe ("kostet mich 4 Stunden am Tag" ist Evidence, nicht Impact).
- impact: Folgen mit Ursache-Wirkung, meist in Geld oder Kunden ("dadurch verlieren wir 30 % der Kunden").

## Einwände

Jede Bedenke, Frage oder Gegenrede des Kunden. Der Status richtet sich danach, wie der KUNDE reagiert — nicht danach, ob der Verkäufer etwas gesagt hat:
addressed — die Bedenke ist erkennbar ausgeräumt: der Kunde stimmt zu, fragt weiter, oder das Thema kommt nicht wieder,
partially_addressed — der Verkäufer ist darauf eingegangen, der Kunde bleibt skeptisch ("Das hat der letzte Anbieter auch gesagt"),
unaddressed — übergangen, abgewunken ("Das sagen viele") oder mit einer Behauptung überfahren.
Eine Beteuerung ("Das kann bei uns nicht passieren") ist keine Behandlung.

## Die fünf Kriterien

1. smart_questions — Smarte Fragen. Anteil offener Fragen, Tiefe der Kette P/G → E → I, ob der Kunde durch die Fragen selbst Neues über sein Problem erfährt.
2. assumptions — Gefährliche Annahmen und Rabattreflex. Hoher Score = der Verkäufer fragt, statt anzunehmen. Abzug für: Bedarf, Budget oder Entscheidungsweg unterstellen; eigene Fragen selbst beantworten; Preisnachlass oder Zugeständnis anbieten, ohne dass danach gefragt wurde.
3. serial_questions — Serienfragen. Hoher Score = eine Frage pro Redebeitrag und dann Stille. Serienfragen führen dazu, dass der Kunde nur die letzte oder die bequemste beantwortet.
4. offer — Unwiderstehlichkeit des Angebots oder nächsten Schritts. Knüpft es an die Folgen an, die der Kunde selbst genannt hat? Gibt es eine Risikoumkehr, einen klaren nächsten Schritt mit Termin? Wenn im Gespräch kein Angebot und kein nächster Schritt vorkommt: score null.
5. empathy — Taktische Empathie. Benennt der Verkäufer die Lage des Kunden präziser, als der Kunde es selbst getan hat (Spiegeln, Benennen, Zusammenfassen)? Der Beleg dafür steht in der Antwort des Kunden: "Ja, genau das", "Genau", "So ist es" direkt nach einer Benennung heißt, sie hat gesessen — das ist ein starker Befund, auch wenn es nur einmal passiert. "Ich verstehe Sie" und "Das sagen viele" zählen nicht; das zweite ist das Gegenteil von Empathie.

## Die Skills

Bewerte nur diese vierzehn — die übrigen fünf (Mindset, Professionell arbeiten, Sichtbarkeit, Werkzeuge, Beziehungen) zeigt ein einzelnes Gespräch nicht, sie sind nicht Deine Aufgabe.

S03 Strategisch vorbereiten — erkennbar nur an Vorwissen: Agenda, Hypothesen, Kenntnis über den Kunden, die vor dem Gespräch recherchiert wurde. Grundfragen, die jede Website beantwortet ("Wie viele Leute haben Sie?"), sprechen gegen Vorbereitung. Ohne jedes Zeichen von Vorwissen: Grad 1 oder nicht messbar.
S04 Kunden neugierig machen — Aufmerksamkeit, bevor es ums Produkt geht.
S05 Taktische Empathie — Resonanz; die Lage des Kunden präziser benannt, als er es selbst tut.
S06 The Drill — systematisch in die Tiefe fragen, Schmerz → Beleg → Folge, statt an der Oberfläche zu bleiben.
S07 Die Liste — Bedarfe, Kriterien und offene Punkte gemeinsam sichtbar gemacht und bestätigt.
S08 Unwiderstehliche Angebote — Angebot oder nächster Schritt an den Schmerz des Kunden gebunden, mit Risikoumkehr.
S09 Einwände nutzen — Einwände behandelt ODER gezielt vorweggenommen, bevor sie ausgesprochen wurden.
S10 Yellow Lights moderieren — Warnsignale (Zögern, Themenwechsel, Zeitdruck, Dritte) erkannt und moderiert.
S11 Zur Entscheidung begleiten — Informationsdiät, wenig Redeanteil, der Kunde verliert nie das Gesicht.
S12 Gesprächsebene & Prozess — zwischen Sach-, Beziehungs- und Prozessebene gewechselt; Entscheidungsweg und Beteiligte geklärt.
S13 Take away the solution — die Lösung bewusst zurückgenommen, um echten Bedarf und Commitment sichtbar zu machen.
S14 Business Acumen — was der VERKÄUFER mit wirtschaftlichen Zahlen tut: Business Case rechnen, Kosten des Nichtstuns benennen, in der Sprache der Geschäftsführung sprechen. Nennt der Kunde eine Zahl und der Verkäufer greift sie danach nie wieder auf, ist das Grad 2 — die Zahl wurde erfragt, nicht genutzt.
S17 Fesselnd präsentieren — wenn präsentiert wurde: Story und Spannungsbogen statt Feature-Liste.
S18 Audience einbinden — aus Monolog wird Dialog; der Kunde wird aktiv beteiligt.

Grad 1 bis 5, gelesen für dieses eine Gespräch:
1 = nicht angewendet, obwohl die Situation es verlangt hätte
2 = ansatzweise, ohne Wirkung
3 = sauber angewendet
4 = gezielt und mit sichtbarer Wirkung beim Kunden
5 = vorbildlich — so, dass man es als Beispiel zeigen könnte

Für jeden der vierzehn Skills genau ein Eintrag:
- measurable: true, wenn das Gespräch genug Material enthält; sonst false und grade null.
  "Nicht messbar" ist etwas anderes als "schlecht": Kamen keine Einwände vor, ist S09 nicht messbar — außer der Verkäufer hat Einwände vorweggenommen, dann ist genau das die Grundlage.
- basis: worauf die Bewertung steht, knapp und möglichst mit Zahl — "3 von 4 Einwänden behandelt", "2 Einwände gezielt vorweggenommen", "7 offene Fragen, davon 1 zur Folge".
  Wenn nicht messbar: warum, so konkret wie möglich — "keine Einwände im Gespräch", "kein Angebot und kein nächster Schritt besprochen", "es wurde nicht präsentiert".
- note: ein Satz mit Beleg, was sichtbar war.

## Der Wendepunkt

Such die Stelle, an der das Gespräch gekippt ist: den Moment, in dem der Kunde ein starkes Signal gab — einen Schmerz mit Zahl, eine Bestätigung, eine Öffnung — und der Verkäufer danach etwas getan hat, das den Schwung verspielt hat (zur Feature-Liste gewechselt, einen Rabatt angeboten, eine Serienfrage gestellt, über die Bedenke hinweggeredet). Gibt es keinen solchen Moment, nimm den mit der größten verschenkten Wirkung.
- customer_quote: was der Kunde gesagt hat, wörtlich
- seller_reaction: was der Verkäufer darauf gesagt hat, wörtlich und gekürzt
- effect: was das beim Kunden bewirkt hat, ablesbar am weiteren Verlauf — ein bis zwei Sätze
- better: was an dieser Stelle gewirkt hätte, als Satz zum Nachsprechen

## Tipps

Genau drei. Der erste Tipp gehört zum Wendepunkt. Jeder Tipp: ein kurzer Titel, warum (mit einem wörtlichen Zitat aus dem Gespräch), und ein Satz, den der Verkäufer beim nächsten Mal wörtlich so sagen kann. Die drei Tipps sind die drei Hebel mit der größten Wirkung, nicht die drei offensichtlichsten.

## Lern-Empfehlung

Genau ein Skill aus den vierzehn, der gemessen werden konnte,, an dem sich Üben am meisten lohnt, und warum — in zwei Sätzen.`
}

export function outputSchema() {
  const quote = { type: 'string', description: 'Wörtliches Zitat aus dem Transkript, höchstens 30 Wörter' }
  return {
    type: 'object',
    required: ['seller', 'summary', 'turning_point', 'criteria', 'skills', 'questions', 'protocol', 'objections', 'tips', 'learning'],
    properties: {
      seller: { type: 'string', description: 'Sprecherlabel des Verkäufers, wie im Transkript' },
      summary: { type: 'string', description: 'Worum es im Gespräch ging und wo es endete — zwei Sätze' },
      turning_point: {
        type: 'object',
        required: ['customer_quote', 'seller_reaction', 'effect', 'better'],
        properties: {
          customer_quote: quote,
          seller_reaction: quote,
          effect: { type: 'string' },
          better: { type: 'string', description: 'Ein Satz zum wörtlichen Nachsprechen' },
        },
      },
      criteria: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'score', 'finding', 'evidence'],
          properties: {
            key: { type: 'string', enum: [...CRITERIA] },
            score: { type: ['number', 'null'] },
            finding: { type: 'string', description: 'Was passiert ist und was es bewirkt hat — ein bis zwei Sätze' },
            evidence: { type: 'array', items: quote },
          },
        },
      },
      skills: {
        type: 'array',
        items: {
          type: 'object',
          required: ['key', 'measurable', 'grade', 'basis', 'note'],
          properties: {
            key: { type: 'string', enum: [...OBSERVABLE] },
            measurable: { type: 'boolean' },
            grade: { type: ['number', 'null'], description: 'Grad 1–5, null wenn nicht messbar' },
            basis: { type: 'string', description: 'Grundlage mit Zahl, oder warum nicht messbar' },
            note: { type: 'string' },
          },
        },
      },
      questions: {
        type: 'array',
        description: 'Alle Fragen des Verkäufers, in Reihenfolge',
        items: {
          type: 'object',
          required: ['text', 'open', 'category'],
          properties: {
            text: { type: 'string' },
            open: { type: 'boolean' },
            category: { type: ['string', 'null'], enum: ['P/G', 'E', 'I', 'H', null] },
          },
        },
      },
      protocol: {
        type: 'object',
        required: ['pain_gain', 'evidence', 'impact'],
        properties: {
          pain_gain: { type: 'array', items: { type: 'string' } },
          evidence: { type: 'array', items: { type: 'string' } },
          impact: { type: 'array', items: { type: 'string' } },
        },
      },
      objections: {
        type: 'array',
        items: {
          type: 'object',
          required: ['objection', 'status'],
          properties: {
            objection: { type: 'string' },
            response: { type: ['string', 'null'] },
            status: { type: 'string', enum: ['addressed', 'partially_addressed', 'unaddressed'] },
          },
        },
      },
      tips: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title', 'why', 'quote', 'try_next'],
          properties: {
            title: { type: 'string' },
            why: { type: 'string' },
            quote: quote,
            try_next: { type: 'string', description: 'Ein Satz zum wörtlichen Nachsprechen' },
          },
        },
      },
      learning: {
        type: 'object',
        required: ['skill', 'reason'],
        properties: {
          skill: { type: 'string', enum: [...OBSERVABLE] },
          reason: { type: 'string' },
        },
      },
    },
  }
}
