import { driveRun } from '@/lib/agents/drive'
import { offeneAuftraege, updateOrder, zaehleSchub, type ServiceOrder } from './schema'

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

const BUDGET_MS = 200_000

export async function schiebeAuftrag(order: ServiceOrder): Promise<ServiceOrder['status']> {
  if (!order.run_ids.length) return order.status
  await zaehleSchub(order.id)

  const lauf = order.run_ids[order.run_ids.length - 1]
  const state = await driveRun(lauf, 6).catch(() => null)

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
export async function einDurchgang(): Promise<{ bearbeitet: number; offenGeblieben: number }> {
  const start = Date.now()
  let bearbeitet = 0
  let offenGeblieben = 0

  while (Date.now() - start < BUDGET_MS) {
    const offen = await offeneAuftraege(3)
    if (!offen.length) break
    for (const o of offen) {
      if (Date.now() - start > BUDGET_MS) { offenGeblieben++; continue }
      const status = await schiebeAuftrag(o)
      bearbeitet++
      if (status === 'laeuft') offenGeblieben++
    }
  }
  const rest = await offeneAuftraege(1)
  return { bearbeitet, offenGeblieben: offenGeblieben || rest.length }
}

/**
 * Den naechsten Durchgang anstossen, ohne auf ihn zu warten.
 *
 * Absichtlich ohne `await` auf die Antwort: Wir wollen nur, dass die naechste
 * Instanz startet. Ob sie fertig wird, entscheidet sie selbst — und wenn der
 * Aufruf scheitert, faengt ihn spaetestens der taegliche Cron auf.
 */
export function stosseAn(): void {
  const basis = process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
  const secret = process.env.CRON_SECRET
  if (!basis || !secret) return
  fetch(`${basis}/api/services/antrieb`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  }).catch(() => {})
}
