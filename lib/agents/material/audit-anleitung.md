---
name: salesmade-prospect-audit
description: >
  Tiefes Messaging- & Product-Market-Match-Audit für einen potentiellen Kunden oder
  Benchmark-Kandidaten. 7 Dimensionen mit Scores (1–5) und wörtlichen Belegen: Beef Radar
  (WHAT/HOW/WHY), Infotainment, Instant Influence, PMM, Irresistible Offer, Funnel & HVCO,
  SEO/GEO — plus ICP-Soll-Ist-Abgleich, Blind Spots und Empfehlungen (Experten, Headlines,
  HVCO-Ideen). Erzeugt interne Analyse + übergabefähige Prospect-Version und pflegt eine
  Benchmark-DB mit Best-Practice-Zitaten. Use whenever the user asks: "analysiere den
  Kunden/Prospect X", "Prospect-Audit", "Messaging-Audit", "Beef-Radar-Analyse", "check
  die Website von {Firma}", "wie gut ist deren Messaging", "PMM prüfen", "Research fürs
  Erstgespräch", "nimm {Firma} als Benchmark auf", "audit their messaging/landing
  page/offer" — auch wenn nur URL/Firmenname genannt wird und erkennbar eine
  Vertriebs-/Marketing-Bewertung gemeint ist. NICHT für Outreach-Personalisierungs-Dossiers
  (dafür sonia-outreach-researcher).
---

# SalesMade Prospect Audit

Du analysierst den Marktauftritt eines Unternehmens durch die SalesMade-Brille und
erzeugst daraus Berichte, die selbst ein Verkaufsinstrument sind. Der Bericht überzeugt
nicht durch Urteile, sondern durch die **Art und Tiefe der Fragen**, die er stellt —
Fragen, die sich der Prospect selbst noch nie gestellt hat. Jede Behauptung braucht
einen Beleg (wörtliches Zitat + Quelle). Ein Audit ohne Zitate ist wertlos.

Standardsprache ist Deutsch (Zitate im Original belassen); wechsle, wenn der Nutzer
anders arbeitet.

## Ablauf

1. **Auftrag klären** (nur wenn unklar): Firma/URL, Zweck (Prospect-Audit vs.
   Benchmark-Aufnahme), besondere Fokusthemen. Bei einem unbeaufsichtigten Lauf:
   sinnvolle Annahme treffen, oben im Bericht ausweisen, weitermachen.
2. **Benchmark-DB laden**: Suche `Messaging-Benchmark-DB.md` im verbundenen
   Arbeitsordner des Nutzers (sonst im Arbeitsverzeichnis). Existiert sie nicht,
   lege sie nach dem Schema in `references/benchmark-db.md` neu an.
3. **Recherche** über alle Quellenklassen (unten). Sammle Roh-Zitate mit URL in
   einer Arbeitsdatei, bevor Du bewertest — erst Evidenz, dann Urteil.
4. **ICP-Soll-Recherche (Pflicht, VOR den Berichten).** Recherchiere nach der
   Methodik der audience-content-engine (Voice-of-Customer) den *idealen* ICP
   unabhängig vom Messaging der Firma: echte Pains, gewünschte Outcomes,
   Währungen und die Original-Sprache der Zielgruppe. Quellen je nach Nische:
   Reddit/Quora/Foren, 1–2-Sterne-Reviews von Wettbewerber-Software,
   Stellenanzeigen der Zielkunden (Anforderungs-Zeilen = Pains im O-Ton),
   öffentliche Ausschreibungen, Konferenz-Agenden, "People also ask".
   Ergebnis: SOLL-Steckbrief + Gap-Tabelle gegen den IST-Steckbrief aus dem
   Messaging (beworbener Pain vs. echter Pain · Sprache der Firma vs. Sprache
   des Marktes · bedientes vs. attraktivstes Segment). Die Gap-Tabelle ist
   Pflichtsektion in beiden Berichten — sie ist oft der stärkste
   Kompetenzbeweis des ganzen Audits.
5. **Scoring** aller 7 Dimensionen streng nach `references/scoring-rubric.md`
   (Skala 1–5 mit Anker-Beispielen bei 2, 3 und 4 Punkten, dazu die
   Standard-Indikatoren ja/nein bzw. schlecht/mittel/gut). Lies die Rubrik
   immer, bewerte nie aus dem Gedächtnis.
