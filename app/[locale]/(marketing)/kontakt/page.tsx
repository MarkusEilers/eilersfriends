import type { Metadata } from 'next'
import { Mail, MapPin, Clock, Linkedin, Youtube, Instagram, Calendar } from 'lucide-react'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Kontakt — Eilers+Friends',
  description:
    'Hast du Fragen zu unseren Programmen oder möchtest du ein unverbindliches Strategie-Gespräch vereinbaren? Wir freuen uns auf deine Nachricht.',
}

export default function KontaktPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

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
            Lass uns gemeinsam wachsen
          </h1>
          <p className="text-lg text-gray-600">
            Hast du Fragen zu unseren Programmen oder möchtest du ein
            unverbindliches Strategie-Gespräch vereinbaren? Wir freuen uns auf
            deine Nachricht.
          </p>
        </div>
      </section>

      {/* Form + Side Info */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1fr_360px]">

          {/* Form */}
          <div className="rounded-3xl bg-white p-8 border border-gray-100 shadow-sm">
            <ContactForm />
          </div>

          {/* Side panel */}
          <aside className="space-y-6">

            {/* Strategie-Gespräch */}
            <div
              className="rounded-3xl p-6 text-white"
              style={{ backgroundColor: '#F05A1A' }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Calendar size={20} />
              </div>
              <h3 className="text-lg font-bold">Strategie-Gespräch buchen</h3>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                30 Minuten, die dein Business verändern können.
              </p>
              <a
                href="https://calendly.com/eilersfriends"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ color: '#F05A1A' }}
              >
                Termin vereinbaren
              </a>
            </div>

            {/* Info cards */}
            <div className="rounded-3xl bg-white p-6 border border-gray-100">
              <div className="space-y-5">
                <div className="flex gap-4">
                  <Mail size={18} style={{ color: '#F05A1A' }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">E-Mail</p>
                    <a href="mailto:team@eilersfriends.com" className="text-sm" style={{ color: '#0D0D0B' }}>
                      team@eilersfriends.com
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <MapPin size={18} style={{ color: '#F05A1A' }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Standort</p>
                    <p className="text-sm" style={{ color: '#0D0D0B' }}>
                      Eilers+Friends, uphill ventures GmbH<br />
                      c/o Markus Eilers<br />
                      Hamburg, Deutschland
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Clock size={18} style={{ color: '#F05A1A' }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Erreichbarkeit</p>
                    <p className="text-sm" style={{ color: '#0D0D0B' }}>Mo–Fr: 9:00 – 18:00 Uhr</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="rounded-3xl bg-white p-6 border border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Social</p>
              <div className="flex flex-wrap gap-2">
                <a href="https://linkedin.com/in/markuseilers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-blue-50" style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}>
                  <Linkedin size={12} /> Markus
                </a>
                <a href="https://youtube.com/@markuseilers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-50" style={{ color: '#D4192B', borderColor: '#F5BBBC' }}>
                  <Youtube size={12} /> Markus
                </a>
                <a href="https://www.linkedin.com/in/aljona-eilers-812b65194/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-50" style={{ color: '#D4192B', borderColor: '#F5BBBC' }}>
                  <Linkedin size={12} /> Aljona
                </a>
                <a href="https://www.instagram.com/aljona_eilers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-50" style={{ color: '#D4192B', borderColor: '#F5BBBC' }}>
                  <Instagram size={12} /> Aljona
                </a>
              </div>
            </div>

          </aside>
        </div>
      </section>

    </main>
  )
}
