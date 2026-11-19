/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { viewer, getMember, BELTS } from '@/lib/portal/member'
import { ProfileForm } from '@/components/portal/ProfileForm'

export const dynamic = 'force-dynamic'

const muted = '#605D5D'
const card = 'rounded-[24px] bg-white p-7 shadow-[0_1px_2px_rgba(14,23,51,.05),0_18px_40px_-18px_rgba(14,23,51,.18)]'
const ROLE: Record<string, string> = { owner: 'Owner', admin: 'PowerUser', lead: 'Team-Lead', member: 'Mitglied', viewer: 'Lesezugriff' }

/** Profil: bearbeiten, Foto, Skill-Level (Gürtel der Academy), Abos. */
export default async function ProfilePage() {
  const v = await viewer()
  if (!v) redirect('/auth/login')
  const m = await getMember(v.userId)
  if (!m) redirect('/auth/login')
  const meta = [m.title, m.companyName, m.teamName ? `Team ${m.teamName}` : null, m.orgRole ? ROLE[m.orgRole] : null].filter(Boolean).join(' · ')
  const academy = m.plans.some((p) => /academy/i.test(p.label))
  const here = m.belt ? BELTS.findIndex((b) => b.key === m.belt) : academy ? 0 : -1

  return (
    <div className="flex flex-col gap-7">
      <h1 className="m-0 text-[30px] font-bold tracking-[-.02em]">Profil</h1>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className={card}>
          <ProfileForm readOnly={v.preview} initial={{ name: m.name, initials: m.initials, avatarUrl: m.avatarUrl, headline: m.headline ?? '', linkedin: m.linkedin ?? '', bio: m.bio ?? '', phone: m.phone ?? '', email: m.email, meta }} />
        </div>
        <div className="flex flex-col gap-6">
          <div className={card}>
            <b className="text-[16px]">Abos und Programme</b>
            {m.plans.length ? (
              <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
                {m.plans.map((p) => (
                  <li key={p.label} className="flex items-start justify-between gap-3">
                    <span><span className="block text-[15px] font-semibold">{p.label}</span>
                      <span className="block text-[13px]" style={{ color: muted }}>{p.kind === 'corporate' ? 'über Deine Firma · für Dich kostenlos' : p.kind === 'program' ? 'Programm Deiner Firma' : 'persönliches Abo'}</span></span>
                    {p.kind === 'corporate' && <span className="rounded-full border-[1.5px] border-[#C9D8F5] bg-[#EBF1FF] px-2.5 py-0.5 text-[12px] font-semibold text-[#124293]">Corporate</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-[14px]" style={{ color: muted }}>Noch kein Abo oder Programm. Frameworks und der Gesprächs-Check sind kostenlos.</p>}
            <Link href={'/dashboard/billing' as '/'} className="mt-4 inline-block text-[14px] font-bold text-[#1A5FD4] no-underline">Rechnungen →</Link>
          </div>

          <div className={card}>
            <b className="text-[16px]">Dein Skill-Level</b>
            <p className="mb-0 mt-1.5 text-[13px] leading-relaxed" style={{ color: muted }}>Sechs Stufen wie auf der Academy-Seite. Freigeschaltet durch abgeschlossene Module, bestandene Sparrings und echte Deal-Ergebnisse, nicht durch Klicks.</p>
            <ol className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {BELTS.map((b, i) => (
                <li key={b.key} className="flex items-center gap-3">
                  <img src={`/academy/belts/${b.belt}.png`} alt="" className="h-6 w-16 flex-none object-contain" style={{ opacity: i === here ? 1 : 0.45 }} />
                  <span className="min-w-0 flex-1"><span className="text-[14px] font-semibold">{b.name}</span> <span className="text-[12px]" style={{ color: muted }}>· {b.months}</span></span>
                  {i === here && <span className="rounded-full bg-[#EBF1FF] px-2.5 py-0.5 text-[12px] font-bold text-[#124293]">Du bist hier</span>}
                </li>
              ))}
            </ol>
            {here < 0 && <p className="mb-0 mt-3 text-[13px]" style={{ color: muted }}>Die Einstufung beginnt mit der SalesMade Academy.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
