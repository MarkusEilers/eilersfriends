import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) { const x = (r as { rows: unknown }).rows; if (Array.isArray(x)) return x as T[] }
  return []
}

let ensured = false
export async function ensureErrorTable() {
  if (ensured) return
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS error_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      level text NOT NULL DEFAULT 'error',
      source text NOT NULL DEFAULT 'client',
      message text NOT NULL DEFAULT '',
      stack text,
      url text,
      status int,
      user_agent text,
      context jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC)`)
  ensured = true
}

export type LogInput = { level?: string; source?: string; message: string; stack?: string; url?: string; status?: number; userAgent?: string; context?: unknown }

export async function logError(i: LogInput) {
  try {
    await ensureErrorTable()
    await db.execute(sql`
      INSERT INTO error_logs (level, source, message, stack, url, status, user_agent, context)
      VALUES (${i.level || 'error'}, ${i.source || 'server'}, ${String(i.message || '').slice(0, 4000)},
        ${i.stack ? String(i.stack).slice(0, 8000) : null}, ${i.url || null}, ${i.status ?? null},
        ${i.userAgent ? String(i.userAgent).slice(0, 500) : null}, ${i.context ? JSON.stringify(i.context) : null}::jsonb)`)
  } catch { /* Logging darf nie selbst crashen */ }
}

export type ErrorRow = { id: string; level: string; source: string; message: string; stack: string | null; url: string | null; status: number | null; userAgent: string | null; createdAt: string }

export async function listErrors(limit = 100): Promise<ErrorRow[]> {
  await ensureErrorTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT id, level, source, message, stack, url, status, user_agent, created_at FROM error_logs ORDER BY created_at DESC LIMIT ${limit}`))
  return r.map(x => ({ id: String(x.id), level: String(x.level), source: String(x.source), message: String(x.message), stack: x.stack ? String(x.stack) : null, url: x.url ? String(x.url) : null, status: x.status == null ? null : Number(x.status), userAgent: x.user_agent ? String(x.user_agent) : null, createdAt: String(x.created_at) }))
}

export async function errorStats(): Promise<{ total: number; last24h: number }> {
  await ensureErrorTable()
  const r = rowsOf<Record<string, unknown>>(await db.execute(sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours')::int AS last24h FROM error_logs`))
  return { total: Number(r[0]?.total || 0), last24h: Number(r[0]?.last24h || 0) }
}

export async function clearErrors() {
  await ensureErrorTable()
  await db.execute(sql`DELETE FROM error_logs`)
}
