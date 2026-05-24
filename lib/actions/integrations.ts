'use server'

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { generateApiKey } from '@/lib/events/auth'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }
}

// ─── Webhook-Subscriptions CRUD ────────────────────────────────────────────

export async function createWebhookSubscription(input: {
  name: string
  url: string
  eventTypes: string[]
  notes?: string
}): Promise<{ id: string; secret: string }> {
  await requireAdmin()
  const secret = crypto.randomBytes(32).toString('hex').slice(0, 64)
  const res = await db.execute<{ id: string }>(sql`
    INSERT INTO webhook_subscriptions (name, url, event_types, secret, notes)
    VALUES (${input.name}, ${input.url}, ${JSON.stringify(input.eventTypes)}::jsonb, ${secret}, ${input.notes ?? null})
    RETURNING id
  `)
  const arr = res as unknown as { id: string }[]
  revalidatePath('/admin/integrations')
  return { id: arr[0].id, secret }
}

export async function updateWebhookSubscription(id: string, patch: {
  name?: string
  url?: string
  eventTypes?: string[]
  active?: boolean
  notes?: string
}): Promise<void> {
  await requireAdmin()
  const sets: ReturnType<typeof sql>[] = []
  if (patch.name !== undefined) sets.push(sql`name = ${patch.name}`)
  if (patch.url !== undefined) sets.push(sql`url = ${patch.url}`)
  if (patch.eventTypes !== undefined) sets.push(sql`event_types = ${JSON.stringify(patch.eventTypes)}::jsonb`)
  if (patch.active !== undefined) sets.push(sql`active = ${patch.active}`)
  if (patch.notes !== undefined) sets.push(sql`notes = ${patch.notes}`)
  if (!sets.length) return
  sets.push(sql`updated_at = now()`)
  await db.execute(sql`UPDATE webhook_subscriptions SET ${sql.join(sets, sql`, `)} WHERE id = ${id}`)
  revalidatePath('/admin/integrations')
}

export async function deleteWebhookSubscription(id: string): Promise<void> {
  await requireAdmin()
  await db.execute(sql`DELETE FROM webhook_subscriptions WHERE id = ${id}`)
  revalidatePath('/admin/integrations')
}

// ─── API-Keys CRUD ─────────────────────────────────────────────────────────

export async function createApiKey(input: {
  name: string
  scopes: string[]
  expiresInDays?: number
}): Promise<{ token: string; prefix: string }> {
  await requireAdmin()
  const { token, prefix, hash } = generateApiKey()
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 86400_000).toISOString()
    : null
  await db.execute(sql`
    INSERT INTO api_keys (name, prefix, token_hash, scopes, expires_at)
    VALUES (${input.name}, ${prefix}, ${hash}, ${JSON.stringify(input.scopes)}::jsonb, ${expiresAt})
  `)
  revalidatePath('/admin/integrations')
  return { token, prefix }
}

export async function revokeApiKey(id: string): Promise<void> {
  await requireAdmin()
  await db.execute(sql`UPDATE api_keys SET active = false WHERE id = ${id}`)
  revalidatePath('/admin/integrations')
}

// ─── Trigger one-shot manual delivery (für Debug) ─────────────────────────

export async function triggerWebhookDelivery(): Promise<{ delivered: number; failed: number; subs: number }> {
  await requireAdmin()
  const { deliverPendingWebhooks } = await import('@/lib/events/deliver')
  return deliverPendingWebhooks({ maxBatch: 50 })
}
