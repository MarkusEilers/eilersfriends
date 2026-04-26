import Image from 'next/image'
import { Linkedin } from 'lucide-react'

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

export function LpCoachBio({ content }: { content: Record<string, unknown> }) {
  const coachKey = (content.coach as 'markus' | 'aljona') ?? 'markus'
  const coach = coaches[coachKey] ?? coaches.markus

  return (
    <section className="px-6 py-16" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center gap-8 sm:flex-row">
          <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl">
            <Image src={coach.photo} alt={coach.name} fill className="object-cover grayscale" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: coach.accent }}>
              Dein Coach
            </p>
            <h3 className="mt-1 text-2xl font-bold" style={{ color: '#0D0D0B' }}>{coach.name}</h3>
            <p className="text-sm text-gray-500">{coach.role}</p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{coach.bio}</p>
            <a
              href={coach.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: coach.accent }}
            >
              <Linkedin size={13} /> LinkedIn-Profil
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
