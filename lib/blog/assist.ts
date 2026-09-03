import { AUTHORS, type Author } from './authors'

/**
 * Die vier Helfer neben dem Text.
 *
 * Sie schreiben nicht in den Beitrag. Sie legen ihren Vorschlag daneben, und ein
 * Mensch uebernimmt ihn. Wer schreibt und prueft in einem Durchgang, verteidigt
 * seinen eigenen Text — das hat sich in dieser Woche zweimal gezeigt.
 */

export type AssistKind = 'kuerzen' | 'auszug' | 'untertitel' | 'schlagworte' | 'voice' | 'bildprompt' | 'uebersetzen'

async function ask(system: string, user: string, schema?: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY fehlt')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1',
      temperature: 0.4,
      max_tokens: 2000,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: schema
        ? { type: 'json_schema', json_schema: { name: 'ergebnis', schema, strict: false } }
        : { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`Modell ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
}

/** Die Haltung, die in allen Helfern gleich ist. */
const HALTUNG = (a: Author) => `Du arbeitest an einem Beitrag von ${a.name} (${a.role}).

Regeln, die ueber allem stehen:
- Keine Ehrlichkeits-Marker. "Ganz ehrlich", "Klartext", "ohne Bullshit" lassen den Leser hoeren: sonst luegt ihr also.
- Keine personifizierten Abstrakta. Zahlen sagen nichts, Maerkte fordern nichts, Daten sprechen nicht.
- Keine Floskel, der niemand widersprechen wuerde. Wenn kein Gegenteil denkbar ist, steht da nichts.
- Die Ansprache bleibt durchgehend so wie im Ausgangstext. Ein Wechsel mitten im Text ist kein Stil.
- Du erfindest keine Zahl. Steht keine im Text, kommt auch keine hinein.`

const SPRACHE: Record<string, string> = { en: 'Englisch', es: 'Spanisch', de: 'Deutsch' }

export async function assist(kind: AssistKind, input: {
  authorSlug: 'markus' | 'aljona'
  title?: string; subtitle?: string; content?: string; tags?: string[]
  targetLocale?: string; excerpt?: string
}) {
  const a = AUTHORS[input.authorSlug] ?? AUTHORS.markus
  const text = (input.content ?? '').slice(0, 12000)

  switch (kind) {
    case 'kuerzen':
      return ask(
        `${HALTUNG(a)}

Du kuerzt. Derselbe Gedanke, weniger Zeilen. Was faellt, sind Wiederholungen, Anlaeufe und Saetze, die den vorigen erklaeren. Was bleibt, sind Beobachtung, Szene und Schluss.

Sag am Ende in einem Satz, was Du weggenommen hast und warum.`,
        `Titel: ${input.title ?? ''}\n\n${text}`,
        { type: 'object', required: ['gekuerzt', 'was_weg'], properties: {
          gekuerzt: { type: 'string', description: 'Der gekuerzte Text, in Markdown' },
          was_weg: { type: 'string' },
          zeichen_vorher: { type: 'number' }, zeichen_nachher: { type: 'number' } } },
      )

    case 'auszug':
      return ask(
        `${HALTUNG(a)}

Du schreibst den Auszug, der in der Uebersicht unter dem Titel steht. Zwei bis drei Saetze. Er verraet die Beobachtung, nicht den Schluss — wer den Schluss schon kennt, klickt nicht.

Drei Vorschlaege, unterschiedlich im Ansatz: einer beginnt mit der Szene, einer mit der Beobachtung, einer mit der Frage.`,
        `Titel: ${input.title ?? ''}\n\n${text}`,
        { type: 'object', required: ['vorschlaege'], properties: { vorschlaege: {
          type: 'array', items: { type: 'object', required: ['text', 'ansatz'],
            properties: { text: { type: 'string' }, ansatz: { type: 'string' } } } } } },
      )

    case 'untertitel':
      return ask(
        `${HALTUNG(a)}

Du schreibst den Untertitel unter der Ueberschrift. Ein Satz, der den Titel nicht wiederholt, sondern schaerft.

Drei Vorschlaege.`,
        `Titel: ${input.title ?? ''}\n\n${text.slice(0, 4000)}`,
        { type: 'object', required: ['vorschlaege'], properties: {
          vorschlaege: { type: 'array', items: { type: 'string' } } } },
      )

    case 'schlagworte':
      return ask(
        `Du vergibst Schlagworte fuer einen Blogbeitrag. Drei bis fuenf, jedes ein bis zwei Woerter, gross geschrieben wie ein Substantiv.

Ein Schlagwort taugt, wenn mindestens ein weiterer Beitrag dieses Autors es tragen koennte. Was nur zu diesem einen Text passt, ist kein Schlagwort, sondern eine Ueberschrift.

Bevorzuge Schlagworte, die es schon gibt.`,
        `Vorhandene Schlagworte: ${(input.tags ?? []).join(', ') || 'keine'}\n\nTitel: ${input.title ?? ''}\n\n${text.slice(0, 6000)}`,
        { type: 'object', required: ['schlagworte'], properties: {
          schlagworte: { type: 'array', items: { type: 'string' } },
          verworfen: { type: 'array', items: { type: 'object', properties: {
            wort: { type: 'string' }, warum: { type: 'string' } } } } } },
      )

    case 'voice':
      return ask(
        `Du pruefst, ob ein Text nach ${a.name} klingt. Du schreibst nichts um — Du zeigst Fundstellen.

Worauf Du siehst: Ansprache durchgehend. Ehrlichkeits-Marker. Personifizierte Abstrakta. Floskeln ohne moegliches Gegenteil. Versprechen, die groesser sind als das, was belegt ist. Fremdes Vokabular, das die Zielgruppe nicht benutzt.

Zu jedem Befund die Fundstelle woertlich und ein Vorschlag, der dieselbe Aussage in der richtigen Stimme macht. Nicht bloss streichen — ersetzen.

Kein Lob ohne Begruendung. Wenn der Text traegt, sag das.`,
        `${input.title ?? ''}\n\n${text}`,
        { type: 'object', required: ['verdict', 'findings'], properties: {
          verdict: { type: 'string', description: 'klingt richtig | klingt daneben | klingt fremd' },
          ansprache: { type: 'string' },
          findings: { type: 'array', items: { type: 'object', required: ['quote', 'was', 'vorschlag'],
            properties: { quote: { type: 'string' }, was: { type: 'string' },
              vorschlag: { type: 'string' }, schwere: { type: 'string' } } } },
          traegt: { type: 'array', items: { type: 'string' } } } },
      )

    case 'uebersetzen': {
      const ziel = SPRACHE[input.targetLocale ?? 'en'] ?? 'Englisch'
      return ask(
        `Du uebersetzt einen Blogbeitrag ins ${ziel}.

Das ist keine Wort-fuer-Wort-Uebertragung. Der Text soll in der Zielsprache so klingen, wie er im Deutschen klingt: dieselbe Beobachtung, derselbe Rhythmus, dieselbe Zurueckhaltung.

Was Du behaeltst: die Struktur der Absaetze, die Zwischenueberschriften, die Zitate, die Aufzaehlungen, die Markdown-Auszeichnung. Zahlen und Eigennamen bleiben, wie sie sind.

Was Du anpasst: Redewendungen, die woertlich uebersetzt schief klingen. Ein deutsches Bild, das in der Zielsprache nicht existiert, wird durch ein Bild ersetzt, das dasselbe tut — nicht durch eine Erklaerung.

Was Du nicht tust: glaetten, verstaerken, hoeflicher machen. Und keine Zahl erfinden, die im Original nicht steht.

Am Ende nennst Du die Stellen, an denen Du vom Wortlaut abgewichen bist, und warum.`,
        `TITEL: ${input.title ?? ''}\nUNTERTITEL: ${input.subtitle ?? ''}\nAUSZUG: ${input.excerpt ?? ''}\n\nTEXT:\n${text}`,
        { type: 'object', required: ['title', 'content'], properties: {
          title: { type: 'string' }, subtitle: { type: 'string' }, excerpt: { type: 'string' },
          content: { type: 'string', description: 'Der uebersetzte Text in Markdown' },
          tags: { type: 'array', items: { type: 'string' } },
          abweichungen: { type: 'array', items: { type: 'object', properties: {
            original: { type: 'string' }, uebersetzt: { type: 'string' }, warum: { type: 'string' } } } } } },
      )
    }

    case 'bildprompt':
      return ask(
        `Du schreibst den Auftrag fuer ein Titelbild.

Der Bildstil dieses Autors: ${a.slug === 'markus'
          ? 'Fotografie, gedeckte Farben, kuehles Licht, Menschen bei der Arbeit, echte Orte, keine Studio-Freisteller, kein Glanz.'
          : 'Fotografie mit Bewegung, warmes Licht, Koerper und Haltung, tiefes Rot im Hintergrund, keine Buehnenklischees.'}

Das Bild illustriert nicht den Titel, sondern die Beobachtung dahinter. Ein Bild, das den Titel nachstellt, wirkt wie ein Schild.

Kein Text im Bild, keine Logos, keine erkennbaren echten Personen.`,
        `Titel: ${input.title ?? ''}\nUntertitel: ${input.subtitle ?? ''}\n\n${text.slice(0, 3000)}`,
        { type: 'object', required: ['prompt', 'alt'], properties: {
          prompt: { type: 'string', description: 'Der Bildauftrag, englisch' },
          alt: { type: 'string', description: 'Alternativtext auf Deutsch, beschreibend' },
          warum: { type: 'string' } } },
      )
  }
}
