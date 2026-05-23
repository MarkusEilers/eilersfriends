/**
 * 8-Schritte-Bauplan für unwiderstehliche B2B-Angebote.
 * Quelle: Schritt-Anatomien v0.1-v0.3 (alle 24.5.2026).
 *
 * Jeder Schritt enthält genug Substanz für eine eigene Wizard-Page —
 * Block 1 (Ziel), Block 9 (Mikro-Transformation in 4 Ebenen), 4-Minute-Mile-Bezug.
 * Block 4 (Markus-Lehre), Block 5 (Struggle), Block 8 (Beispiele) sind absichtlich nicht
 * eingebaut, weil sie Markus' persönliche Validierung mit echten Coaching-Stories brauchen.
 */

export interface BauplanStep {
  number: number
  slug: string
  voiceName: string
  functionalName: string
  theoryAnchor: string
  goal: string             // Block 1: Ziel des Schritts
  contribution: string     // Block 2: Beitrag zum Gesamtergebnis
  importance: string       // Block 3: Bedeutung / warum so wichtig
  microTransformation: {
    feeling: string        // Gefühls-Ebene
    process: string        // Prozess-Ebene
    result: string         // Ergebnis-Ebene
    mile: string           // 4-Minute-Mile-Bezug
  }
}

export const BAUPLAN_STEPS: BauplanStep[] = [
  {
    number: 1,
    slug: 'beef-radar',
    voiceName: 'Beef-Radar',
    functionalName: 'Inhalte → Value → Impact',
    theoryAnchor: 'Hormozi: Dream Outcome × Komponenten + Markus-Layer Wellen-Effekt',
    goal: 'Eine Top-5-Liste der Bausteine deines Angebots — pro Baustein ein direkter Effekt, ein sekundärer Effekt, ein Wellen-Effekt und ein messbarer Impact mit Zahl und Einheit. Plus die Entscheidung: welcher dieser Bausteine ist für deinen Kunden am wichtigsten.',
    contribution: 'Ohne Beef-Radar verkaufst du Features. Mit ihm verkaufst du Outcomes. Das ist der Unterschied zwischen "Wir gucken\'s uns mal an" und "Wo unterschreiben wir?". Alles, was in den Schritten 2-8 noch kommt, steht auf dieser Liste.',
    importance: 'Ein Angebot ohne Beef-Radar klingt nach allen anderen Angeboten in der Inbox deines Kunden. Er kann es nicht unterscheiden, nicht weitererzählen, nicht im Vorstandsraum verteidigen. Das Beef-Radar ist die Substanz, an die der Kunde sich erinnert — und mit der er für dich kämpft, wenn du nicht im Raum bist.',
    microTransformation: {
      feeling: 'Du siehst zum ersten Mal in einer Tabelle, was dein Angebot wirklich tut. Nicht was du anbietest — was es beim Kunden auslöst.',
      process: 'Du hast jetzt eine Methode, mit der du jeden Baustein in Sekunden sortieren kannst: Feature, Effekt, Impact. Du brauchst keinen Marketing-Sparringspartner mehr dafür.',
      result: 'Eine Top-5-Liste mit messbaren Impacts. Pro Baustein eine Zahl. Auf einer Karte. Genau die, die dein Kunde im Vorstand zitieren wird.',
      mile: 'Verkaufen ohne blamieren, hinterherjagen — weil dein Angebot endlich Substanz hat, an die der Kunde sich erinnert.',
    },
  },
  {
    number: 2,
    slug: 'doppelschmerz',
    voiceName: 'Doppelschmerz',
    functionalName: 'Heute & Morgen — Typical Challenges + Future Problems',
    theoryAnchor: 'Markus-Layer (im Hormozi-Stack nicht systematisch) — Pain × zwei Zeit-Ebenen',
    goal: 'Eine Doppel-Liste mit zwei Zeit-Ebenen: Heute gelöst (3-5 aktuelle Schmerzen) + Morgen vorausgesehen (2-3 Probleme, die in 12-24 Monaten sicher kommen). Beides auf einer Seite, mit Brücken pro Schmerz/Problem-Paar.',
    contribution: 'Heute-gelöst macht dein Angebot relevant. Morgen-vorausgesehen macht es strategisch. Ein relevantes Angebot wird gekauft, weil\'s gerade wehtut. Ein strategisches Angebot wird gekauft, weil\'s einen klugen Vorsprung kauft. Strategisch verkauft sich teurer — und länger.',
    importance: 'Die meisten B2B-Angebote lösen nur das Heute. Sie sind reaktive Pflaster. Wenn dein Angebot beide Zeit-Ebenen adressiert, verlängert sich dein Kunde-Halt automatisch. Du verkaufst nicht einmal — du baust eine Strecke. Und auf einer Strecke ist Wechsel teuer.',
    microTransformation: {
      feeling: 'Du hast aufgehört, deinem Kunden Heute-Pflaster zu verkaufen. Du verkaufst ihm jetzt eine Strecke — und Strecken haben einen anderen Preis als Pflaster.',
      process: 'Du kannst dein Angebot in "heute löst" und "morgen verhindert" aufteilen — und beide Seiten als Argumente vor jedem Stakeholder verteidigen. CFO bekommt Heute. CEO bekommt Morgen.',
      result: 'Eine Zwei-Ebenen-Liste, die zeigt: dein Angebot ist nicht reaktiv. Es ist strategisch.',
      mile: 'Kundengewinn ohne technische Fragen — weil du die Schmerzen ansprichst, bevor der Kunde sie in Detail-Tickets übersetzen muss.',
    },
  },
  {
    number: 3,
    slug: 'sichtbarer-pfad',
    voiceName: 'Sichtbarer Pfad',
    functionalName: 'Bulletproof Delivery Plan / Signature Solution',
    theoryAnchor: 'Markus-Layer — Time Delay ↓ + Likelihood ↑ durch sichtbare Methodik',
    goal: 'Eine sichtbare Reise von der schmerzhaften Start-Situation zum gewünschten End-Zustand — als Sequenz von 3 bis 5 benannten Phasen, jede mit 2-3 konkreten "Von X → Zu Y"-Transformationen. Output: visuelles Roadmap-Artefakt (HTML/SVG).',
    contribution: 'Der Sichtbare Pfad verschiebt zwei Hormozi-Dimensionen gleichzeitig: Time Delay (kürzer, weil der Weg sichtbar ist) und Likelihood (höher, weil der Weg verteidigbar ist). Ohne Pfad verkaufst du ein Versprechen. Mit Pfad verkaufst du eine Methodik.',
    importance: 'Sobald dein Kunde den Weg sehen kann, schrumpft die Entscheidung. Er schaut nicht mehr auf den Berg — er schaut auf den ersten Schritt. Das ist nicht Psycho-Trick. Das ist Architektur. Ein Kunde, der den Weg sieht, kann ihn intern verteidigen.',
    microTransformation: {
      feeling: 'Du verkaufst jetzt keine Magie mehr. Du verkaufst einen Weg. Im Pitch musst du nichts mehr verstecken.',
      process: 'Du kannst dein Lieferversprechen in 3-5 Phasen zerlegen, jede mit Input/Output/Dauer, und das Ganze in eine visuelle Roadmap überführen.',
      result: 'Eine sichtbare Roadmap (HTML/SVG), die dein Kunde im Vorstandszimmer aufmachen kann — und die für dich weiterspricht, wenn du nicht im Raum bist.',
      mile: 'Keine Besuche aus reiner Hoffnung — weil dein Kunde den Weg sehen kann.',
    },
  },
  {
    number: 4,
    slug: 'phasen-waehrung',
    voiceName: 'Phasen-Währung',
    functionalName: 'Currencies pro Phase — pro Phase eine messbare Verschiebung',
    theoryAnchor: 'Markus-Layer — KPIs als Glaubwürdigkeit (Likelihood ↑)',
    goal: 'Pro Phase aus Schritt 3 eine Hauptwährung + optional 1-2 Sekundär-Währungen. Jede mit Einheit, Baseline, Ziel-Korridor (Pessimist/Realist/Optimist), Mess-Zeitpunkt.',
    contribution: 'Phasen-Währung verwandelt deinen Sichtbaren Pfad von einer Plan-Vorlage in eine Beweis-Architektur. Jede Phase hat jetzt nicht nur einen Output — sondern eine Zahl, die sich verschiebt. "Wir helfen Ihnen" vs. "In Phase 2 verschieben wir die Annahmequote um 12 Punkte" — der zweite Satz verkauft.',
    importance: 'Drei Effekte: (1) Pricing-Verteidigung — Ergebnisse werden gekauft, Aufwand wird verhandelt. (2) Steering im Lieferprojekt — du weißt in Woche 6, wo nachgesteuert werden muss, nicht erst in Woche 12. (3) Kunden-internes Storytelling — dein Champion kann seinem CFO Zahlen zeigen, nicht "läuft gut".',
    microTransformation: {
      feeling: 'Du redest jetzt nicht mehr von "Steigerung". Du redest von 12 Punkten, 22 Tagen, 8 %. Das fühlt sich anders an im Pitch.',
      process: 'Pro Phase eine Hauptwährung mit Baseline + Drei-Punkt-Korridor + Mess-Zeitpunkt — dein Lieferversprechen in einer Tabelle, die der Kunde mit zum CFO nehmen kann.',
      result: 'Eine Währungs-Tabelle, die jede Phase deines Pfads mit einer Zahl unterlegt. Dein Angebot ist kein Versprechen mehr — es ist ein gemessener Korridor.',
      mile: '200 % der Ziele erreicht — nicht weil mehr gearbeitet. Weil Messbarkeit schlägt Aufwand.',
    },
  },
  {
    number: 5,
    slug: 'beweis-stapel',
    voiceName: 'Beweis-Stapel',
    functionalName: 'ROI-Hypothesen oder Beweise — Customer-Zahlen + Hypothesen mit Methodik',
    theoryAnchor: 'Hormozi — Dream Outcome quantifiziert',
    goal: '3 bis 7 Beweise, klar getrennt: Belegt (Zahl + Quelle + Bedingung) und Hypothese (Zahl + Methodik + Vergleichs-Anker). Beide verteidigbar — auch im Vorstand und vor dem CFO.',
    contribution: 'Phasen-Währung sagt "wir messen X". Beweis-Stapel sagt "Bei vergleichbaren Kunden lag X bei Y — und so haben wir gerechnet." Das ist der Übergang von "wir versprechen" zu "wir haben".',
    importance: 'Belegte Zahlen schlagen Versprechen — immer. Hypothesen sind erlaubt, wenn sie methodisch sauber sind. "Spart bis zu 22.500 €/Jahr" ist keine Marketing-Lautstärke, wenn du erklären kannst: 3 FTE × 4h/Wo × 47 Wochen × Stundensatz = Y. Vor dem Vorstand zählt Verteidigbarkeit, nicht Lautstärke.',
    microTransformation: {
      feeling: 'Du hast aufgehört, im Pitch nervös zu werden, wenn jemand "Zahlen?" fragt. Du hast die Tabelle. Mit Quellen. Mit Range. Mit Methodik.',
      process: 'Pro Behauptung eine Beweis-Klasse (A: Named Customer · B: Customer-Avg · C: Hypothese mit Methodik · D: Branchen-Benchmark · E: Quote) — mindestens 2 aus A/B im Top-3.',
      result: 'Ein Beweis-Stapel mit 3-7 verteidigbaren Zahlen, getrennt nach "belegt" und "Hypothese", mit Quelle, Bedingung, Verteidigungs-Satz. Vorstand-tauglich.',
      mile: 'Stabil über 6-stellig verdienen — weil Beweise Preise verteidigbar machen.',
    },
  },
  {
    number: 6,
    slug: 'booster',
    voiceName: 'Booster',
    functionalName: 'Bonus — angrenzendes Problem, ohne die Marge zu fressen',
    theoryAnchor: 'Hormozi — Value-Stack-Erweiterung',
    goal: '1 bis 3 Booster mit Adjacent Pain, konkretem Inhalt, wahrgenommenem Wert (€-Anker), echtem Lieferaufwand. Margin-Schutz: Aufwand ≤ 15-20 % des wahrgenommenen Werts.',
    contribution: 'Der Booster ist der Kipp-Punkt im Pitch. Wenn dein Hauptangebot sauber konstruiert ist, liefert der Booster den Push über die Entscheidungs-Schwelle — ohne Rabatt, ohne Preis-Diskussion, ohne Margin-Verlust.',
    importance: 'Vier Effekte: (1) Pricing-Schutz — verhindert Rabatt-Forderungen. (2) Wahrnehmungs-Hebel — Hauptangebot wirkt günstiger. (3) Margin-Schutz — Templates, Playbooks, Office-Hours skalieren mit Null-Grenz-Aufwand. (4) Geschichten-Funktion — ein konkreter Booster mit Namen wird intern weitererzählt.',
    microTransformation: {
      feeling: 'Du gibst keinen Rabatt mehr, wenn jemand "geht da nicht was am Preis?" fragt. Du gibst Wert. Mit Anker. Mit Namen.',
      process: '1-3 Booster mit Adjacent Pain, €-Anker, echtem Aufwand, Margin-Schutz — und Aktivierungs-Moment im Sales-Prozess (Pre-Sales · Im-Pitch · Bei-Einwand · Bei-Closing).',
      result: 'Ein Wert-Stack mit konkreten Boostern, der dein Hauptangebot um 30-150 % im wahrgenommenen Wert hochzieht — bei echtem Lieferaufwand ≤ 20 %.',
      mile: '5 Kunden in einer Woche gewinnen — weil Booster Entscheidungen kippen.',
    },
  },
  {
    number: 7,
    slug: 'wort-garantie',
    voiceName: 'Wort-Garantie',
    functionalName: 'Verteidigbare Garantie — die du beim Espresso aussprechen kannst',
    theoryAnchor: 'Hormozi — Effort/Sacrifice ↓ (Risiko-Umkehr)',
    goal: 'Eine Garantie (gelegentlich zwei) mit Typ + Trigger-Bedingung + Konsequenz + Liefer-Anker (Phase aus Schritt 3 + Währung aus Schritt 4) + Espresso-Test bestanden.',
    contribution: 'Die Wort-Garantie ist die Risiko-Umkehr im Hormozi-Sinn — aber bei dir mit einem Voice-Spin: keine Marketing-Garantie, sondern eine, die dein Lieferversprechen aus Schritt 3+4 strukturell trägt. Sie funktioniert nicht, weil sie laut ist. Sie funktioniert, weil dein Kunde merkt: Der meint das ernst.',
    importance: 'Drei Wahrheiten: (1) Garantien wirken nur, wenn die Lieferkapazität dahinter steht. (2) Die beste Garantie ist die, die du selber glaubst. (3) Garantien öffnen Türen — CFOs, Procurement, neue Stakeholder suchen alle Risiko-Reduktion. "Love it or Leave it" ist ein Marketing-Schwur. Eine Wort-Garantie ist ein Verkäufer-Versprechen.',
    microTransformation: {
      feeling: 'Du sprichst deine Garantie nicht mehr nervös aus. Du sprichst sie aus wie ein Versprechen, das du weißt halten zu können — weil dein Pfad sie trägt.',
      process: '1-2 Garantien mit typ-sauberen Triggern (KPI + Datum) und Konsequenzen (konkreter Lieferplan, kein "dann sprechen wir nochmal"), an Phasen und Währungen geankert.',
      result: 'Eine verteidigbare Wort-Garantie, die im Pitch wie ein selbstverständliches Versprechen klingt — nicht wie ein Marketing-Schwur.',
      mile: 'Kunden, die ihre Worte halten — weil deine Wort-Garantie zeigt, dass du selber deine Worte hältst.',
    },
  },
  {
    number: 8,
    slug: 'die-letzten-20-prozent',
    voiceName: 'Die letzten 20 %',
    functionalName: 'Verpackung — Name + Headline + CTA',
    theoryAnchor: 'Hormozi — Pricing-Psych + Packaging',
    goal: 'Drei Mikro-Entscheidungen: Name (wie der Kunde es erinnert und weitererzählt), Headline (was es ist, in einem Satz — User-Outcome-fokussiert), CTA (nächster Mikro-Schritt, nicht Makro-Sales-Cycle).',
    contribution: 'Die letzten 20 % tragen oft 50 % der Wirkung. Ohne guten Namen nicht im Slack-Chat weitererzählbar. Ohne klare Headline kommt der Champion im Vorstand nicht über den ersten Satz hinaus. Ohne präzisen CTA ist der nächste Mikro-Schritt nicht offensichtlich — und Reibung tötet Conversion.',
    importance: 'Die meisten B2B-Anbieter machen die letzten 20 % zuerst — und bauen dann das Angebot um den Namen. Falsche Reihenfolge. Wir bauen erst das Angebot. Dann den Namen, der genau das beschreibt, was wir gebaut haben.',
    microTransformation: {
      feeling: 'Dein Angebot hat jetzt einen Namen, der hängt. Eine Headline, die in 3 Sekunden verstanden wird. Einen CTA, der den nächsten Schritt selbsterklärend macht. Es fühlt sich nach eigenem Produkt an, nicht mehr nach Berater-Standard.',
      process: 'Naming-Patterns durchgespielt (Verben · Zustand · Metapher · Voice-Spin · "Für Branche X"), Headline durchs User-Outcome-Gate, CTA als Mikro-Schritt — alle drei dem Espresso-Test ausgesetzt (Slack · Espresso · Google · Domain · 3-Jahre).',
      result: 'Drei freigegebene Mikro-Entscheidungen (Name + Headline + CTA), die deinen kompletten 8-Schritte-Substanz-Stapel lesbar und teilbar machen.',
      mile: 'Keine Rabatte vergeben — weil ein Angebot mit klarem Namen, Headline, CTA und Substanz dahinter keine Rabatt-Reflexe mehr auslöst.',
    },
  },
]
