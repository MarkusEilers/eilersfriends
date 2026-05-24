import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import crypto from 'crypto'

/**
 * API-Key-Auth für Public REST + MCP Endpoints.
 * Tokens haben Format `ef_live_<prefix>_<secret>` — der prefix-Teil ist
 * unique pro Key (für UI-Display + Index), der secret-Teil wird mit
 * SHA-256 gehasht in der DB gespeichert.
 */

export interface ApiKeyContext {
  id: string
  name: string
  scopes: string[]
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateApiKey(): { token: string; prefix: string; hash: string } {
  const prefix = 'ef_' + crypto.randomBytes(6).toString('hex')   // 12-char prefix
  const secret = crypto.randomBytes(24).toString('hex')           // 48-char secret
  const token = `${prefix}_${secret}`
  return { token, prefix, hash: hashToken(token) }
}

export async function verifyApiKey(authHeader: string | null): Promise<ApiKeyContext | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  if (!token.startsWith('ef_')) return null
  const tokenHash = hashToken(token)

  try {
    const res = await db.execute<{ id: string; name: string; scopes: unknown; active: boolean; expires_at: string | null }>(sql`
      SELECT id, name, scopes, active, expires_at::text as expires_at
      FROM api_keys
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `)
    const rows = res as unknown as { id: string; name: string; scopes: unknown; active: boolean; expires_at: string | null }[]
    const row = rows[0]
    if (!row) return null
    if (!row.active) return null
    if (row.expires_at && new Date(row.expires_at) < new Date()) return null

    // Touch last_used (fire-and-forget)
    db.execute(sql`UPDATE api_keys SET last_used_at = now() WHERE id = ${row.id}`).catch(() => {})

    const scopes = Array.isArray(row.scopes) ? (row.scopes as string[]) : []
    return { id: row.id, name: row.name, scopes }
  } catch (err) {
    console.error('[verifyApiKey] DB failed', err)
    return null
  }
}

export function hasScope(ctx: ApiKeyContext, needed: string): boolean {
  if (ctx.scopes.includes('*')) return true
  if (ctx.scopes.includes(needed)) return true
  // Wildcard support: 'subscribers:*' includes 'subscribers:read'
  const [resource] = needed.split(':')
  if (ctx.scopes.includes(`${resource}:*`)) return true
  return false
}
