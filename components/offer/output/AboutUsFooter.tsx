import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Mail } from 'lucide-react'

/**
 * About-Us-Footer im Angebot — Markus + Aljona Avatare, Bio, Calendly-Links.
 * Soll zeigen: hinter dem Angebot stehen zwei Menschen, nicht ein Funnel.
 */
export function AboutUsFooter({
  markusCalendly = '/schedule/markus/kennenlernen-30',
  aljonaCalendly = '/schedule/aljona',
}: {
  markusCalendly?: string
  aljonaCalendly?: string
}) {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#0F1E3A' }}>
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5DDBF5' }}>
            Wer hinter diesem Angebot steht
          </span>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Zwei Menschen. Eine Mission.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Wir helfen Gründer:innen und Vertriebsteams seit 25 Jahren dabei, aus Wissen echte Fähigkeit zu machen — messbar, reproduzierbar, skalierbar.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <CoachCard
            name="Markus Eilers"
            role="Revenue Systems · B2B-Vertrieb"
            photo="/markus-photo.jpg"
            bio="Kundengewinnungs-Profi mit 25 Jahren Erfahrung im B2B-Vertrieb. Hat über 500 Gründer:innen geholfen, planbares Umsatzwachstum aufzubauen."
            calendlyUrl={markusCalendly}
            accent="#1A5FD4"
          />
          <CoachCard
            name="Aljona Eilers"
            role="Liquid Leadership"
            photo="/aljona-photo.jpg"
            bio="TEDx Speaker, WSJ Bestseller-Autorin und ehemalige Bolshoi-Ballerina. Hat 500+ Führungskräfte als Leadership & Culture Coach begleitet — Transformational Leadership für Gründer:innen, die ihre nächste Stufe erreichen wollen."
            calendlyUrl={aljonaCalendly}
            accent="#D4192B"
          />
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Fragen zum Angebot? <Link href="mailto:markus@eilers.at" className="underline hover:text-white">markus@eilers.at</Link> — wir antworten persönlich.
          </p>
        </div>
      </div>
    </section>
  )
}

function CoachCard({ name, role, photo, bio, calendlyUrl, accent }: { name: string; role: string; photo: string; bio: string; calendlyUrl: string; accent: string }) {
  return (
    <div className="rounded-3xl p-7" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full" style={{ border: `2px solid ${accent}` }}>
          <Image src={photo} alt={name} width={96} height={96} className="h-full w-full object-cover" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <p className="text-xs" style={{ color: accent }}>{role}</p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {bio}
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent, color: '#fff' }}
        >
          <Calendar size={12} /> Direkt sprechen
        </Link>
      </div>
    </div>
  )
}
