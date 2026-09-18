import { upsertPack } from './knowledge'
import { publishAgent } from './run'

/**
 * Die Startbestueckung: was heute in den Writer-Skills steckt, als Daten.
 *
 * Diese Pakete sind global (org_id NULL). Ein Kunde bekommt spaeter eigene unter
 * demselben Schluessel — dann gewinnt seine Fassung, und derselbe Agent schreibt
 * in seiner Stimme statt in unserer.
 */

export async function seedWriterKnowledge() {
  await upsertPack({
    key: 'voice.markus', kind: 'voice', name: 'Voice-Charta',
    description: 'Wie hier geschrieben wird. Vor jedem Satz anzuwenden, nicht danach zu prüfen.',
    replace: true,
    items: [
      { title: 'Curiosity statt Verdikt', weight: 90, body:
        'Eine Beobachtung machen, die der Leser teilt. Nicht eine Wahrheit verkünden. Nicht: „94 % der Verkäufer haben nie eine Ausbildung gemacht." Sondern: „Mir ist etwas aufgefallen, das mich seitdem nicht loslässt."' },
      { title: 'Selbst rein, nicht über', weight: 90, body:
        'Die eigene Verletzlichkeit steht vor der Beobachtung über den Leser. Wer zuerst von sich erzählt, darf danach etwas über andere sagen.' },
      { title: 'Wit über die Branche, nie über den Leser', weight: 85, body:
        'Scharf gegen das System, die Branche, sich selbst. Nie gegen den, der gerade liest. Keine Gegenüberstellung, die den Leser in die schlechte Gruppe sortiert.' },
      { title: 'Spüren, nicht überzeugen', weight: 80, body:
        'Eine Stelle zum Selbst-Erkennen anbieten, statt die Schlussfolgerung in den Kopf zu pressen. „Vielleicht kennst Du das Gefühl" trägt weiter als „Das bedeutet".' },
      { title: 'Konkrete Szene als Geschenk', weight: 80, body:
        'Zeit, Ort, Detail. Nicht als Beweis, sondern als Erzählung. Drei Tabs, neun Minuten, ein Espresso.' },
      { title: 'Zukunft als Einladung', weight: 75, body:
        'Was-wäre-wenn ist stärker als was-passiert-wenn-nicht. Keine Drohung, kein Countdown.' },
      { title: 'Warmes Ende', weight: 75, body:
        'Eine Frage, die man beim Espresso stellen würde. Keine, die nach Algorithmus klingt.' },
      { title: 'Rhythmus', weight: 70, body:
        'Nach einem langen Satz ein kurzer. Fragmente als Schlag: „Fehlanzeige." „Meistens nicht." Mindestens drei kurze Sätze je Stück.' },
      { title: 'Der Espresso-Test', weight: 95, body:
        'Würde ich diesen Satz beim Espresso sagen, wenn mir jemand gegenübersitzt? Wenn nein, neu schreiben.' },
    ],
  })

  await upsertPack({
    key: 'verbote', kind: 'verbote', name: 'Was nicht vorkommt',
    description: 'Harte Verbote. Der Linter prüft sie deterministisch, nicht der Geschmack.',
    replace: true,
    items: [
      ...['echt', 'Seat', 'Cohort', 'Bausteine', 'Game-Changer', 'auf Steroiden',
          'ganzheitlich', 'innovativ und zuverlässig', 'nahtlos', 'State of the Art']
        .map((w) => ({ key: 'wort', body: w, tags: ['wort'], weight: 60 })),
      { title: 'Ehrlichkeits-Marker', weight: 95, body:
        '„Ganz ehrlich", „Klartext", „ohne Bullshit", „die ehrliche Rechnung". Der Leser hört: sonst lügt ihr also. Die Zahl einfach nennen, ohne ihre Wahrhaftigkeit zu beteuern.' },
      { title: 'Personifizierte Abstrakta', weight: 95, body:
        'Zahlen sagen nichts. Märkte fordern nichts. Daten sprechen nicht. Wer handelt, hat einen Namen.' },
      { title: 'Floskeln ohne Gegenteil', weight: 85, body:
        'Wenn kein Mensch widersprechen würde, steht da nichts. „Der Kunde im Mittelpunkt" ist keine Aussage.' },
      { title: 'Strukturplatzhalter als Überschrift', weight: 85, body:
        '„Die neue Realität", „Was Top-Performer anders machen", „Hier ist, was Du bekommst" kommen nie in den fertigen Text. Überschriften arbeiten mit dem konkreten Inhalt.' },
      { title: 'Erfundene Zahlen', weight: 95, body:
        'Keine Prozentzahl ohne Beleg — auch nicht mit „(Annahme)" daneben. Eine erfundene Zahl wird durch das Eingeständnis nicht besser, sie wandert nur mit einem Feigenblatt weiter.' },
    ],
  })

  await upsertPack({
    key: 'methode.belief', kind: 'methode', name: 'Vorgehen',
    description: 'Wie ein Text gebaut wird, bevor er geschrieben wird.',
    replace: true,
    items: [
      { title: 'Überzeugungskette zuerst', weight: 95, body:
        'Bevor ein Satz steht: Welche Überzeugungen muss der Leser nacheinander annehmen? Jede in erster Person, wie er sie selbst sagen würde. Die Reihenfolge rückwärts prüfen — kann er Stufe n glauben, ohne n-1 zu glauben?' },
      { title: 'Zeigen schlägt behaupten', weight: 90, body:
        'Zu jeder Stufe gehört ein Beleg: eine Zahl, eine Äußerung, ein Rechenweg, ein Vorher-Nachher. Wo keiner da ist, wird die Stufe benannt statt kaschiert.' },
      { title: 'Längenbudget vorher verteilen', weight: 80, body:
        'Die Zielgröße wird beim Skelett auf die Abschnitte verteilt, nicht am Ende weggekürzt. Wer am Ende kürzt, streicht die Szenen und behält die Behauptungen.' },
      { title: 'Ein Gedanke je Abschnitt', weight: 75, body:
        'Wenn ein Abschnitt zwei Dinge sagt, sagt er keines.' },
    ],
  })

  await upsertPack({
    key: 'kanal', kind: 'kanal', name: 'Was die Textart verlangt',
    replace: true,
    items: [
      { key: 'linkedin', title: 'LinkedIn-Post', weight: 70, body:
        'Erste Zeile entscheidet. Kein Vorspann, keine Anmoderation. 120 bis 250 Wörter. Ein Gedanke. Absätze von ein bis drei Zeilen. Am Ende eine Frage, die man wirklich beantworten würde.' },
      { key: 'blog', title: 'Blogbeitrag', weight: 70, body:
        '600 bis 1.200 Wörter. Zwischenüberschriften, die den Inhalt tragen. Eine Szene am Anfang, eine Probe in der Mitte, ein Satz am Ende, den man sich merkt.' },
      { key: 'newsletter', title: 'Newsletter', weight: 70, body:
        'Wie ein Brief an einen Menschen. 300 bis 600 Wörter. Betreff verrät die Beobachtung, nicht den Schluss.' },
      { key: 'report', title: 'Report', weight: 70, body:
        'Belege tragen, nicht Meinung. Jede Behauptung mit Quelle oder als Annahme gekennzeichnet. Zusammenfassung vorne, die allein stehen kann.' },
      { key: 'youtube', title: 'YouTube-Video', weight: 70, body:
        'Gesprochene Sprache. Kurze Hauptsätze. Die ersten 15 Sekunden sagen, warum man bleibt. Gliederung in Kapitel mit Ansage.' },
      { key: 'short', title: 'Short', weight: 70, body:
        '45 bis 90 Wörter. Ein einziger Gedanke. Erster Satz ist der Haken, letzter Satz ist die Pointe. Nichts dazwischen, was man weglassen könnte.' },
    ],
  })
}

