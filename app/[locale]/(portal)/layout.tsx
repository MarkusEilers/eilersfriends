import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { MemberShell } from '@/components/portal/MemberShell'
import { ViewAsBar } from '@/components/portal/ViewAsBar'
import { viewer, getMember, scoreSeries, startData } from '@/lib/portal/member'

/** Kundenbereich: nicht in die Suche. */
export const metadata: Metadata = { robots: { index: false, follow: false } }

const ROLE: Record<string, string> = { owner: 'Owner', admin: 'PowerUser', lead: 'Lead', member: 'Member', viewer: 'Viewer' }

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const v = await viewer()
  const m = v ? await getMember(v.userId).catch(() => null) : null
  const isEf = session.user?.role === 'admin' || session.user?.role === 'coach'

  let hasRollouts = false, hasStrategy = false, hasLeadradar = false
  if (m?.companyId) {
    const r = (await db.execute(sql`
      SELECT
        EXISTS (SELECT 1 FROM rollouts WHERE company_id = ${m.companyId}) AS ro,
        EXISTS (SELECT 1 FROM rollouts r JOIN programs p ON p.id = r.program_id WHERE r.company_id = ${m.companyId} AND (p.name ILIKE '%13 Step%' OR p.name ILIKE '%GTM%')) AS gtm`).catch(() => [])) as unknown as { ro: boolean; gtm: boolean }[]
    hasRollouts = !!r[0]?.ro; hasStrategy = !!r[0]?.gtm
    const lr = (await db.execute(sql`SELECT to_regclass('public.lead_radar') IS NOT NULL AS t`).catch(() => [])) as unknown as { t: boolean }[]
    if (lr[0]?.t) {
      const c = (await db.execute(sql`SELECT EXISTS (SELECT 1 FROM lead_radar WHERE company_id = ${m.companyId}) AS x`).catch(() => [])) as unknown as { x: boolean }[]
      hasLeadradar = !!c[0]?.x
    }
  }

  const series = m ? await scoreSeries(m.email) : []
  const score = series.length ? { value: series.at(-1)!.overall, delta: series.length > 1 ? series.at(-1)!.overall - series[0].overall : null } : null
  const sd = m ? await startData(m, session.user?.role ?? 'client').catch(() => null) : null
  const subtitle = [m?.title, m?.teamName ? `Team ${m.teamName}` : null, m?.orgRole ? ROLE[m.orgRole] : null].filter(Boolean)[0] ?? (m?.companyName ?? '')

  return (
    <MemberShell
      member={{ name: m?.name ?? session.user?.name ?? '', initials: m?.initials ?? '?', avatarUrl: m?.avatarUrl ?? null, subtitle: String(subtitle), plans: m?.plans ?? [] }}
      notices={(sd?.todos ?? []).map((t) => ({ id: t.id, title: t.title, sub: t.sub, href: t.href }))}
      nav={{ guide: hasRollouts || isEf, strategy: hasStrategy || isEf, leadradar: hasLeadradar, admin: isEf }}
      score={score}
    >
      {isEf && <ViewAsBar />}
      <div className="mx-auto w-full max-w-[1260px] px-5 pb-20 pt-8 sm:px-10 lg:pt-10">{children}</div>
    </MemberShell>
  )
}
