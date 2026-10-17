'use server'

import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getCheck, setOutcome, OUTCOMES, type Outcome } from './store'
import type { CheckResult } from './analyze'

/** Ausgang festhalten — wer den Link hat, darf das (der Link ist das Geheimnis). */
export async function setOutcomeAction(publicId: string, outcome: string) {
  if (!(OUTCOMES as readonly string[]).includes(outcome)) return { ok: false }
  await setOutcome(publicId, outcome as Outcome)
  revalidatePath(`/gespraechs-check/${publicId}`)
  return { ok: true }
}

/**
 * Angebots-Entwurf aus dem Gespräch → Entwurf in der Angebots-Engine.
 * Nur Eilers+Friends: Das Angebot geht an einen Kunden, nicht an den Nutzer des Checks.
 */
export async function createOfferFromCheckAction(publicId: string) {
  const s = await auth()
  if (s?.user?.role !== 'admin' && s?.user?.role !== 'coach') return { ok: false, error: 'unauthorized' }
  const c = await getCheck(publicId)
  const draft = (c?.result as CheckResult | undefined)?.offer_draft
  if (!c || !draft) return { ok: false, error: 'Kein Angebots-Entwurf in diesem Check' }
  if (c.offer_id) return { ok: true, offerId: c.offer_id }
  const year = new Date().getFullYear()
  const number = `AN-${year}-GC-${randomBytes(3).toString('hex').toUpperCase()}`
  const understanding = { title: 'Eure Ziele und die Herausforderungen, die Euch heute aufhalten', goals: draft.results, challenges: draft.challenges }
  const empathy = { title: 'Was daran auffällt', statement: draft.empathy, successMessage: '' }
  const track = [{ name: 'Der Weg', goal: draft.next_step || null, steps: draft.steps.map((t) => ({ title: t })) }]
  const [o] = (await db.execute(sql`
    INSERT INTO offers (offer_number, customer_name, access_salt, title, subtitle, understanding_section, empathy_section, track, guarantee_text, meeting_notes, status)
    VALUES (${number}, ${'(aus Gesprächs-Check)'}, ${randomBytes(12).toString('hex')}, ${draft.headline || 'Angebot aus dem Gespräch'},
            ${draft.cost_of_inaction || null}, ${JSON.stringify(understanding)}::jsonb, ${JSON.stringify(empathy)}::jsonb, ${JSON.stringify(track)}::jsonb,
            ${draft.risk_reversal || null},
            ${['Aus Gesprächs-Check ' + publicId, draft.missing.length ? 'Fehlt noch: ' + draft.missing.join('; ') : ''].filter(Boolean).join('\n')},
            'draft')
    RETURNING id`)) as unknown as { id: string }[]
  await db.execute(sql`UPDATE call_checks SET offer_id=${o.id} WHERE public_id=${publicId}`)
  revalidatePath(`/gespraechs-check/${publicId}`)
  return { ok: true, offerId: o.id }
}
