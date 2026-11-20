# Lighthouse-Messung

Monatlicher Check der öffentlichen Seiten (mobil + Desktop), läuft **außerhalb von Vercel**
(kein Cron im Projekt — der Tarif erlaubt nur einen Cron-Lauf pro Tag, der ist belegt).

```sh
CHROME_PATH=/pfad/zu/chrome scripts/lighthouse/run.sh ./lh-out
```

Ergebnis: `summary.csv` (Scores + LCP/CLS/TBT) und ein JSON je Seite/Formfaktor.
Werte schwanken je Lauf um einige Punkte (simulierte Drosselung) — Trends zählen, nicht Einzelwerte.
