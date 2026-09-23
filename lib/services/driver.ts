import { driveRun } from '@/lib/agents/drive'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { openOrders, updateOrder, countPush, trackProgress, type ServiceOrder } from './schema'
import { workBudgetMs } from '@/lib/runtime-limits'

/**
 * Der Antrieb fuer Dienst-Auftraege.
 *
 * Ein Audit dauert Minuten bis Stunden und besteht aus einem Dutzend
 * Modellaufrufen. Eine Lambda-Laufzeit reicht dafuer nicht, und das CRM soll
 * nicht nachfassen muessen — es hat einmal bestellt, damit ist seine Arbeit
 * getan.
 *
 * Also schiebt sich der Auftrag selbst: Jeder Durchgang arbeitet, so lange das
 * Zeitbudget reicht, und ruft danach den naechsten an. Eine Kette mit Ende —
 * der Schub-Zaehler in der Datenbank sorgt dafuer, dass sie eines hat.
 *
 * Warum nicht der taegliche Cron: Der Tarif erlaubt einen Lauf pro Tag. Als
 * Sicherheitsnetz taugt er, als Motor nicht.
 */

const BUDGET_MS = workBudgetMs()

/**
 * Wieviele Schuebe ein Auftrag am selben Punkt stehen darf.
 *
 * Grosszuegig genug fuer einen langsamen Schritt, der wirklich arbeitet — ein
 * Recherche-Schritt mit Minutenbremse braucht durchaus zwei, drei Anlaeufe fuer
 * dieselbe Klasse. Eng genug, dass eine echte Schleife nach einer Viertelstunde
 * auffliegt statt nach einer Nacht.
 */
const STILLSTAND_MAX = 6

export async function advanceOrder(order: ServiceOrder): Promise<ServiceOrder['status']> {
  if (!order.run_ids.length) return order.status
  const lauf = order.run_ids[order.run_ids.length - 1]

  /**
   * Erst nachsehen, wo er steht — dann arbeiten.
   *
   * Der Waechter stand zuerst hinter driveRun, und dort kam er nie an: Ein
   * Recherche-Schritt schoepft das Zeitbudget der Funktion aus, die Laufzeit
   * endet mitten drin, und alles danach faellt aus. Der Schub-Zaehler davor
   * stieg trotzdem — es sah also aus wie Arbeit und war eine Schleife, und
   * ausgerechnet die Stelle, die das melden sollte, wurde abgeschnitten.
   *
   * Vorne steht er richtig. Der Stand ist dann der, den der vorige Durchgang
   * hinterlassen hat, und genau danach fragen wir: Ist der Auftrag seit dem
   * letzten Aufgreifen weitergekommen?
   */
  const stand = await standDesLaufs(lauf, null)
  const stillstand = await trackProgress(order.id, stand)
  if (stillstand >= STILLSTAND_MAX) {
    await updateOrder(order.id, {
      status: 'fehler',
      fehler: `Kein Fortschritt über ${stillstand} Schübe — der Auftrag stand bei "${stand}" `
        + 'und wurde angehalten, statt dieselbe Arbeit weiter zu bezahlen.',
    })
    console.error(`[driver] Auftrag ${order.id} angehalten: Stillstand bei "${stand}"`)
    return 'fehler'
  }

  await countPush(order.id)
  /**
   * Ein Schritt pro Durchgang, nicht sechs.
   *
   * Sechs war die Annahme, Schritte seien kurz. Ein Recherche-Schritt nimmt
   * sich bis zu 210 Sekunden und vertagt sich dann selbst — danach waren von
   * den 300 Sekunden der Funktion keine sechs Schritte mehr uebrig, sondern
   * gar keiner. Die Laufzeit endete mitten im zweiten, und alles, was danach
   * kam (Status schreiben, Waechter), fiel aus.
   *
   * Einer pro Durchgang kehrt sauber zurueck. Der Antrieb stoesst sich selbst
   * wieder an, und alle zwei Minuten kommt ohnehin der Herzschlag.
   */
  const state = await driveRun(lauf, 1).catch(() => null)

  if (state?.status === 'fertig') {
    await updateOrder(order.id, { status: 'fertig', ergebnis: state.output })
    return 'fertig'
  }
  if (state?.status === 'fehler') {
    await updateOrder(order.id, { status: 'fehler', fehler: 'Lauf abgebrochen — siehe Lauf-Protokoll.' })
    return 'fehler'
  }

  return 'laeuft'
}

