import type { Metadata } from 'next'
import { Mail, Linkedin, Instagram, Youtube, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kontakt — Eilers+Friends',
  description: 'Schreib uns oder buche direkt ein kostenloses Strategiegespräch.',
}

export default function KontaktPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* Hero */}
      <section className="px-6 py-20" style={{ backgroundColor: '#FFF1EB' }}>
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'white', color: '#F05A1A', border: '1px solid #FECDBB' }}
          >
            Kontakt
          </span>
          <h1 className="text-4xl font-bold sm:text-5xl mb-4" style={{ color: '#0D0D0B' }}>
            Lass uns sprechen
          </h1>
          <p className="text-lg text-gray-600">
            Du hast Fragen zu unseren Programmen, möchtest ein Strategiegespräch buchen
            oder einfach hallo sagen? Wir freuen uns auf Deine Nachricht.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl grid gap-10 lg:grid-cols-2">

          {/* Left: Booking CTA */}
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0D0D0B' }}>
              Kostenloses Strategiegespräch
            </h2>
            <p className="text-base text-gray-600 mb-8">
              In 45 Minuten schauen wir gemeinsam, wo Dein größtes Wachstumspotenzial liegt —
              und welches Programm am besten zu Dir passt. Kostenlos & unverbindlich.
            </p>

            <a
              href="https://calendly.com/eilersfriends"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-2xl px-8 py-5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 mb-10"
              style={{ backgroundColor: '#F05A1A' }}
            >
              <Calendar size={18} />
              Jetzt Termin buchen
            </a>

            {/* Coaches */}
            <div className="space-y-8">

              <div>
                <h3 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>Markus Eilers</h3>
                <p className="text-sm text-gray-500 mb-3">Revenue Systems · B2B-Vertrieb</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="mailto:markus@eilersfriends.com"
                    className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-blue-50"
                    style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}
                  >
                    <Mail size={13} /> markus@eilersfriends.com
                  </a>
                  <a
                    href="https://linkedin.com/in/markuseilers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-blue-50"
                    style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}
                  >
                    <Linkedin size={13} /> LinkedIn
                  </a>
                  <a
                    href="https://youtube.com/@markuseilers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-red-50"
                    style={{ color: '#D4192B', borderColor: '#F5BBBC' }}
                  >
                    <Youtube size={13} /> YouTube
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold mb-3" style={{ color: '#0D0D0B' }}>Aljona Eilers</h3>
                <p className="text-sm text-gray-500 mb-3">Transformational Leadership · Liquid Leadership</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://www.linkedin.com/in/aljona-eilers-812b65194/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-red-50"
                    style={{ color: '#D4192B', borderColor: '#F5BBBC' }}
                  >
                    <Linkedin size={13} /> LinkedIn
                  </a>
                  <a
                    href="https://www.instagram.com/aljona_eilers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-red-50"
                    style={{ color: '#D4192B', borderColor: '#F5BBBC' }}
                  >
                    <Instagram size={13} /> Instagram
                  </a>
                  <a
                    href="https://www.youtube.com/@leadershe.by.aljona.eilers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-red-50"
                    style={{ color: '#D4192B', borderColor: '#F5BBBC' }}
                  >
                    <Youtube size={13} /> YouTube
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Right: Company info */}
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0D0D0B' }}>
              Unternehmensdaten
            </h2>
            <div
              className="rounded-3xl p-8 space-y-5"
              style={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Unternehmen</p>
                <p className="text-sm text-gray-700">Eilers+Friends, uphill ventures GmbH</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Anschrift</p>
                <p className="text-sm text-gray-700">
                  Eilers+Friends, uphill ventures GmbH<br />
                  c/o Markus Eilers<br />
                  Hamburg, Deutschland
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">E-Mail</p>
                <a href="mailto:team@eilersfriends.com" className="text-sm" style={{ color: '#F05A1A' }}>
                  team@eilersfriends.com
                </a>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Website</p>
                <p className="text-sm text-gray-700">eilersfriends.com</p>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
