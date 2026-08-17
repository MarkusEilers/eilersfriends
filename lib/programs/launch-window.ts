/**
 * Launch-Fenster für Programme.
 *
 * Hintergrund: Ein fest hinterlegtes Enddatum veraltet zwangsläufig und zeigt
 * dann ein Datum aus der Vergangenheit. Deshalb gilt:
 *   - Liegt das gepflegte Datum in der Zukunft, gilt genau dieses.
 *   - Sonst greift das rollierende Fenster: Ende des Folgemonats.
 */

/** Letzter Tag des Folgemonats, 23:59:59 Ortszeit. */
export function rollingLaunchDeadline(from: Date = new Date()): Date {
  // Tag 0 des übernächsten Monats = letzter Tag des Folgemonats
  return new Date(from.getFullYear(), from.getMonth() + 2, 0, 23, 59, 59)
}

/** Effektives Enddatum: gepflegtes Datum, solange es in der Zukunft liegt. */
export function effectiveDeadline(stored?: string | Date | null, now: Date = new Date()): Date {
  if (stored) {
    const d = stored instanceof Date ? stored : new Date(stored)
    if (!Number.isNaN(d.getTime()) && d.getTime() > now.getTime()) return d
  }
  return rollingLaunchDeadline(now)
}

export function formatDeadline(d: Date, locale = 'de-DE'): string {
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
}
