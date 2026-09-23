/**
 * Wie lange eine Funktion wirklich laufen darf.
 *
 * Die Zahl stand bisher an zwoelf Stellen als `maxDuration = 300`, und die
 * davon abgeleiteten Budgets standen an vier weiteren als 170_000 oder
 * 230_000. Wer den Tarif wechselt, muesste sie alle finden.
 *
 * Also eine Stelle. Der Wert gilt fuer dieses Projekt geprueft: Fluid Compute
 * ist aktiv, `functionDefaultTimeout` steht auf 300 — auch auf Hobby. Wer auf
 * Pro geht und 800 Sekunden will, aendert hier eine Umgebungsvariable.
 */

/** Was der Tarif hergibt. Hobby und Pro: 300 mit Fluid. Pro maximal: 800. */
export const FUNCTION_SECONDS = Number(process.env.FUNCTION_MAX_SECONDS ?? 300)

/**
 * Wieviel Zeit eine Arbeitsschleife sich nehmen darf.
 *
 * Nicht die volle Laufzeit: Am Ende muss noch abgelegt werden, was fertig ist,
 * und ein Modellaufruf, der mitten drin abgeschnitten wird, kostet Geld und
 * liefert nichts. Zwanzig Prozent Rand, mindestens acht Sekunden.
 */
export function workBudgetMs(): number {
  const ms = FUNCTION_SECONDS * 1000
  return Math.max(5_000, ms - Math.max(8_000, ms * 0.2))
}

/** Dasselbe fuer Schleifen, die zwischendurch ablegen koennen — etwas mehr Rand. */
export function loopBudgetMs(): number {
  const ms = FUNCTION_SECONDS * 1000
  return Math.max(4_000, ms - Math.max(12_000, ms * 0.3))
}
