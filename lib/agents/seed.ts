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

/* ─────────────────────────── Wissen aus dem Handoff ─────────────────────────── */

/**
 * Die Pakete aus dem Celero-Handoff.
 *
 * Das Dokument ist die genauere Quelle als alles, was wir vorher hatten: zwoelf
 * Muster statt neun, die Verbotsliste mit „aber" an erster Stelle, und der
 * Struktur-Slop, den keine Wortliste faengt. Es ersetzt die Startbestueckung
 * unter denselben Schluesseln.
 */
export async function seedHandoffKnowledge() {
  await upsertPack({
    key: 'voice.markus', kind: 'voice', name: 'Voice-Charta · 12 Patterns',
    description:
      'Mindestens fünf Patterns sind aktiv, mindestens drei Mini-Sätze. Bei Konflikt zwischen einer allgemeinen Schreibregel und diesem Profil gewinnt dieses Profil.',
    replace: true,
    items: [
      { title: 'Die Regel, die zuerst gilt', weight: 100, body:
        'Curiosity statt Verdikt. Eine Beobachtung teilen, keine Wahrheit verkünden. Der Anker eines Absatzes ist eine Frage, nicht ein Merksatz.\n\nSo klingt ein Anker: „Kommt wirklich etwas heraus, wenn Du einen erfahrenen Sales Coach vier Wochen mit AI spielen lässt?" · „Spürt ihr da einen Impuls in Euch?" · „Was wünschen sich Strategen zum Jahresende?"\n\nSo klingt er nicht: „Ein Plan ist erst ein Plan, wenn draußen jemand Ja gesagt hat." · „Zuteilung ist keine Zusage." Jeder Satz, der wie ein Poster an der Wand funktioniert, ist hier falsch.\n\nMerksätze behaupten. Fragen laden ein. Der Leser soll denken, nicht nicken.' },
      { title: 'Die zwölf Patterns', weight: 95, body:
        '1 Curiosity statt Verdikt — Beobachtung, kein Urteil.\n2 Selbst rein, nicht über — eigene Unsicherheit als Eintritt.\n3 Wit über die Branche — Pointe zielt aufs System oder auf sich selbst, nie auf den Leser.\n4 Spüren, nicht überzeugen — eine Stelle anbieten, an der der Leser sich erkennt.\n5 Szene als Geschenk — konkrete Szene erzählen, nicht als Beweis.\n6 Future als Einladung — was-wäre-wenn, nie was-wenn-nicht.\n7 Warmes CTA — die Frage, die man beim Espresso stellen würde.\n8 Pseudo-Drama-Hook — selbstironisch übertrieben, höchstens einmal.\n9 Frage-Antwort-Selbstdialog — Frage stellen, kurz selbst beantworten.\n10 Mantra-Refrain — ein Kernsatz kehrt wieder.\n11 Mini-Satz-Rhythmus — mindestens drei Sätze mit ein bis vier Wörtern, sie tragen die Pointen.\n12 Coaching-Du — Du für Handlung, Wir für Diagnose.' },
      { title: 'Klang', weight: 90, body:
        'Dicht: Jeder Satz verdient seine Miete. Adverbien sind verdächtig, Adjektive zahlen Miete, drei Adjektive in Reihe sind verboten. Lange Sätze atmen, kurze schlagen.\n\nEmpathie heißt: den Schmerz präziser benennen, als der Leser es selbst könnte. Nicht „ich weiß, wie sich das anfühlt", nicht „Du musst endlich".\n\nKonkret: Zahlen, Namen, Szenen. Kein Framework-Vokabular im Text — ICP, Awareness-Stage, Pain-Point-Matrix bleiben intern.\n\nRisiko: Mindestens eine Stelle, der nicht jeder zustimmen würde. Ein universell unterschreibbarer Text ist Generik.' },
      { title: 'Woran man diese Stimme erkennt', weight: 88, body:
        'Er nimmt den Einwand vorweg, oft im ersten Satz, oft als Zitat des Skeptikers. „Noch ein Webcast?" steht da, bevor es jemand denken kann.\n\nBilder statt Begriffe. Der Stürmer mit dem Handbuch. Die Elfmeter. Der äußere Rand der Organisation. Er erklärt nicht „Last Mile", er zeigt sie.\n\nSelbstironie ohne Anbiederung — über die eigene Zunft, nie über den Leser.\n\nKein Vertriebsvokabular. Wenn ein Produkt vorkommt, heißt es beim Namen: Dynamics, SharePoint, Azure.\n\nAufzählungen kommen als Fließtext, nicht als Bulletpoints. Ausdrücklich gewünscht.' },
      { title: 'Selbstprüfung vor Auslieferung', weight: 85, body:
        'Steht mindestens eine konkrete Beobachtung, Zahl, Szene im Text? Gibt es einen Satz, den man ohne Verlust streichen könnte — dann streichen. Beschreibt der Text den Schmerz präzise, ohne vorzuschreiben? Steht irgendwo etwas, dem nicht jeder zustimmen würde? Schärft der Witz die Idee, oder zieht er ab? Kein Wort aus der Verbotsliste? Höchstens ein Ausrufezeichen pro 500 Wörter, keine drei Adjektive in Reihe? Klingt es nach Markus — oder nach irgendeinem Sales-Coach? Würde man den Text jemandem schicken, den man respektiert, ohne sich zu entschuldigen? Sind mindestens fünf der zwölf Patterns aktiv, mindestens drei Mini-Sätze? Ist jeder Claim belegt oder als offene Frage markiert?' },
    ],
  })

  await upsertPack({
    key: 'verbote', kind: 'verbote', name: 'Harte Verbote',
    description: 'Der Linter prüft, was sich prüfen lässt. Der Rest steht hier, weil es trotzdem gilt.',
    replace: true,
    items: [
      { title: '„aber" als Konjunktion', weight: 100, body:
        '„aber" hebelt den eigenen Satz aus. Ersatz: ein Punkt, oder eine neue Beobachtung.' },
      ...['Mehrwert', 'ganzheitlich', 'auf Augenhöhe', 'Mindset', 'game-changer', 'Bausteine', 'DNA',
          'auf Steroide', 'letztendlich', 'optimieren', 'seamless', 'next level', 'Hot take',
          'Spoiler', 'Plot twist', 'echt', 'Seat', 'Cohort']
        .map((w) => ({ key: 'wort', body: w, tags: ['wort'], weight: 60 })),
      { title: 'Floskeln', weight: 90, body:
        '„mal ganz ehrlich" · „Du kennst das…" · „Stimmst du zu?" · Drohformeln jeder Art. Dazu „nachhaltig" außerhalb des Klimakontexts und „tragen/trägt" ohne Bild.' },
      { title: 'Zeichensetzung', weight: 80, body:
        'Maximal ein Ausrufezeichen pro 500 Wörter. Kein ALLCAPS zur Betonung.' },
      { title: 'Anti-Patterns', weight: 85, body:
        'Drohrhetorik („wer wartet, holt nicht auf"), Hype („explosive Ergebnisse"), Plakat-Headlines in Versalien, Gotcha-Schlüsse, die den Leser in die schlechte Gruppe sortieren, Comment-Bait, Virtue-Signalling ohne Beleg.' },
    ],
  })

  await upsertPack({
    key: 'slop', kind: 'methode', name: 'Struktur-Slop — acht Muster',
    description:
      'Test für alle acht: Satz streichen. Verschwindet eine Information, die der Leser braucht? Nein → es war Slop.',
    replace: true,
    items: [
      { weight: 95, body:
        '1 Fake-Contradiction — „nicht X, sondern Y", wo niemand X behauptet hat.\n2 Abwesenheit als Nutzen — „Es gab keinen QR-Code und keine App".\n3 Leerer Modifikator — „drei Antworten, die halten".\n4 Aphorismus als Absatz-Schluss — klingt nach Pointe, ist Buchstabensalat.\n5 Sichtbares Gerüst — „Was auf den nächsten Seiten steht", „Drei Dinge, in dieser Reihenfolge".\n6 Meta über das Dokument — „Gib es gern weiter", „Hier ist das Wichtigste in Kürze".\n7 Unbelegte Branchenbehauptung über die Arbeit des Lesers.\n8 Neutralitäts-Signalling — „wir sind herstellerneutral".' },
    ],
  })

  await upsertPack({
    key: 'beispiele.markus', kind: 'beispiele', name: 'Klangmaßstab',
    description: 'Von ihm geschrieben und freigegeben. Satzbau, Rhythmus und Haltung übernehmen — die Inhalte nicht.',
    replace: true,
    items: [
      { title: 'Aus der Einladung zum Juli-Webcast', isGold: true, weight: 95, body:
        '„Noch ein Webcast?" „Während der WM?" „Wird sicher wieder so eine Demo …"\n\nDas macht ja nur Sinn, wenn es mbuf Mitglieder gibt, die sich von Ihrem Microsoft Technologie-Investment noch mehr Wirkung erhoffen und dafür auch während der WM bezahlen.' },
      { title: 'Aus dem Abstract zum Juli-Webcast', isGold: true, weight: 95, body:
        'Und genau dort endet die digitale Versorgung häufig bei einem PDF und einem Chat-Kanal. Wir schicken dem Stürmer sprichwörtlich das „Handbuch Elfmeter" und vertrauen darauf, dass es funktioniert. In der Praxis braucht der Mitarbeiter etwas anderes.' },
      { title: 'Aus dem Abstract zum September-Webcast', isGold: true, weight: 95, body:
        'Black-Friday-Umbauten, Wartungswellen, Rollouts: Was im November draußen passiert — im Handel, in der Produktion, im Service —, entscheidet sich in den nächsten Wochen an Deiner Plantafel. Und die ist ein super Werkzeug — mit zwei Schwächen: Sie redet in eine Richtung. Und sie ist zu lange optimistisch. Sie zeigt Plan A als wahr, bis die Realität längst abgebogen ist.' },
    ],
  })
}

