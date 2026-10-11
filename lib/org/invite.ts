import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureRolloutSchema } from '@/lib/rollouts/schema'

/**
 * Einladung mit „Passwort setzen".
 *
 * Gespeichert wird nur der Hash des Tokens — wer die Datenbank liest, kann
 * damit kein Konto übernehmen. Ein Link gilt 14 Tage und genau einmal.
 * Versendet wird hier nichts: Der Link entsteht im Backend, wer ihn
 * weitergibt, entscheidet Eilers+Friends.
 */

const hash = (t: string) => createHash('sha256').update(t).digest('hex')

export async function createInvite(userId: string, createdBy: string | null): Promise<string> {
  await ensureRolloutSchema()
  const token = randomBytes(24).toString('base64url')
  await db.execute(sql`UPDATE user_invites SET expires_at=now() WHERE user_id=${userId} AND used_at IS NULL AND expires_at > now()`)
  await db.execute(sql`
    INSERT INTO user_invites (user_id, token_hash, expires_at, created_by)
    VALUES (${userId}, ${hash(token)}, now() + interval '14 days', ${createdBy})`)
  await db.execute(sql`UPDATE org_memberships SET invited_at=now(), updated_at=now() WHERE user_id=${userId}`)
  return token
}

export async function inviteInfo(token: string) {
  await ensureRolloutSchema()
  const rows = (await db.execute(sql`
    SELECT i.id, u.name, u.email, u.locale, i.expires_at < now() AS expired, i.used_at IS NOT NULL AS used
    FROM user_invites i JOIN users u ON u.id=i.user_id WHERE i.token_hash=${hash(token)}`)) as unknown as
    { id: string; name: string; email: string; locale: string; expired: boolean; used: boolean }[]
  return rows[0] ?? null
}

export async function acceptInvite(token: string, password: string): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  if (password.length < 8) return { ok: false, error: 'short' }
  const info = await inviteInfo(token)
  if (!info) return { ok: false, error: 'invalid' }
  if (info.used) return { ok: false, error: 'used' }
  if (info.expired) return { ok: false, error: 'expired' }
  const pw = await bcrypt.hash(password, 10)
  await db.execute(sql`UPDATE users SET password_hash=${pw}, updated_at=now() WHERE email=${info.email}`)
  await db.execute(sql`UPDATE user_invites SET used_at=now() WHERE id=${info.id}`)
  return { ok: true, email: info.email }
}
