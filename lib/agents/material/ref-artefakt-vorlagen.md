# Artefakt-Vorlagen (v3.0)

Kopiervorlagen für die Auftrags-Artefakte. Platzhalter in <spitzen Klammern>.

## 00-auftrag.md

```
# Auftrag · <slug>
Datum: <datum> · Sprache: <DE/EN/beide> · Kanal/Format: <kanal oder "Dokument, N Seiten">
Zweck: <Awareness/Engagement/Lead-Gen/Conversion/Authority/Education/Retention>
Quick-Start: <ja/nein>
ICP: <icp-datei oder Kurzprofil: Rolle, Firmengröße, aktuelle Frustration>

## Substrat-Inventar
| ID | Fakt (Zahl / Szene / Name / Beobachtung) | Quelle/Bestätigung |
|----|------------------------------------------|--------------------|
| F1 | <...>                                    | <User, Datum>      |

HAUPTSACHE: <F-ID(s), vom User markiert>
Message-Lock: "<ein Satz, volle Kraft>" [bestätigt: <wer, wann>]
```

## 01-strategie.md

```
# Strategie · <slug>
ICP: <ref> · Kanal: <...> · Zweck: <...>

| ID | Ist-Glaube des Lesers | Ziel-Glaube | Widerstand | Beweislast |
|----|----------------------|-------------|------------|------------|
| B1 | <...>                | <...>       | niedrig/mittel/hoch | niedrig/mittel/hoch |

Reihenfolge-Begründung: <warum B1 vor B2 stehen muss>
Freigabe-G1: <wer, datum>
```

## 02-evidenz.md

```
# Evidenz-Plan · <slug>

| ID | Beweismittel | Typ (Frage/Insight/Quote/Szene/Zahl/Demo/Claim) | stellt her | Show/Tell | Quelle (F-ID o. extern) |
|----|--------------|--------------------------------------------------|-----------|-----------|--------------------------|
| E1 | <...>        | <...>                                            | B1        | SHOW      | F1                       |

Show-or-Tell-Regel: Beweislast hoch → SHOW (Frage, Szene, Zahl, Zitat — der Leser schließt selbst).
Beweislast niedrig → TELL erlaubt (schlicht behaupten; Show wäre Platzverschwendung).

OFFEN (Rückfragen/Recherche — NIE von einem Agenten gefüllt):
- <Belief ohne tragendes Beweismittel>
```

## 03-skelett.md (zweistufig)

```
# Skelett · <slug>
Freigegebene Basis: 01 (G1), 02

## Ebene 1 · Dokument-Dramaturgie
| Abschnitt | Aufgabe im Dokument | stellt her | Framework (optional) |
|-----------|---------------------|-----------|----------------------|
| A1 <Titel>| <öffnet B1>         | B1        | Welsh-3-Akt          |
| A2 <Titel>| <beweist B2>        | B2        | Kennedy-Stack        |
(Kurzformate: genau ein Abschnitt A1.)
Übergangs-Logik: <womit verdient A1 das Weiterlesen in A2?>

## Ebene 2 · Beats je Abschnitt
### A1 · <Framework>
| Beat | stellt her | nutzt | Leser-Paraphrase (aus Beat-QS) |
|------|-----------|-------|--------------------------------|
| Hook | B1 öffnen | E1    | "<was der Leser danach denkt>" |

Hook-Wahl: <Kandidat aus Punchliner-Lauf, an G2 vom User gewählt>
Kanal-Limits: <aus decision-matrix>
Beschnitt-Vermerk: <falls Beliefs für diesen Kanal bewusst weggelassen: welche, warum>
Freigabe-G2: <wer, datum>
```

## herkunft.md

```
# Herkunft · <slug>
Plugin: salesmade-writer-v3 v<version> · Datum: <...>
Frameworks je Abschnitt: <...> · Baustein-/Template-Codes: <...>
Kernaussagen → Belege: "<Aussage>" ← F/E-<ids> (je Kernaussage eine Zeile)
Lint: 0 ERRORs (<n> WARNs entschieden: <kurz>) · QS: Strategie <ok/…> · Beats <…> · Prosa <…>
Freigaben: G1 <…> · G2 <…> · G3 <…>
```