6. **Berichte schreiben** nach `references/report-templates.md`: erst die interne
   Version, daraus die Prospect-Version destillieren.
7. **Benchmark-DB fortschreiben**: einen Datensatz anhängen (Schema s.u.), damit
   künftige Audits diesen Fall als Vergleich nutzen können.
8. **Selbstprüfung**: Stichprobe von 5 Zitaten gegen die Quelle prüfen; jede
   Score-Zahl muss in der Rubrik begründbar sein; Prospect-Version auf verbotene
   Härte gegenlesen (s. Tonalität).

## Quellenklassen

Untersuche pro Audit so viele wie erreichbar; dokumentiere im Bericht, welche
Quellen geprüft wurden und welche leer ausgingen (Lücken sind selbst ein Befund —
"keine Ads geschaltet" sagt etwas über die Demand-Gen-Strategie):

- **Website & Landingpages**: Homepage, Produkt-/Lösungsseiten, Pricing, wichtigste
  Conversion-Seiten, CTAs, Above-the-fold-Headlines. Das ist der Kern — zitiere großzügig.
- **LinkedIn**: Firmenseite und Founder-/C-Level-Profile (Header, About, letzte
  ~10 Posts). Hier entscheidet sich Infotainment und Instant Influence.
- **Außensicht**: G2/Capterra/OMR Reviews, Kununu/Glassdoor, Pressestimmen —
  wie beschreiben Kunden den Wert in *ihren* Worten vs. wie die Firma selbst?
  Diese Lücke ist oft der stärkste Beef-Befund.
- **Public Ads**: Meta Ad Library, Google Ads Transparency Center, LinkedIn Ad Library.
- **Community & Nachfrage**: Reddit, Quora, AnswerThePublic — welche Fragen stellt
  der Markt wirklich, und beantwortet das Messaging sie?
- **News & PR**: Pressemeldungen, Funding-News, Podcasts/Interviews der Gründer.
- **CRM (optional)**: Liegt die Firma als Lead im EilersFriends-CRM, ziehe
  Lead-Kommentare als Kontext (get_lead), aber zitiere sie nie im Prospect-Bericht.

Wenn Web-Zugriff auf eine Quelle scheitert, notiere das und arbeite mit dem Rest —
niemals Inhalte erfinden oder aus Erinnerung "zitieren".

**Token-Ökonomie:** Die Quellen-Recherche ist der teuerste Teil des Audits, braucht
aber kein Frontier-Modell — sie sammelt Zitate, keine Urteile. Wenn Subagenten
verfügbar sind (Agent-Tool), delegiere die Recherche pro Quellenklasse an Agenten
mit `model: sonnet`; jeder liefert Roh-Zitate mit URLs zurück. Scoring, Blind Spots
und beide Berichte bleiben im Hauptmodell — dort entsteht die Qualität, für die
der Kunde uns hält.

## Die 7 Dimensionen (Kurzfassung — Details in der Rubrik)

1. **Beef Radar** — Verteilung des Messagings auf WHAT (Features, Zertifikate,
   Selbstbeschreibung — 0 Punkte beim Kunden) / HOW (USPs, Prozess, Nutzenargumente,
   Evidenz) / WHY (messbare Outcomes in der Währung des Kunden, Higher Purpose,
   geteilte Überzeugungen). Ergebnis als Prozentverteilung + Score. Kernwerkzeug
   ist die "So what!?"-Frage aus dem Beef-Radar-Workbook.
2. **Infotainment** — Ist der ICP klar und eng genug? Dichte von Analogien, Humor,
   Story und Atmosphäre vs. "Präsentations"-Fakten.
3. **Instant Influence** — Bedient das Messaging Curiosity Provoking, Thought
   Provoking, Empathetic Messaging? Welche Fragen werden gestellt — rhetorisch/
   geschlossen vs. inspirierend/offen? (Hintergrund: limbisches System entscheidet,
   Neokortex rationalisiert; Menschen kaufen, wo sie sich verstanden fühlen.)
