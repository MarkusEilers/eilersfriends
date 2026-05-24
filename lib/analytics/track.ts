import { db } from '@/lib/db'
import { siteEvents } from '@/lib/db/schema'
import { ensureAnalyticsTables } from '@/lib/db/self-heal'

export type EventCategory = 'subscriber' | 'sequence' | 'content' | 'offer' | 'system' | 'auth'

export interface LogEventInput {
  category: EventCategory
  eventType: string
  title: string
  summary?: string
  refType?: string
  refId?: string
  actorId?: string
  metadata?: Record<string, unknown>
}

/**
 * Append a single audit event to site_events. Used for the Gesamt-Briefing.
 * Never throws — auditing must not break business flows. Logs on failure.
 */
export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    await ensureAnalyticsTables()
    await db.insert(siteEvents).values({
      category: input.category,
      eventType: input.eventType,
      title: input.title,
      summary: input.summary ?? null,
      refType: input.refType ?? null,
      refId: input.refId ?? null,
      actorId: input.actorId ?? null,
      metadata: input.metadata ?? {},
    })
  } catch (err) {
    console.error('[logEvent] failed:', err, input)
  }
}

/**
 * Fire-and-forget variant for hot paths (newsletter signup, etc).
 * Schedules the insert without awaiting so the user response isn't delayed.
 */
export function logEventAsync(input: LogEventInput): void {
  void logEvent(input)
}