/* ─────────────────────────── Agent 1 ─────────────────────────── */

const SYSTEM_BASE = `Du schreibst für Eilers+Friends.

{{wissen}}

Zwei Dinge, die über allem stehen:

Du fragst nicht zurück. Fehlt eine Angabe, triffst Du eine Annahme und legst sie offen — ein Agent, der still rät, ist der gefährlichere.

Du erfindest keine Zahl. Steht sie nicht im Material oder in der Recherche, kommt sie nicht in den Text.`

export async function seedWriterAgent() {
  return publishAgent({
    key: 'content-writer',
    title: 'Content-Writer',
    description:
      'Nimmt Briefing, Kontext und Stimme auf, recherchiert bei Bedarf, baut die Überzeugungskette und liefert drei Varianten mit Lint-Bericht und offengelegten Annahmen.',
    knowledge: ['voice.markus', 'verbote', 'methode.belief', 'kanal'],
    scopes: ['agents:run'],
    default_model_role: 'copy',
    input_schema: {
      type: 'object',
      required: ['inhalte', 'textart'],
      properties: {
        audience: { type: 'string', description: 'Wer liest das — Rolle, Lage, was er schon glaubt' },
        context_md: { type: 'string', description: 'Kontext als Markdown: Firma, Angebot, Vorgeschichte' },
        inhalte: { type: 'string', description: 'Worum es geht — Rohmaterial, Stichpunkte, Zitate' },
        tonalitaet: { type: 'string' },
        ueberzeugungsziel: { type: 'string', description: 'Was der Leser danach glauben oder tun soll' },
        textart: { type: 'string', enum: ['report', 'blog', 'linkedin', 'newsletter', 'youtube', 'short'] },
        laenge: {
          type: 'object',
          properties: { wert: { type: 'number' }, einheit: { type: 'string', enum: ['woerter', 'seiten'] } },
        },
        ansprache: { type: 'string', enum: ['du', 'ihr', 'sie'] },
        recherche: { type: 'boolean', description: 'Darf der Agent im Netz nachsehen?' },
      },
    },
    output_schema: {
      type: 'object',
      properties: {
        varianten: { type: 'array', items: { type: 'object' } },
        annahmen: { type: 'array', items: { type: 'string' } },
        quellen: { type: 'array', items: { type: 'object' } },
        pruefung: { type: 'object' },
      },
    },
    steps: [
      { key: 'aufnahme', kind: 'intake', title: 'Eingaben ordnen' },
      { key: 'kontext', kind: 'kontext', title: 'Wissen laden' },
      { key: 'recherche', kind: 'recherche', title: 'Nachsehen', onlyIf: 'recherche', optional: true },
      {
        key: 'kette', kind: 'modell', title: 'Überzeugungskette', temperature: 0.4, maxTokens: 2000,
        system: `${SYSTEM_BASE}

Du baust jetzt nur die Überzeugungskette. Noch keinen Text.

Vier bis sechs Stufen, jede ein Satz in erster Person, wie der Leser ihn selbst sagen würde. Zu jeder: was er heute stattdessen glaubt, und welcher Beleg ihn umstimmt. Prüfe die Reihenfolge rückwärts.

Markiere die eine Stufe, die am schwersten fällt.`,
        user: `Zielgruppe: {{aufnahme.audience}}
Überzeugungsziel: {{aufnahme.ueberzeugungsziel}}
Textart: {{aufnahme.textart}}

Material:
{{aufnahme.inhalte}}

Kontext:
{{material}}

Recherche:
{{recherche.material}}`,
        schema: {
          type: 'object', required: ['stufen'],
          properties: {
            stufen: {
              type: 'array',
              items: {
                type: 'object', required: ['glaube', 'heute', 'beleg'],
                properties: {
                  glaube: { type: 'string' }, heute: { type: 'string' },
                  beleg: { type: 'string' }, form: { type: 'string' }, schwerste: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
      {
        key: 'entwuerfe', kind: 'faecher', title: 'Drei Wege', temperature: 0.8, maxTokens: 5000,
        fanout: 3, variants: ['Szene', 'Beobachtung', 'Frage'],
        system: `${SYSTEM_BASE}

Du baust einen eigenen Text. Erst das Skelett, dann die Prosa — beides in einem Zug.

Dein Zugang ist vorgegeben: {{variante.ansatz}}. Bei Szene beginnst Du mit einem Moment mit Zeit, Ort und Detail. Bei Beobachtung mit etwas, das Dir aufgefallen ist und das der Leser teilt. Bei Frage mit einer, die er sich selbst schon gestellt hat.

Der Zugang bestimmt nicht nur den ersten Satz, sondern die Dramaturgie: Eine Szene laeuft auf eine Erkenntnis zu. Eine Beobachtung laeuft auf eine Probe zu. Eine Frage laeuft auf eine zweite Frage zu. Wer nur den Einstieg tauscht und den Rest gleich laesst, liefert dreimal denselben Text in drei Farben.

Verteile die Zielgroesse auf Deine Abschnitte, bevor Du schreibst. Was am Ende gekuerzt wird, sind immer die Szenen — uebrig bleiben die Behauptungen.

Die Ansprache steht von Anfang an im Text, nicht erst im letzten Absatz. Ein Text, der erst am Ende jemanden anspricht, hat vorher ueber sich selbst geredet.`,
        user: `Die Ueberzeugungskette, die alle Fassungen teilen:
{{kette.stufen}}

Material:
{{aufnahme.inhalte}}

Kontext:
{{material}}

Recherche:
{{recherche.material}}

Textart: {{aufnahme.textart}}
Ansprache: {{aufnahme.ansprache}}
Tonalitaet: {{aufnahme.tonalitaet}}
Zielgroesse: {{aufnahme.ziel_woerter}} Woerter`,
        schema: {
          type: 'object', required: ['titel', 'text', 'skelett'],
          properties: {
            titel: { type: 'string' },
            hook: { type: 'string' },
            skelett: {
              type: 'array',
              items: {
                type: 'object', required: ['name', 'woerter'],
                properties: {
                  name: { type: 'string' }, stufe: { type: 'string' },
                  beats: { type: 'array', items: { type: 'string' } }, woerter: { type: 'number' },
                },
              },
            },
            text: { type: 'string', description: 'Der vollständige Text in Markdown' },
            worin_anders: { type: 'string', description: 'Ein Satz: wodurch unterscheidet sich diese Fassung' },
          },
        },
      },
      { key: 'pruefung', kind: 'lint', title: 'Prüfung', source: 'entwuerfe' },
      {
        key: 'revision', kind: 'revision', title: 'Revision', temperature: 0.4, maxTokens: 4000,
        source: 'entwuerfe', reports: 'pruefung',
        system: `${SYSTEM_BASE}

Du behebst ausschließlich die genannten Befunde. Nichts anderes.

Kein Umschreiben, kein Verbessern, kein Glätten. Wer bei der Revision den ganzen Text anfasst, macht aus drei Varianten drei gleiche.`,
        user: `Der Text:
{{variante.text}}

Die Befunde:
{{befunde.liste}}`,
        schema: {
          type: 'object', required: ['text'],
          properties: { text: { type: 'string' }, geaendert: { type: 'array', items: { type: 'string' } } },
        },
      },
      { key: 'nachpruefung', kind: 'lint', title: 'Nachprüfung', source: 'revision' },
      { key: 'ergebnis', kind: 'sammeln', title: 'Zusammenstellen' },
    ],
    notes: 'v3 — Nachprüfung hinter der Revision: der Bericht am Ende beurteilt, was dasteht, nicht den Entwurf davor. v2 — der Fächer steht jetzt vor dem Skelett: jede Fassung baut ihren eigenen Aufbau. In v1 teilten sich alle drei ein Skelett und fingen deshalb mit demselben Satz an.',
  })
}
