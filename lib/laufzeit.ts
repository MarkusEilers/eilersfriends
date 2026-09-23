/**
 * Wie lange eine Funktion wirklich laufen darf.
 *
 * Zwoelf Routen standen mit `maxDuration = 300` im Code, und der Tarif gab
 * sechzig. Die Zahl im Code war kein Wunsch, sie war eine Behauptung — und die
 * Budgetpruefungen, die daraus abgeleitet waren, pruefen bei 170 Sekunden auf
 * etwas, das nach sechzig schon vorbei ist.
 *
 * Sichtbar war davon nichts. Die Laeufe waren resumierbar, also lief alles
 * weiter; es lief nur in Portionen von einem Fuenftel der geplanten Groesse,
 * und niemand konnte sagen warum.
 *
 * Deshalb steht die Wahrheit ab jetzt an einer Stelle. Nach einem Tarifwechsel
 * ist es eine Umgebungsvariable und kein Streifzug durch zwoelf Dateien.
 */

/** Was der Tarif hergibt. Hobby: 60. Pro: 300. Fluid: bis 800. */
export const FUNKTION_SEKUNDEN = Number(process.env.FUNCTION_MAX_SECONDS ?? 60)

/**
 * Wieviel Zeit eine Arbeitsschleife sich nehmen darf.
 *
 * Nicht die volle Laufzeit: Am Ende muss noch abgelegt werden, was fertig ist,
 * und ein Modellaufruf, der mitten drin abgeschnitten wird, kostet Geld und
 * liefert nichts. Zwanzig Prozent Rand, mindestens acht Sekunden.
 */
export function arbeitsBudgetMs(): number {
  const ms = FUNKTION_SEKUNDEN * 1000
  return Math.max(5_000, ms - Math.max(8_000, ms * 0.2))
}

/** Dasselbe fuer Schleifen, die zwischendurch ablegen koennen — etwas mehr Rand. */
export function schleifenBudgetMs(): number {
  const ms = FUNKTION_SEKUNDEN * 1000
  return Math.max(4_000, ms - Math.max(12_000, ms * 0.3))
}