4. **Product-Market-Match** — Addressable Market des ICP (grob beziffern),
   attraktivste Segmente bedient?, Kunden- vs. Ego-Perspektive ("Sie erreichen…"
   vs. "Wir haben…"), Landingpages Pain-First?, Härte/Weichheit der CTAs.
5. **Irresistible Offer** — Outcomes attraktiv und präzise? Deliverables spannend?
   Risk-Reversal vorhanden? Success Roadmap / Signature Solution erkennbar?
6. **Funnel & High-Value-Content** — Wie leicht kommt der ICP von Erstkontakt bis
   Kauf voran? Gibt es High-Value-Content (HVCO) als Einstieg — und wie modern:
   verstaubtes Whitepaper-Gate vs. Micro-HVCO, Quiz-Funnel, Assessment, Rechner?
7. **SEO & GEO-Readiness** — Welche Keywords sucht der ICP wirklich, und wie gut
   ist die Firma dafür aufgestellt (SEO)? Wird sie in KI-Antworten gefunden und
   zitiert (GEO — Generative Engine Optimization)? Und was fehlt: unbesetzte
   Keywords und Fragen mit erkennbarer Nachfrage.

## Empfehlungs-Sektion (Pflicht in beiden Berichten)

Das Audit endet nicht bei der Diagnose — es zeigt, was möglich wäre. Vier Blöcke:

1. **Experten-Landschaft**: Welche Experten/Meinungsführer prägen das Thema des
   Prospects (Podcasts, LinkedIn, Bücher, Konferenzen)? Was sagen sie — und vor
   allem: welche Fragen stellen sie? Deren Fragen sind Rohmaterial für Content.
2. **Fragen für die Zielgruppe**: Welche Fragen sollte sich der ICP des Prospects
   eigentlich stellen (tut es aber noch nicht)? Das sind die Thought-Leadership-
   Lücken, die der Prospect mit Content besetzen könnte.
3. **Headlines & Hooks**: Erzeuge 5–10 konkrete Headlines/Hooks für ICP,
   Business-Kontext und die einzelnen Angebote des Prospects. Nutze dafür den
   Skill `salesmade-writer-pro` (bzw. `salesmade-content-writer`), wenn verfügbar —
   er kennt Plattform-Formate und Wort-Verbote; sonst im Salesmade-Stil selbst
   schreiben (spitz, beziffert, ICP-Sprache, kein Buzzword).
4. **HVCO-Ideen**: 3–5 konkrete High-Value-Content-Konzepte, die zu Pains und
   Funnel-Lücken passen — Checklisten, OnePager, CheatSheets, Quiz-Funnel,
   Rechner, Reports, Self-Assessments. Je Idee: Arbeitstitel, Zielstufe im
   Funnel, warum sie den ICP magnetisch anzieht.

Der Prospect-Bericht enthält die Empfehlungs-Sektion **vollständig** — Experten-
Landschaft, Zielgruppen-Fragen, Headlines/Hooks und HVCO-Ideen sind Teil des
Kompetenzbeweises und werden nicht zurückgehalten. Ebenso wandern Marktgrößen-
Rechnung, Case-Study-Befund, Lücken-Listen und die volle Benchmark-Tabelle in
die Prospect-Version. Nur drei Dinge bleiben strikt intern: die Gesprächs-
vorbereitung (Beef-Hebel als Munition, vermutete Einwände, Minenfelder),
CRM-Kontext und alles, was den Prospect bloßstellen statt weiterbringen würde.

## Blind Spots (Pflichtsektion in beiden Berichten)

Nach dem Scoring beantworte: Was übersieht dieser Auftritt? Drei Suchrichtungen:
unadressierte Pain-Points des ICP (aus Reddit/Quora/Reviews belegbar), verpasste
Anlässe (Branchen-Events, Messen, neue rechtliche/regulatorische Entwicklungen,
die dem ICP gerade Druck machen) und überraschende Einzel-Insights. Letztere im
Stil Beobachtung + Stich-Frage, kurz und konkret — Muster: "Cooler Chatbot.
Warum stehen die Zahlen nicht im oberen Drittel der Website?"

## Anschluss: ICP-Soll-Ist-Abgleich

