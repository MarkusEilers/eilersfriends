# Benchmark-Datenbank — Format

Die Datei `Messaging-Benchmark-DB.md` ist das Langzeitgedächtnis des Skills.
Sie liegt beim Nutzer (verbundener Arbeitsordner, z. B. der SalesMade-Ordner) —
nicht im Skill selbst, denn das Skill-Verzeichnis ist schreibgeschützt und die
DB soll über Sessions hinweg wachsen. Nach jedem Audit: Datensatz anhängen und
die Datei per device_commit_files (bzw. SendUserFile) zurückschreiben.

## Kopf der Datei

```markdown
# SalesMade Messaging-Benchmark-DB
Gepflegt vom Skill salesmade-prospect-audit. Ein Datensatz pro auditiertem
Unternehmen. `typ: benchmark` = bewusst als Vorbild/Negativ-Referenz aufgenommen;
`typ: prospect` = reguläres Kunden-Audit.
```

## Datensatz-Schema

Ein Block pro Firma, neueste zuletzt. Wird dieselbe Firma erneut auditiert,
neuen Block anhängen (Verlauf ist wertvoll — Fortschritt messbar machen).

```markdown
---
## {Firma} — {YYYY-MM-DD}
typ: prospect | benchmark
url: {hauptdomain}
branche: {kurz}
icp: {ein Satz}
scores: beef {x}/5 · infotainment {x}/5 · influence {x}/5 · pmm {x}/5 · offer {x}/5 · funnel {x}/5 · seo-geo {x}/5
beef-verteilung: WHAT {xx}% / HOW {xx}% / WHY {xx}%
indikatoren: zahlen-oben {ja/nein} · outcomes-beziffert {ja/nein} · cases-als-success-story {ja/teilweise/nein} · icp-disqualifiziert {ja/nein} · story-dichte {s/m/g} · feind-these {ja/nein} · offene-fragen {ja/nein} · empathie {s/m/g} · pain-first-lp {ja/teilweise/nein} · sie-perspektive {ja/nein} · cta-treppe {ja/nein} · risk-reversal {ja/nein} · signature-solution {ja/nein} · deliverables-eigennamen {ja/nein} · hvco {ja/nein} · hvco-modern {s/m/g} · funnel-durchgaengig {s/m/g} · vergleichsseiten {ja/nein} · drittquellen {s/m/g} · ki-sichtbar {ja/nein/ungeprüft}
staerkste-dimension: {dimension} — {ein Satz warum}
schwaechste-dimension: {dimension} — {ein Satz warum}
merksatz: {ein Satz, der diesen Fall als Vergleichsanker nutzbar macht,
z. B. "Vorbild für Risk-Reversal: 5x-ROI-Garantie offensiv als Beweis eingesetzt"}
best-practices:
- "{wörtliches Zitat einer vorbildlichen Formulierung}" — {url} — {warum das
  vorbildlich ist: welche Dimension/welcher Mechanismus, in einem Halbsatz}
- {…weitere; nur echte Fundstücke, wörtlich und mit Quelle. Bei mittelmäßigen
  Auftritten darf der Block leer sein oder ein Negativ-Beispiel als
  "anti-pattern:" führen}
report: {dateiname der internen Analyse}
```

## Nutzung im Report

- **Median & Bestwert** je Dimension aus allen Datensätzen ziehen (benchmark
  und prospect zusammen; bei erneut auditierten Firmen nur den jüngsten Block).
- Für jede Dimension das **namentliche Vorbild** (höchster Score) nennen und in
  einem Halbsatz begründen — der `merksatz` liefert die Begründung.
- In der Prospect-Version Vergleichsfirmen nur nennen, wenn die Information
  öffentlich ist (was bei dieser Recherche immer der Fall sein sollte); interne
  Prospect-Audits anderer Kunden dort nur anonymisiert verwenden ("ein
  B2B-SaaS-Anbieter aus unserer Datenbank").
- Bei < 3 Einträgen: Vergleich als vorläufig kennzeichnen und stattdessen die
  Anker-Beispiele der Rubrik als Maßstab heranziehen.
