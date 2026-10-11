'use server'

import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { ensureRolloutSchema } from '@/lib/rollouts/schema'
import { releaseVersion, reschedule } from '@/lib/rollouts/core'
import { createInvite } from '@/lib/org/invite'
import { sendEmail } from '@/lib/email/resend'

async function requireEf() {
  const s = await auth()
  if (!s?.user?.role || (s.user.role !== 'admin' && s.user.role !== 'coach')) throw new Error('unauthorized')
  await ensureRolloutSchema()
  return s.user
}
const nn = (v: FormDataEntryValue | null) => { const x = (v?.toString() ?? '').trim(); return x === '' ? null : x }

/* ── Versionen ── */
export async function releaseProgramVersion(fd: FormData) {
  const u = await requireEf()
  const programId = fd.get('programId')?.toString(); if (!programId) return
  await releaseVersion(programId, { changelog: nn(fd.get('changelog')) ?? undefined, by: u.id ?? null })
  revalidatePath(`/admin/programs/${programId}`)
}

/* ── Einladungen ── */
export async function createInviteLink(userId: string, companyId: string): Promise<{ url: string }> {
  const u = await requireEf()
  const token = await createInvite(userId, u.id ?? null)
  revalidatePath(`/admin/companies/${companyId}`)
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eilersfriends.com'
  return { url: `${base}/auth/invite/${token}` }
}

/* ── Änderungsvorschläge ── */
export async function decideChange(fd: FormData) {
  const u = await requireEf()
  const id = fd.get('id')?.toString(); const decision = fd.get('decision')?.toString(); const companyId = fd.get('companyId')?.toString()
  if (!id || (decision !== 'accepted' && decision !== 'rejected')) return
  const [c] = (await db.execute(sql`SELECT rollout_id, rollout_step_id, kind, payload FROM rollout_changes WHERE id=${id} AND status='proposed'`)) as unknown as
    { rollout_id: string; rollout_step_id: string | null; kind: string; payload: { proposedStart?: string | null; cadence?: string | null } }[]
  if (!c) return
  if (decision === 'accepted') {
    if (c.payload?.cadence === 'weekly' || c.payload?.cadence === 'biweekly') {
      await db.execute(sql`UPDATE rollouts SET cadence=${c.payload.cadence}, updated_at=now() WHERE id=${c.rollout_id}`)
      await reschedule(c.rollout_id)
    }
    if (c.payload?.proposedStart && c.rollout_step_id) {
      const ps = c.payload.proposedStart
      await db.execute(sql`
        UPDATE rollout_steps SET planned_end = ${ps}::date + (planned_end - planned_start), planned_start=${ps}, updated_at=now()
        WHERE id=${c.rollout_step_id}`)
    }
  }
  await db.execute(sql`UPDATE rollout_changes SET status=${decision}, decided_by=${u.id ?? null}, decided_at=now(), decision_note=${nn(fd.get('note'))} WHERE id=${id}`)
  if (companyId) revalidatePath(`/admin/companies/${companyId}`)
}

/* ── Material am Schritt ── */
export async function addStepResource(fd: FormData) {
  await requireEf()
  const stepId = fd.get('stepId')?.toString(); const programId = fd.get('programId')?.toString(); const title = nn(fd.get('title'))
  if (!stepId || !programId || !title) return
  const audience = (fd.get('audience')?.toString() ?? '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
  const off = nn(fd.get('offsetDays'))
  await db.execute(sql`
    INSERT INTO step_resources (program_step_id, kind, title, body, url, audience, offset_days, is_internal, sort_order)
    VALUES (${stepId}, ${fd.get('kind')?.toString() || 'resource'}, ${title}, ${nn(fd.get('body'))}, ${nn(fd.get('url'))},
            ${'{' + audience.join(',') + '}'}::text[], ${off ? Number(off) : null}, ${fd.get('isInternal') === '1'},
            COALESCE((SELECT max(sort_order)+1 FROM step_resources WHERE program_step_id=${stepId}), 0))`)
  revalidatePath(`/admin/programs/${programId}`)
}
export async function deleteStepResource(fd: FormData) {
  await requireEf()
  const id = fd.get('id')?.toString(); const programId = fd.get('programId')?.toString(); if (!id) return
  await db.execute(sql`DELETE FROM step_resources WHERE id=${id}`)
  if (programId) revalidatePath(`/admin/programs/${programId}`)
}

/* ── Signal-Mails ── */
export async function setSignalStatus(fd: FormData) {
  const u = await requireEf()
  const id = fd.get('id')?.toString(); const status = fd.get('status')?.toString()
  if (!id || !status) return
  if (status === 'send') {
    const [m] = (await db.execute(sql`SELECT recipient_email, subject, body_text, status FROM signal_queue WHERE id=${id}`)) as unknown as { recipient_email: string; subject: string; body_text: string; status: string }[]
    if (!m || m.status === 'sent') return
    try {
      const html = m.body_text.split('\n').map((l) => l.trim() ? `<p style="margin:0 0 10px">${l.replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch] as string))}</p>` : '').join('')
      await sendEmail({ to: m.recipient_email, subject: m.subject, html, text: m.body_text, fromName: 'Markus Eilers · Eilers+Friends' })
      await db.execute(sql`UPDATE signal_queue SET status='sent', sent_at=now(), approved_by=${u.id ?? null}, approved_at=COALESCE(approved_at, now()), error=NULL WHERE id=${id}`)
    } catch (e) {
      await db.execute(sql`UPDATE signal_queue SET error=${String((e as Error).message).slice(0, 500)} WHERE id=${id}`)
    }
  } else if (status === 'approved' || status === 'skipped' || status === 'draft') {
    await db.execute(sql`UPDATE signal_queue SET status=${status}, approved_by=${status === 'approved' ? u.id ?? null : null}, approved_at=${status === 'approved' ? sql`now()` : null} WHERE id=${id} AND status <> 'sent'`)
  }
  revalidatePath('/admin/signals')
}
export async function updateSignalText(fd: FormData) {
  await requireEf()
  const id = fd.get('id')?.toString(); if (!id) return
  await db.execute(sql`UPDATE signal_queue SET subject=${fd.get('subject')?.toString() ?? ''}, body_text=${fd.get('body')?.toString() ?? ''} WHERE id=${id} AND status <> 'sent'`)
  revalidatePath('/admin/signals')
}
