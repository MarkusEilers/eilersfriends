import type { Metadata } from 'next'
import { Mail, MapPin, Clock, Linkedin, Youtube, Instagram, Calendar } from 'lucide-react'
import { ContactForm } from './ContactForm'
import { getSetting } from '@/lib/db/queries/settings'

export const metadata: Metadata = {
  title: 'Kontakt — Eilers+Friends',
  description:
    'Hast du Fragen zu unseren Programmen oder möchtest du ein unverbindliches Strategie-Gespräch vereinbaren? Wir freuen uns auf deine Nachricht.',
}

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function KontaktPage({ params }: PageProps) {
  await params // locale not needed — Link from i18n nav resolves it

  const [calendlyMarkus, calendlyAljona] = await Promise.all([
    getSetting('calendly.markus'),
    getSetting('calendly.aljona'),
  ])

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* Hero */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'white', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
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

            {/* Strategie-Gespräch · Aljona (ladies first) */}
            <div
              className="rounded-3xl p-6 text-white"
              style={{ backgroundColor: '#EB0028' }}
            >
              <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/aljona-photo.jpg"
                  alt="Aljona Eilers"
                  className="h-12 w-12 rounded-full object-cover ring-2"
                  style={{ objectPosition: '50% 18%', boxShadow: '0 0 0 2px rgba(255,255,255,0.35)' }}
                />
                <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Liquid Leadership</div>
              </div>
              <h3 className="text-lg font-bold">30 Min mit Aljona</h3>
              <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Sparring zu Führung, Kultur und der nächsten Wachstumsstufe als Unternehmer:in.
              </p>
              <a
                href={calendlyAljona}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ color: '#EB0028' }}
              >
                <Calendar size={14} /> Termin mit Aljona
              </a>
            </div>

            {/* Strategie-Gespräch · Markus */}
            <div
              className="rounded-3xl p-6 text-white"
              style={{ backgroundColor: '#1A5FD4' }}
            >
              <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/markus-photo.jpg"
                  alt="Markus Eilers"
                  className="h-12 w-12 rounded-full object-cover ring-2"
                  style={{ objectPosition: '50% 20%', boxShadow: '0 0 0 2px rgba(255,255,255,0.35)' }}
                />
                <div className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Sales · Revenue</div>
              </div>
              <h3 className="text-lg font-bold">30 Min mit Markus</h3>
              <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Strategisches Sparring zu Vertriebssystem, AI-Hebeln und planbarem Wachstum.
              </p>
              <a
                href={calendlyMarkus}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ color: '#1A5FD4' }}
              >
                <Calendar size={14} /> Termin mit Markus
              </a>
            </div>

            {/* Info cards */}
            <div className="rounded-3xl bg-white p-6 border border-gray-100">
              <div className="space-y-5">
                <div className="flex gap-4">
                  <Mail size={18} style={{ color: '#1A5FD4' }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">E-Mail</p>
                    <a href="mailto:team@eilersfriends.com" className="text-sm" style={{ color: '#0D0D0B' }}>
                      team@eilersfriends.com
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <MapPin size={18} style={{ color: '#1A5FD4' }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Standort</p>
                    <p className="text-sm" style={{ color: '#0D0D0B' }}>
                      Eilers+Friends, uphill ventures GmbH<br />
                      Blütenäcker 55/2<br />
                      71332 Waiblingen<br />
                      Deutschland
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Clock size={18} style={{ color: '#1A5FD4' }} className="mt-0.5 flex-shrink-0" />
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
              {/* Row 1: Aljona — LinkedIn, Instagram, Liquid Leadership YouTube */}
              <div className="flex flex-wrap gap-2">
                <a href="https://www.linkedin.com/in/aljona-eilers-812b65194/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-50" style={{ color: '#EB0028', borderColor: '#F5BBBC' }}>
                  <Linkedin size={12} /> Aljona
                </a>
                <a href="https://www.instagram.com/aljona_eilers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-50" style={{ color: '#EB0028', borderColor: '#F5BBBC' }}>
                  <Instagram size={12} /> Aljona
                </a>
                <a href="https://www.youtube.com/@liquid.leadership" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-50" style={{ color: '#EB0028', borderColor: '#F5BBBC' }}>
                  <Youtube size={12} /> Liquid Leadership
                </a>
              </div>
              {/* Row 2: Markus — LinkedIn, YouTube */}
              <div className="mt-2 flex flex-wrap gap-2">
                <a href="https://linkedin.com/in/markuseilers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-blue-50" style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}>
                  <Linkedin size={12} /> Markus
                </a>
                <a href="https://youtube.com/@markuseilers" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-blue-50" style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}>
                  <Youtube size={12} /> Markus
                </a>
              </div>
            </div>

          </aside>
        </div>
      </section>

    </main>
  )
}