/* ─────────────────────────── Agent 2 · Langform ─────────────────────────── */

const LANG_BASE = `Du schreibst fuer Eilers+Friends.

{{wissen}}

Drei Dinge, die ueber allem stehen:

SUBSTANZ WOERTLICH, FORMULIERUNG FREI. Zahlen, Beispiele, Eigennamen und Verfahren bleiben exakt wie im Material. Die Saetze werden neu gebaut. Nichts dazuerfinden — keine Zahl, keine Studie, kein Zitat, kein Beispiel. Fehlt etwas, wird es als offene Frage benannt.

DU FRAGST NICHT ZURUECK. Fehlt eine Angabe, triffst Du eine Annahme und legst sie offen.

DIE LAENGE IST VERBINDLICH. Sie ist keine Obergrenze, sondern ein Auftrag. Laenge entsteht durch Vertiefung: mehr Szene, mehr Konkretion, mehr Gegenrechnung. Nie durch Wiederholung desselben Gedankens.`

export async function seedLongformAgent() {
  return publishAgent({
    key: 'longform-writer',
    title: 'Langform-Writer',
    description:
      'Für Nachbereitungen, Reports und Magazintexte ab 800 Wörtern. Baut Überzeugungsziele und Gliederung mit Wortbudget, schreibt dann Abschnitt für Abschnitt und legt nach, wo ein Abschnitt zu kurz bleibt.',
    knowledge: ['voice.markus', 'verbote', 'slop', 'methode.belief', 'beispiele.markus', 'kanal'],
    scopes: ['agents:run'],
    default_model_role: 'copy',
    input_schema: {
      type: 'object',
      required: ['inhalte'],
      properties: {
        audience: { type: 'string' },
        context_md: { type: 'string', description: 'Der Handoff: Auftrag, Zahlen mit Herkunft, Reaktionen, Quellmaterial' },
        inhalte: { type: 'string', description: 'Das Ausgangsmaterial, aus dem der Text entsteht' },
        tonalitaet: { type: 'string' },
        ueberzeugungsziel: { type: 'string' },
        textart: { type: 'string', enum: ['report', 'blog', 'nachbereitung', 'whitepaper'] },
        laenge: {
          type: 'object',
          properties: { wert: { type: 'number' }, einheit: { type: 'string', enum: ['woerter', 'seiten'] } },
        },
        ansprache: { type: 'string', enum: ['du', 'ihr', 'sie'] },
        recherche: { type: 'boolean' },
      },
    },
    output_schema: {
      type: 'object',
      properties: {
        varianten: { type: 'array', items: { type: 'object' } },
        annahmen: { type: 'array', items: { type: 'string' } },
        pruefung: { type: 'object' },
      },
    },
    steps: [
      { key: 'aufnahme', kind: 'intake', title: 'Eingaben ordnen' },
      { key: 'kontext', kind: 'kontext', title: 'Wissen laden' },
      { key: 'recherche', kind: 'recherche', title: 'Nachsehen', onlyIf: 'recherche', optional: true },
      {
        key: 'kette', kind: 'modell', title: 'Überzeugungsziele', temperature: 0.4, maxTokens: 2500,
        system: `${LANG_BASE}

Du baust die Ueberzeugungsziele. Noch keinen Text, noch keine Gliederung.

Drei bis fuenf Ziele in aufbauender Reihenfolge. Je Ziel: Was denkt der Leser heute? Was danach? Welcher Beleg aus dem Material traegt den Sprung? Welcher Widerstand kommt, und was entkraeftet ihn?

Nenne am Ende die Luecken: Was wird behauptet, ohne belegt zu sein, und was fragt ein skeptischer Leser, worauf das Material keine Antwort hat?`,
        user: `Zielgruppe: {{aufnahme.audience}}
Auftrag: {{aufnahme.ueberzeugungsziel}}

Handoff und Regeln:
{{material}}

Material:
{{aufnahme.inhalte}}

Recherche:
{{recherche.material}}`,
        schema: {
          type: 'object', required: ['ziele'],
          properties: {
            kernaussage: { type: 'string', description: 'Der ganze Text in einem Satz' },
            ziele: {
              type: 'array',
              items: {
                type: 'object', required: ['heute', 'danach', 'beleg'],
                properties: {
                  heute: { type: 'string' }, danach: { type: 'string' },
                  beleg: { type: 'string' }, widerstand: { type: 'string' }, entkraeftung: { type: 'string' },
                },
              },
            },
            luecken: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      {
        key: 'struktur', kind: 'modell', title: 'Gliederung mit Budget', temperature: 0.4, maxTokens: 3000,
        system: `${LANG_BASE}

Du baust die Gliederung. Noch keinen Fliesstext.

Je Abschnitt: Ueberschrift, welches Ueberzeugungsziel er traegt, welcher Beleg aus dem Material ihn stuetzt, die Beats, und ein Wortbudget. Die Summe der Budgets ergibt exakt die Zielgroesse.

Je Abschnitt gehoert ein Hook — eine Frage oder eine Szene, keine Absichtserklaerung — und ein surprising insight. Ein Abschnitt ohne surprising insight wird gestrichen.

Rechne mit sechs bis zehn Abschnitten. Ein Abschnitt unter 120 Woertern traegt keinen eigenen Gedanken, einer ueber 260 zerfaellt.

Nenne zwei Stellen, an denen Du von der Reihenfolge des Materials abweichst, und warum.`,
        user: `Zielgroesse: {{aufnahme.ziel_woerter}} Woerter — verbindlich, die Summe der Budgets muss sie ergeben.
Textart: {{aufnahme.textart}}

Die Ueberzeugungsziele:
{{kette.ziele}}

Kernaussage: {{kette.kernaussage}}

Material:
{{aufnahme.inhalte}}`,
        schema: {
          type: 'object', required: ['abschnitte'],
          properties: {
            titel_vorschlag: { type: 'string' },
            abweichungen: { type: 'array', items: { type: 'string' } },
            abschnitte: {
              type: 'array',
              items: {
                type: 'object', required: ['name', 'woerter', 'beats'],
                properties: {
                  name: { type: 'string' }, ziel: { type: 'string' },
                  hook: { type: 'string' }, insight: { type: 'string' },
                  beats: { type: 'array', items: { type: 'string' } },
                  beleg: { type: 'string' }, woerter: { type: 'number' },
                },
              },
            },
          },
        },
      },
      {
        key: 'text', kind: 'sektionen', title: 'Abschnitt für Abschnitt',
        sections: 'struktur', minRatio: 0.85, temperature: 0.7, maxTokens: 2000,
        system: `Du schreibst fuer Eilers+Friends.

{{wissen_kurz}}

SUBSTANZ WOERTLICH, FORMULIERUNG FREI. Zahlen, Beispiele, Eigennamen und Verfahren bleiben exakt wie im Material. Nichts dazuerfinden.

Du schreibst genau einen Abschnitt. Nicht den ganzen Text.

Dein Budget steht unten und ist verbindlich. Ein Abschnitt, der zu kurz geraet, wird zurueckgeschickt — und dann musst Du ihn ausbauen, statt ihn einmal richtig zu schreiben.

Der Abschnitt beginnt mit seinem Hook und endet so, dass der naechste anschliessen kann. Keine Ueberschrift im Text, keine Aufzaehlungszeichen — Aufzaehlungen kommen als Fliesstext.

Wenn unter "ausbauen" etwas steht, ist Deine vorige Fassung zu kurz gewesen. Dann schreibst Du den Abschnitt neu und tiefer, nicht laenger geredet.`,
        user: `Abschnitt: {{abschnitt.name}}
Budget: {{abschnitt.budget}} Woerter
Hook: {{abschnitt.hook}}
Surprising insight: {{abschnitt.insight}}
Beats: {{abschnitt.beats}}
Beleg aus dem Material: {{abschnitt.beleg}}

So endete der vorige Abschnitt:
{{vorher.schluss}}

Ansprache: {{aufnahme.ansprache}}
Tonalitaet: {{aufnahme.tonalitaet}}

Material, aus dem alles stammen muss:
{{aufnahme.inhalte}}

{{ausbauen.auftrag}}
{{ausbauen.bisher}}`,
        schema: {
          type: 'object', required: ['text'],
          properties: { text: { type: 'string' }, patterns: { type: 'array', items: { type: 'string' } } },
        },
      },
      { key: 'pruefung', kind: 'lint', title: 'Prüfung', source: 'text' },
      {
        key: 'revision', kind: 'revision', title: 'Revision', temperature: 0.4, maxTokens: 6000,
        source: 'text', reports: 'pruefung',
        system: `${LANG_BASE}

Du behebst ausschliesslich die genannten Befunde. Nichts anderes.

Der Text hat eine Laenge, die stimmt. Wer beim Beheben kuerzt, macht es schlimmer: Ein Befund wird behoben und drei neue entstehen, weil der Text seine Szenen verliert.`,
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
    notes:
      'v1 — schreibt Abschnitt fuer Abschnitt mit eigenem Wortbudget und legt einmal nach, wo ein Abschnitt unter 85 Prozent bleibt. Ein einzelner Aufruf um 1.500 Woerter liefert verlaesslich 400.',
  })
}
