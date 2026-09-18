import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { advance } from './run'
import { ensureAgentSchema } from './schema'

/**
 * Der Antrieb.
 *
 * Ein Lauf bewegt sich nicht von selbst. Heute treibt ihn der Aufrufer — die
 * Oberflaeche fragt nach, bis fertig. Das reicht, solange jemand zusieht.
 *
 * Fuer alles andere gibt es diese Stelle: Sie nimmt einen Lauf und schiebt ihn
 * weiter, egal wer klopft. Eine Warteschlange wie QStash ruft je Schritt zurueck,
 * ein Auftraggeber kann pollen, und einmal taeglich raeumt der Cron hinterher —
 * der Tarif erlaubt nur einen Lauf pro Tag, das ist als Sicherheitsnetz gedacht
 * und nicht als Motor.
 *
 * Die Trennung ist der Punkt: Der Agent weiss nicht, wer ihn antreibt. Wenn
 * spaeter eine Warteschlange dazukommt, aendert sich hier eine Zeile und an den
 * Agenten nichts.
 */

export async function driveRun(runId: string, maxSteps = 6) {
  let state = await advance(runId)
  for (let i = 1; i < maxSteps && state.status === 'offen'; i++) {
    state = await advance(runId)
  }
  return state
}

/** Was liegen geblieben ist. Ein Lauf, der laenger als zehn Minuten 'laeuft', ist abgestuerzt. */
export async function staleRuns(limit = 20) {
  await ensureAgentSchema()
  const rows = await db.execute(sql`
    SELECT id, agent_key, status, started_at FROM agent_runs
    WHERE (status = 'offen' AND updated_at < now() - interval '2 minutes')
       OR (status = 'laeuft' AND updated_at < now() - interval '10 minutes')
    ORDER BY started_at LIMIT ${limit}`)
  return rows as unknown as Array<{ id: string; agent_key: string; status: string; started_at: string }>
}

export async function sweep() {
  const open = await staleRuns()
  const done: Array<{ id: string; status: string }> = []
  for (const r of open) {
    try {
      const s = await driveRun(r.id, 3)
      done.push({ id: r.id, status: s.status })
    } catch {
      await db.execute(sql`
        UPDATE agent_runs SET status = 'fehler', error = 'Beim Aufraeumen nicht fortsetzbar',
          finished_at = now(), updated_at = now()
        WHERE id = ${r.id}`)
      done.push({ id: r.id, status: 'fehler' })
    }
  }
  return done
}
