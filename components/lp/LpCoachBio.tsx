import Image from 'next/image'
import { Linkedin, Youtube, Instagram } from 'lucide-react'

const coaches = {
  markus: {
    name: 'Markus Eilers',
    role: 'Vertriebs- & Business-Coach',
    photo: '/markus-photo.jpg',
    linkedin: 'https://linkedin.com/in/markuseilers',
    accent: '#1A5FD4',
    bio: 'Markus hat 500+ Gründer und Vertriebsteams dabei begleitet, planbare Umsätze durch skalierbare Revenue Systems aufzubauen.',
  },
  aljona: {
    name: 'Aljona Eilers',
    role: 'Transformational Leadership Coach',
    photo: '/aljona-photo.jpg',
    linkedin: 'https://linkedin.com/in/aljonaeilers',
    accent: '#D4192B',
    bio: 'Aljona begleitet Führungskräfte und Gründer:innen auf dem Weg zu authentischer, wirkungsvoller Leadership.',
  },
}

export function LpCoachBio({ content }: { content: Record<string, any> }) {
  // Inline bio from template (Welsh-style) takes precedence over coach key reference
  const inlineName = content.name as string | undefined
  const inlineRole = content.role as string | undefined
  const inlinePhoto = content.photoUrl as string | undefined
  const inlineBio = content.bio as string | undefined
  const inlineSocials = (content.socials ?? {}) as { linkedin?: string; youtube?: string; instagram?: string }

  let name: string, role: string, photo: string, bio: string, accent: string
  let linkedin: string | undefined
  let youtube: string | undefined
  let instagram: string | undefined

  if (inlineName) {
    name = inlineName
    role = inlineRole ?? ''
    photo = inlinePhoto ?? '/markus-photo.jpg'
    bio = inlineBio ?? ''
    // Default accent: blue for revenue, red for leadership; templates can override
    accent = (content.accent as string) ?? '#1A5FD4'
    linkedin = inlineSocials.linkedin
    youtube = inlineSocials.youtube
    instagram = inlineSocials.instagram
  } else {
    const coachKey = (content.coach as 'markus' | 'aljona') ?? 'markus'
    const coach = coaches[coachKey] ?? coaches.markus
    name = coach.name
    role = coach.role
    photo = coach.photo
    bio = coach.bio
    accent = coach.accent
    linkedin = coach.linkedin
  }

  return (
    <section className="px-6 py-16" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-3xl">
        {content.eyebrow && (
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-6" style={{ color: accent }}>
            {content.eyebrow as string}
          </p>
        )}
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl">
            <Image src={photo} alt={name} fill className="object-cover grayscale" />
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ color: '#0D0D0B' }}>{name}</h3>
            {role && <p className="text-sm text-gray-500">{role}</p>}
            {bio && <p className="mt-3 text-sm leading-relaxed text-gray-600 whitespace-pre-line">{bio}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              {linkedin && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: accent }}>
                  <Linkedin size={13} /> LinkedIn
                </a>
              )}
              {youtube && (
                <a href={youtube} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: accent }}>
                  <Youtube size={13} /> YouTube
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: accent }}>
                  <Instagram size={13} /> Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
