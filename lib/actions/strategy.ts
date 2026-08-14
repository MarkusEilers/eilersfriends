'use server'

import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import {
  ensureStrategySchema, listProducts, createProduct, listStepStates,
  ensureStepState, saveStepData, transitionStep, listBlocks,
  addComment, listComments, type StepStatus,
} from '@/lib/db/queries/strategy'

/** Aktuelle Session + Firma des Users auflösen. */
export async function currentContext() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('unauthorized')
  const res = await db.execute(sql`SELECT company_id FROM users WHERE id = ${session.user.id} LIMIT 1`)
  const companyId = (res as unknown as Array<{ company_id: string | null }>)[0]?.company_id ?? null
  const isCoach = session.user.role === 'admin' || session.user.role === 'coach'
  return { userId: session.user.id, role: session.user.role, companyId, isCoach }
}

export async function getProductsAction(companyIdOverride?: string) {
  const ctx = await currentContext()
  const companyId = companyIdOverride && ctx.isCoach ? companyIdOverride : ctx.companyId
  if (!companyId) return []
  return listProducts(companyId)
}

export async function createProductAction(name: string, description?: string) {
  const ctx = await currentContext()
  if (!ctx.companyId) throw new Error('keine Organisation zugeordnet')
  if (!name.trim()) throw new Error('Name fehlt')
  const p = await createProduct({ companyId: ctx.companyId, name: name.trim(), description, createdBy: ctx.userId })
  revalidatePath('/dashboard/strategie')
  return p
}

export async function getOverviewAction(productId?: string | null) {
  const ctx = await currentContext()
  if (!ctx.companyId) return { steps: [], companyId: null }
  const steps = await listStepStates(ctx.companyId, productId ?? null)
  return { steps, companyId: ctx.companyId }
}

/** Schritt öffnen: Status anlegen falls nötig, Bausteine + Kommentare laden. */
export async function openStepAction(stepKey: string, productId?: string | null) {
  const ctx = await currentContext()
  if (!ctx.companyId) throw new Error('keine Organisation zugeordnet')
  await ensureStrategySchema()

  const stepRes = await db.execute(sql`SELECT * FROM strategy_steps WHERE key = ${stepKey} LIMIT 1`)
  const step = (stepRes as unknown as Array<Record<string, unknown>>)[0]
  if (!step) throw new Error('Schritt nicht gefunden')

  const scopedProduct = step.scope === 'company' ? null : (productId ?? null)
  const state = await ensureStepState({ companyId: ctx.companyId, productId: scopedProduct, stepId: step.id as string })
  const blocks = await listBlocks(step.id as string)
  const comments = await listComments(state.id as string, ctx.isCoach)

  return { step, state, blocks, comments, isCoach: ctx.isCoach }
}

export async function saveStepAction(stateId: string, data: unknown, progress?: number) {
  const ctx = await currentContext()
  await saveStepData(stateId, data, progress, ctx.userId)
  revalidatePath('/dashboard/strategie')
  return { ok: true }
}

export async function transitionStepAction(stateId: string, to: StepStatus, note?: string) {
  const ctx = await currentContext()
  const reviewerOnly: StepStatus[] = ['in_review', 'approved', 'changes_requested']
  if (reviewerOnly.includes(to) && !ctx.isCoach) throw new Error('Nur das Coach-Team kann prüfen und freigeben.')
  const r = await transitionStep(stateId, to, ctx.userId, note ?? null)
  revalidatePath('/dashboard/strategie')
  return r
}

export async function addCommentAction(stateId: string, body: string, isInternal = false, blockId?: string) {
  const ctx = await currentContext()
  if (!body.trim()) throw new Error('Kommentar ist leer')
  if (isInternal && !ctx.isCoach) throw new Error('unauthorized')
  const c = await addComment({ stateId, body: body.trim(), isInternal, authorId: ctx.userId, blockId: blockId ?? null })
  revalidatePath('/dashboard/strategie')
  return c
}