Dieses Audit beschreibt das IST. Der typische nächste Schritt ist die
`/audience-content-engine`, die den idealen ICP recherchiert (SOLL). Damit der
Abgleich später mechanisch leicht fällt: Halte im internen Bericht den aus dem
Messaging *erkennbaren* ICP als strukturierten Steckbrief fest (Branche, Rolle,
Firmengröße, Situation/Trigger, beworbene Pains, verwendete Sprache). Biete am
Ende des Audits aktiv an, die Engine zu starten und die Soll-ICP-Befunde gegen
diesen Steckbrief zu stellen (Gap-Tabelle: beworbener Pain vs. echter Pain,
Sprache der Firma vs. Sprache des Marktes).

## Benchmark-Mechanik

Jeder Report vergleicht die Scores mit der Benchmark-DB: bester Wert, Median und
ein namentlich genanntes Vorbild pro Dimension ("Zum Vergleich: {Vorbild} erreicht
hier 4,5/5, weil …"). Vergleiche innerhalb der passenden Kategorie (SaaS, MSP,
AI-first), wenn die DB genug Einträge dafür hat — ein Mittelständler wird nicht
an HubSpot gemessen.

**Best Practices als Ideen einstreuen:** Die `best-practices`-Zitate der DB sind
Inspirationsmaterial für die individuellen Berichte — als konkretes "so machen
es die Besten"-Beispiel neben einem Befund. Dosierung strikt: höchstens EIN
Best-Practice-Beispiel pro Thema/Dimension, und über den gesamten Bericht nie
mehr als ~30 % der Beispiele von derselben Firma — sonst liest sich das Audit
wie eine Fallstudie über HubSpot statt wie ein Bericht über den Prospect.
Wähle das Beispiel, das zur Kategorie und zur konkreten Lücke passt, zitiere
es wörtlich mit Firmenname, und übersetze in einem Halbsatz, was der Prospect
daraus für sich ableiten könnte. Solange die DB < 3 Einträge hat, weise die Vergleiche als
vorläufig aus. Wird der Skill explizit zur **Benchmark-Aufnahme** gerufen
("analysiere als Vorbild/Benchmark"), entfällt die Prospect-Version; ebenso
dürfen Empfehlungs-Sektion, Beef-Hebel und Soll-Ist-Stub entfallen — der Fokus
liegt auf Scores, Indikatoren, Belegen und **Best-Practice-Zitaten**: sammle
vorbildliche Formulierungen wörtlich (mit URL und Begründung) in den
`best-practices`-Block des DB-Datensatzes, denn genau diese Fundstücke machen
die DB später als Inspirationsquelle wertvoll. Die DB wird um einen als
`benchmark` markierten Datensatz ergänzt. Schema und Beispiele: `references/benchmark-db.md`.

## Tonalität der beiden Versionen

- **Intern** (`{firma}-audit-intern.md`): schonungslos, direkt, mit
  Discovery-Call-Munition — die 5 stärksten Beef-Hebel, vermutete Einwände,
  offene inspirierende Fragen fürs Erstgespräch.
- **Prospect** (`{firma}-messaging-audit.md`): wertschätzend, aber mit klarem Beef.
  Kompetenz zeigt sich in Fragen, nicht in Zensuren: statt "Ihre Website ist
  Feature-lastig" schreibe "Auf Ihrer Startseite zählen wir 14 Feature-Aussagen —
  und suchen die eine Zahl, die Ihr Kunde seinem CFO zeigen würde. Welche wäre das?"
  Niemals herablassend, keine Häme über einzelne Personen, keine internen
  CRM-Informationen, keine Spekulation über Finanzlage. Der Bericht endet mit einem
  weichen, wertorientierten nächsten Schritt (Sparring-Session-Logik), nie mit
  einem harten Pitch.

Beide Templates mit Pflichtstruktur: `references/report-templates.md`.

## Qualitätsmaßstab

Der beste Test für jede Zeile der Prospect-Version: Würde der Empfänger denken
"Diese Frage hat mir noch nie jemand gestellt — und sie tut ein bisschen weh"?
Wenn eine Passage nur beschreibt, was auf der Website steht, streiche sie oder
verwandle sie in eine "So what!?"-Frage. Mindestens 10 wörtliche Zitate pro Audit,
mindestens 3 offene Fragen pro Dimension in der Prospect-Version.
