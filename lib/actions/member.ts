'use server'

import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { ensureMemberSchema } from '@/lib/portal/member'

/** Eigenes Profil speichern. Nur die angemeldete Person selbst, nie in der Vorschau „Ansehen als“. */
export async function saveProfileAction(fd: FormData): Promise<{ ok: boolean; error?: string }> {
  const s = await auth()
  if (!s?.user?.id) return { ok: false, error: 'Nicht angemeldet' }
  await ensureMemberSchema()
  const str = (k: string, n: number) => { const v = String(fd.get(k) ?? '').trim().slice(0, n); return v || null }
  const name = str('name', 120)
  if (!name) return { ok: false, error: 'Bitte gib Deinen Namen an.' }
  let linkedin = str('linkedin', 300)
  if (linkedin && !/^https?:\/\//.test(linkedin)) linkedin = `https://${linkedin}`
  await db.execute(sql`UPDATE users SET name = ${name}, updated_at = now() WHERE id = ${s.user.id}`)
  await db.execute(sql`
    INSERT INTO member_profiles (user_id, headline, linkedin, bio, phone, updated_at)
    VALUES (${s.user.id}, ${str('headline', 140)}, ${linkedin}, ${str('bio', 1200)}, ${str('phone', 40)}, now())
    ON CONFLICT (user_id) DO UPDATE SET headline = excluded.headline, linkedin = excluded.linkedin, bio = excluded.bio, phone = excluded.phone, updated_at = now()`)
  revalidatePath('/dashboard', 'layout')
  return { ok: true }
}