/**
 * Einen Durchgang: nimm, was offen ist, schieb es, und sag, ob noch etwas
 * uebrig ist. Der Aufrufer entscheidet, ob er sich selbst nochmal anstoesst.
 */
export async function runOnce(): Promise<{ bearbeitet: number; offenGeblieben: number }> {
  const start = Date.now()
  let bearbeitet = 0
  let offenGeblieben = 0

  while (Date.now() - start < BUDGET_MS) {
    const offen = await openOrders(3)
    if (!offen.length) break
    for (const o of offen) {
      if (Date.now() - start > BUDGET_MS) { offenGeblieben++; continue }
      const status = await advanceOrder(o)
      bearbeitet++
      if (status === 'laeuft') offenGeblieben++
    }
  }
  const rest = await openOrders(1)
  return { bearbeitet, offenGeblieben: offenGeblieben || rest.length }
}

/**
 * Den naechsten Durchgang anstossen, ohne auf ihn zu warten.
 *
 * Absichtlich ohne `await` auf die Antwort: Wir wollen nur, dass die naechste
 * Instanz startet. Ob sie fertig wird, entscheidet sie selbst — und wenn der
 * Aufruf scheitert, faengt ihn spaetestens der taegliche Cron auf.
 */
export function kick(): void {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Ohne Geheimnis weist der Antrieb sich selbst ab. Das ist kein Detail,
    // das man uebersehen darf — also steht es im Protokoll.
    console.error('[driver] CRON_SECRET fehlt — die Kette kann sich nicht fortsetzen.')
    return
  }
  const basis = basisUrl()
  fetch(`${basis}/api/services/driver`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  }).catch((e) => console.error('[driver] Anstoss fehlgeschlagen:', e))
}

/**
 * Wo wir selbst erreichbar sind.
 *
 * Das hat den Motor schon einmal lautlos abgewuergt: Keine der erwarteten
 * Variablen war gesetzt, `kick` kehrte still zurueck, und die Auftraege
 * standen — ohne Fehler, ohne Eintrag, ohne Hinweis. Vier Stueck, eine
 * Viertelstunde lang.
 *
 * Deshalb jetzt vier Stufen und am Ende eine feste Adresse. Eine vergessene
 * Umgebungsvariable darf eine Warnung wert sein, nicht den Stillstand.
 */
function basisUrl(): string {
  const gesetzt = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  if (gesetzt) return gesetzt.replace(/\/$/, '')
  console.warn('[driver] Keine Basis-URL in der Umgebung — greife auf die feste Adresse zurueck.')
  return 'https://www.eilersfriends.com'
}


/**
 * Wo genau ein Lauf steht, als ein Satz.
 *
 * Der Cursor allein reicht nicht: Ein Schritt, der sich selbst vertagt, laesst
 * den Cursor stehen und schreibt seinen Fortschritt in die eigene Zeile
 * ("3 von 6 Quellenklassen geprueft"). Genau dieser Text ist das, was sich
 * aendern muss, damit von Fortschritt die Rede sein kann.
 */
async function standDesLaufs(runId: string, cursor: number | null): Promise<string> {
  const rows = (await db.execute(sql`
    SELECT step_key, status, COALESCE(error, '') AS note
    FROM agent_run_steps
    WHERE run_id = ${runId}::uuid AND status IN ('laeuft', 'offen')
    ORDER BY seq LIMIT 1`)) as unknown as Array<{ step_key: string; status: string; note: string }>
  const s = rows[0]

  /**
   * Das Teil-Artefakt gehoert mit in den Stand.
   *
   * Ein Schritt, der sich selbst vertagt, legt vorher ab, was er geschafft hat
   * — mit einem Label wie "4 von 6 Klassen" oder "3/5". Genau diese Zahl ist
   * der Fortschritt. Die Schrittzeile allein bleibt derweil auf 'laeuft'
   * stehen und saehe bei echter Arbeit genauso aus wie bei einer Schleife.
   */
  const art = (await db.execute(sql`
    SELECT label FROM agent_artifacts
    WHERE run_id = ${runId}::uuid AND kind LIKE '%-teil'
    ORDER BY created_at DESC LIMIT 1`)) as unknown as Array<{ label: string }>

  return `${cursor ?? '?'} · ${s?.step_key ?? '—'} · ${s?.status ?? '—'} · ${s?.note ?? ''} · ${art[0]?.label ?? ''}`
}
