import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ensureRolloutSchema } from './schema'
import { effective, type Override, type Snapshot } from './core'

/**
 * Signal-Mails — vorerst nur als Entwurf.
 *
 * Zwei Anlässe je Schritt:
 *  - preview: 7 Tage vor Beginn — was kommt, was mitbringen
 *  - recap:   2 Tage nach Ende, wenn Outputs noch offen sind
 * Empfänger sind die Mitglieder der Teams, die am Schritt beteiligt sind.
 * Eilers+Friends prüft, ändert und gibt frei; nichts geht automatisch raus.
 */

const T = {
  de: {
    previewSubject: (code: string, title: string, date: string) => `Am ${date}: ${code} ${title} — was Du mitbringst`,
    recapSubject: (code: string, title: string) => `${code} ${title}: noch offen`,
    hello: (n: string) => `Hallo ${n},`,
    previewIntro: (title: string, date: string) => `am ${date} startet „${title}". Damit die Session trägt, bring bitte mit:`,
    recapIntro: (title: string) => `„${title}" ist durch. Diese Ergebnisse sind im Programm Guide noch nicht abgehakt:`,
    leave: 'Danach liegt vor:',
    link: 'Alles dazu im Programm Guide:',
    bye: 'Viele Grüße\nMarkus',
  },
  en: {
    previewSubject: (code: string, title: string, date: string) => `${date}: ${code} ${title} — what to bring`,
    recapSubject: (code: string, title: string) => `${code} ${title}: still open`,
    hello: (n: string) => `Hi ${n},`,
    previewIntro: (title: string, date: string) => `"${title}" starts on ${date}. To make the session count, please bring:`,
    recapIntro: (title: string) => `"${title}" is done. These outputs are not yet ticked off in the Program Guide:`,
    leave: 'You will leave with:',
    link: 'Everything in the Program Guide:',
    bye: 'Best regards\nMarkus',
  },
}

const fmt = (d: string, locale: string) => new Date(d + 'T12:00:00Z').toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long' })

export async function buildSignalDrafts(today = new Date().toISOString().slice(0, 10)) {
  await ensureRolloutSchema()
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eilersfriends.com'
  const steps = (await db.execute(sql`
    SELECT rs.id, rs.code, rs.step_key, rs.override, rs.planned_start::text AS planned_start, rs.planned_end::text AS planned_end,
           r.company_id, r.locale, v.snapshot,
           CASE WHEN rs.planned_start BETWEEN ${today}::date + 6 AND ${today}::date + 8 THEN 'preview'
                WHEN rs.planned_end + 2 = ${today}::date THEN 'recap' END AS kind
    FROM rollout_steps rs JOIN rollouts r ON r.id=rs.rollout_id JOIN program_versions v ON v.id=r.program_version_id
    WHERE r.status='active' AND rs.status <> 'done' AND (
      rs.planned_start BETWEEN ${today}::date + 6 AND ${today}::date + 8 OR rs.planned_end + 2 = ${today}::date)`)) as unknown as
    { id: string; code: string; step_key: string; override: Override; planned_start: string; planned_end: string; company_id: string; locale: string; snapshot: Snapshot; kind: 'preview' | 'recap' }[]

  let created = 0
  for (const s of steps) {
    const st = s.snapshot.steps.find((x) => x.id === s.step_key)
    if (!st || !st.teams.length) continue
    const eff = effective(st, s.locale, s.override ?? {})
    const L = s.locale === 'de' ? T.de : T.en
    let lines: string[]
    if (s.kind === 'recap') {
      const open = (await db.execute(sql`SELECT label FROM rollout_items WHERE rollout_step_id=${s.id} AND kind='output' AND done_at IS NULL ORDER BY sort_order`)) as unknown as { label: string }[]
      if (!open.length) continue
      lines = [L.recapIntro(eff.title), ...open.map((o) => `– ${o.label}`)]
    } else {
      lines = [L.previewIntro(eff.title, fmt(s.planned_start, s.locale)), ...eff.inputs.map((i) => `– ${i}`), '', L.leave, ...eff.outputs.map((o) => `– ${o}`)]
    }
    const subject = s.kind === 'recap' ? L.recapSubject(s.code, eff.title) : L.previewSubject(s.code, eff.title, fmt(s.planned_start, s.locale))
    const people = (await db.execute(sql`
      SELECT DISTINCT u.id, u.email, u.name FROM org_memberships m JOIN org_teams t ON t.id=m.team_id JOIN users u ON u.id=m.user_id
      WHERE m.company_id=${s.company_id} AND t.program_role_key = ANY(${'{' + st.teams.join(',') + '}'}::text[])`)) as unknown as { id: string; email: string; name: string }[]
    for (const p of people) {
      const first = (p.name || '').split(/\s+/)[0] || ''
      const body = [L.hello(first), '', ...lines, '', `${L.link} ${base}/dashboard/guide`, '', L.bye].join('\n')
      const r = (await db.execute(sql`
        INSERT INTO signal_queue (rollout_step_id, kind, recipient_user_id, recipient_email, subject, body_text, scheduled_for)
        VALUES (${s.id}, ${s.kind}, ${p.id}, ${p.email}, ${subject}, ${body}, ${today})
        ON CONFLICT (rollout_step_id, kind, recipient_email) DO NOTHING RETURNING id`)) as unknown as { id: string }[]
      created += r.length
    }
  }
  return { steps: steps.length, created }
}
