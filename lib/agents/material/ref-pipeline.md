# Pipeline-Referenz · Ablauf, Gates, Kontextinventare (v3.0)

## Fehlerklassen (Vokabular für QS und Feedback)

- **K1 Floskel-Slurp** — Verbotswörter, Berater-Sprech, Hallmarks → Fänger: Linter
- **K2 Struktur-Slurp** — Framework/Beats ignoriert, Schritte übersprungen → Fänger: Skelett + Validator + QS Frage 2
- **K3 Botschafts-Slurp** — Kernbotschaft abgeschwächt/invertiert → Fänger: Message-Lock + QS Frage 1
- **K4 Generik-Slurp** — regelkonform, aber klingt nach niemandem → Fänger: Gold-Beispiele + QS Fragen 5/7
- **K5 Unsinn-Slurp** — Form ohne Inhalt ("Nicht Obst, sondern Banane"), falsche Kontraste, hochpriorisierte Nebensächlichkeiten, Virtue-Signalling → Fänger: Substrat-Regel + QS Fragen 3/4

Betriebs-Loop: Jeder durchgerutschte Slurp wird einer Klasse zugeordnet und schärft genau EINEN Fänger (Linter-Eintrag, QS-Frage, Gold-Beispiel) — nie eine lose Regel auf den allgemeinen Stapel.

## Artefakte pro Auftrag

```
auftraege/<datum>-<slug>/
  00-auftrag.md      Kanal/Format, Zweck, Sprache, Quick-Start, Substrat F1..Fn, Hauptsache, Message-Lock
  01-strategie.md    ICP-Referenz + Belief-Chain B1..Bn            → Gate G1
  02-evidenz.md      Beweismittel E1..En, Show-or-Tell, OFFEN-Liste
  03-skelett.md      Ebene 1 (Dokument) + Ebene 2 (Abschnitte/Beats) + Leser-Paraphrasen → Gate G2
  04-draft.md        Prosa (ggf. Varianten)                        → Gate G3
  pruefberichte/     qs-strategie.md, qs-beats.md, qs-prosa.md, lint-*.txt
  herkunft.md        Versionen, Codes, F/B/E-Verwendung, Verdikte
```

Freigabe-Vermerke: Zeile `Freigabe-G<n>: <wer>, <datum>` am Artefakt-Ende. Nachgelagerte Stufen starten nur, wenn der Vermerk der Vorstufe existiert. Edit an einem freigegebenen Artefakt → Vermerke aller nachgelagerten Artefakte streichen, Pipeline ab dort neu.

## Agenten-Kontextinventare (Stern-Topologie — kein Agent ruft einen anderen)

| Agent | Bekommt (vollständig, nichts weiter) | Liefert |
|---|---|---|
| stratege | 00-auftrag.md, ICP-Datei/-Kurzprofil, ggf. Recherchematerial | 01-strategie.md + 02-evidenz.md |
| architekt | 01+02, references/decision-matrix.md, Kanal-Limits, Punchliner-Kandidaten, bei Bedarf einzelne Framework-Files aus knowledge/ | 03-skelett.md (2 Ebenen) |
| punchliner | EIN Belief, tragende F/E-IDs, Message-Lock, 2–3 Gold-Hooks des Typs | 5–10 Kandidaten mit F/E-Referenz |
| schreiber | references/kernregelwerk.md, 03-skelett.md (mit Paraphrasen), 00-auftrag.md (Substrat + Lock), 2–3 Gold-Texte des Kanals, knowledge/00-markus-voice-profile.md, je Abschnitt dessen Framework-File | 04-draft.md |
| qs-pruefer | modusabhängig, s.u. | pruefberichte/qs-<modus>.md |
| bibliothekar (offline) | gold/, knowledge/ Template-Pools | gold/index.json + getaggte Bausteine |

Der Schreiber sieht NICHT: Strategie-Diskussion, 50er-Pools, Verbotslisten-Langfassung, Gesprächsverlauf. Der QS-Prüfer sieht NIE den Gesprächsverlauf oder Begründungen des Schreibers.

## QS-Modi (ein Agent, drei Fragenkataloge)

**STRATEGIE** (Input: 01, 02, ICP): Kippen diese Glaubenssätze wirklich, in dieser Reihenfolge? Widerstand realistisch? Trägt das Beweismittel die Beweislast? Show/Tell richtig gepolt? Welcher ICP-Einwand bleibt unbeantwortet?

**BEATS** (Input: 01, 03, ICP — bewusst OHNE Gold-Beispiele und Klangregeln): pro Beat fünf Fragen —
1. Wirkung: Was TUT der Beat dem Leser an? ("informiert" = rote Flagge)
2. Paraphrase: Was denkt der Leser danach, in Lesersprache? (Paraphrase formulieren; weicht sie vom Ziel-Glauben ab → Befund. Paraphrasen ins Skelett übernehmen.)
3. Intention: Deckt sich das mit der zugewiesenen B-ID?
4. Weiterlesen: Warum liest er den nächsten Beat? (Bei Dokumenten zusätzlich: Warum das nächste Kapitel?)
5. Streichprobe: Was ginge verloren, wenn der Beat fehlt?

**PROSA** (Input: 04, kernregelwerk, 00-auftrag, 03, Message-Lock): sieben Fragen + zwei — (1) Lock unverändert stark? (2) Jeder Beat besetzt, keiner erfunden? (3) Banane-Test: trägt jede Pointe/jeder Kontrast/jede Zahl ein F/E-Element? (4) Hauptsache ist Hauptsache? (5) Welcher Charakter liest sich heraus — Markus oder "irgendein Sales-Coach"? (6) Übergriffe/Drohungen/unbelegte Tugend? (7) Mindestens eine Risiko-Stelle? (8) Löst jeder Beat seine Leser-Paraphrase ein? (9) Bei mehrseitigen Dokumenten: tragen die Übergänge, bleibt die Dramaturgie über Abschnitte kohärent?

Jedes Verdikt mit Fundstelle, Flagge ROT (Pflicht-Revision) oder GELB (Ermessen).

## Skripte

- `scripts/lint.py <datei>` — Verbotsliste, Ausrufezeichen, ALLCAPS, Adjektiv-Reihen (Heuristik), Mini-Satz-Zählung, Denglisch. Exit 1 bei ERRORs. WARNs (z.B. "tragen" physisch vs. bildlos) entscheidet der Dirigent.
- `scripts/validate_skelett.py <auftragsordner>` — B/E-Vollständigkeit, schwere Beliefs in starken Slots, keine toten Referenzen.
- `scripts/retrieve.py --kanal X --typ hook --belief-typ Y` — Top-Bausteine aus gold/index.json. Solange der Index leer ist: Fallback auf hook-bank-master + Beleg-Beispiele im Markus-Profil.

## Kanal-Zusatzchecks (der Prüfer zieht sie je Kanal heran)

Cold-Mail <90 Wörter, Subject <6 Wörter, Opt-Out, Poke-Frage neutral · LinkedIn: Zeilen 1–3 klicken, Links in Kommentar 1 · Newsletter: 3-Akt 25/50/25 ±10 % · Thread: 8–12 Tweets, T1 trägt 80 % · Carousel: 7–12 Slides, eine Idee pro Slide · Sales-Letter: Kennedy-Skelett komplett, Risk-Reversal echt · HVCO: alle 5 Beats, erster Conversion-CTA nicht vor Touch 4/8, Zoom-Out mit konkreten Stages, 1 CTA pro Touch · Details: references/decision-matrix.md und knowledge/-Masterprompts.
