import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'

/** Base offset shown before any DB subscribers (legacy + Beehiiv). */
export const NEWSLETTER_BASE_COUNT = 6552

/**
 * Returns the total subscriber count to display = base offset + active rows in DB.
 * Falls back to base on any DB error so the page never breaks.
 */
export async function getDisplayedSubscriberCount(): Promise<number> {
  try {
    const result = await db
      .select({ value: count() })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'active'))
    const active = result[0]?.value ?? 0
    return NEWSLETTER_BASE_COUNT + active
  } catch {
    return NEWSLETTER_BASE_COUNT
  }
}
