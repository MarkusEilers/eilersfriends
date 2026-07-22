import Image from 'next/image'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import type { TeamMember } from '@/lib/offer/team'

/** About-Us-Footer im Angebot — gewählte Team-Mitglieder mit Bio + Direkt-Termin. */
export function AboutUsFooter({ members, customerName, offerLabel }: { members: TeamMember[]; customerName?: string; offerLabel?: string }) {
  const withParams = (url: string) => {
    const qs = new URLSearchParams()
    if (customerName) qs.set('name', customerName)
    if (offerLabel) qs.set('offer', offerLabel)
    const q = qs.toString()
    return q ? `${url}${url.includes('?') ? '&' : '?'}${q}` : url
  }
  const list = members.length ? members : []
  if (!list.length) return null
  const heading = list.length === 2 ? 'Zwei Menschen. Eine Mission.' : 'Die Menschen hinter diesem Angebot.'
  const cols = list.length === 1 ? 'md:grid-cols-1 md:max-w-md md:mx-auto' : list.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#0F1E3A' }}>
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>Wer hinter diesem Angebot steht</span>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{heading}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Wir helfen Gründer:innen und Vertriebsteams seit 25 Jahren dabei, aus Wissen echte Fähigkeit zu machen — messbar, reproduzierbar, skalierbar.
          </p>
        </div>

        <div className={`mt-12 grid gap-8 ${cols}`}>
          {list.map((m) => (
            <CoachCard key={m.key} name={m.name} role={m.role} photo={m.photo} bio={m.bio} calendlyUrl={withParams(m.calendly)} accent={m.accent} />
          ))}
        </div>
      </div>
    </section>
  )
}

function initials(name: string) { return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() }

function CoachCard({ name, role, photo, bio, calendlyUrl, accent }: { name: string; role: string; photo?: string; bio: string; calendlyUrl: string; accent: string }) {
  return (
    <div className="rounded-3xl p-7" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ border: `2px solid ${accent}`, backgroundColor: accent }}>
          {photo
            ? <Image src={photo} alt={name} width={96} height={96} className="h-full w-full object-cover" />
            : <span className="text-lg font-bold text-white">{initials(name)}</span>}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <p className="text-xs" style={{ color: accent }}>{role}</p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{bio}</p>
      <div className="mt-6 flex gap-3">
        <Link href={calendlyUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent, color: '#fff' }}>
          <Calendar size={12} /> Direkt sprechen
        </Link>
      </div>
    </div>
  )
}
