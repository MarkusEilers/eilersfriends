import { NextResponse } from 'next/server'
import { readReportToken } from '@/lib/ask/tokens'
import { confirm, getSubmission } from '@/lib/ask/store'
import { getFunnel } from '@/lib/ask/registry'
import { notifyLead } from '@/lib/ask/mail'
import { upsertCompanyByDomain } from '@/lib/db/queries/companies'
import { upsertContact } from '@/lib/meetings/queries'
import { workDomain } from '@/lib/util/email'
import { trackEvent } from '@/lib/scoring/core'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Double-Opt-In. Beim ersten Klick: Kontakt und Firma im CRM anlegen (Dedup über
 * Adresse und Domain), Lead-Scoring, Nachricht an Markus. Danach weiter zum Report.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const tok = url.searchParams.get('t') ?? ''
  const id = readReportToken(tok)
  const s = id ? await getSubmission(id) : null
  if (!s || !s.contact) return NextResponse.redirect(`${url.origin}/check/bottleneck?invalid=1`)
  const f = getFunnel(s.funnel)
  const prefix = s.lang === 'de' ? '' : `/${s.lang}`
  const target = `${url.origin}${prefix}/check/${s.funnel}/report/${tok}`
  if (!f) return NextResponse.redirect(target)

  if (await confirm(s.id)) {
    try {
      const c = s.contact
      const domain = workDomain(c.email)
      const orgId = domain ? await upsertCompanyByDomain(domain, c.company) : null
      const contactId = await upsertContact({ email: c.email, name: c.firstName, orgId, source: `ask:${s.funnel}` })
      await db.execute(sql`UPDATE contacts SET phone = COALESCE(phone, ${c.phone}),
        consent = consent || ${JSON.stringify({ [`ask:${s.funnel}`]: new Date().toISOString() })}::jsonb WHERE id = ${contactId}`)
      await db.execute(sql`UPDATE ask_submissions SET contact_id = ${contactId} WHERE id = ${s.id}`)
      if (s.vid) await trackEvent({ vid: s.vid, kind: 'optin', key: `ask:${s.funnel}`, payload: { company: c.company, first: s.result.first } })
      await notifyLead(f.def, s)
    } catch (e) {
      console.error('[ask] confirm side effects failed', e)
    }
  }
  return NextResponse.redirect(target)
}
