import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, ArrowRight, Mic, Award, Target, Lightbulb } from 'lucide-react'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Markus Eilers — Smarter Selling im KI-Zeitalter',
  description:
    'Gefragter Keynote Speaker für modernes Marketing, authentischen Vertrieb und wirksame Kundenkommunikation. TOP 100 Speaker · TEDx Speaker · Microsoft Cloud Ambassador.',
}

const TOPICS = [
  {
    title: 'Zukunft des B2B-Vertriebs',
    subtitle: 'So kauft und verkauft die Wirtschaft von morgen',
    points: [
      'Wie Organisationen künftig entscheiden — und was das für Ihr Vertriebsteam bedeutet',
      'Selling on Social',
      'Welche Rolle KI, Empathie und Vertrauen im modernen Verkaufsprozess spielen',
    ],
  },
  {
    title: 'Social Selling & Smart Communication',
    subtitle: 'Vertrauen & Sichtbarkeit im digitalen Zeitalter',
    points: [
      'Wie Du Vertrauen & Sichtbarkeit aufbaust, auch wenn Dich niemand kennt',
      'Selling on Social',
      'Was LinkedIn, Content & Kommunikation wirklich leisten können',
    ],
  },
  {
    title: 'Wachstum mit System',
    subtitle: 'Der Weg zu mehr Umsatz im Technologieumfeld',
    points: [
      'Die 3 einzigen Hebel für smarteres Wachstum, um Ihr Geschäft nachhaltig zu skalieren',
      'Wie Du Deine Bestandskunden zum Schlüssel für Dein Wachstum machst',
      'Wie Du mit klaren Botschaften und unwiderstehlichen Angeboten überzeugst',
    ],
  },
]

const CREDENTIALS = [
  {
    icon: Award,
    title: 'TOP 100 Speaker & Trainer',
    description: 'Ausgezeichnet als einer der gefragtesten Keynote Speaker im deutschsprachigen Raum',
  },
  {
    icon: Target,
    title: 'Microsoft Cloud Ambassador',
    description: 'Zertifizierter Experte und Berater für digitale Transformation und Cloud-Technologien',
  },
  {
    icon: Lightbulb,
    title: '25+ Jahre Erfahrung',
    description: 'Über zwei Jahrzehnte in Marketing, Vertrieb und Unternehmensberatung — von Start-ups bis Konzerne',
  },
  {
    icon: Mic,
    title: 'Praxisnah & Unterhaltsam',
    description: 'Keynotes mit hohem Nutzwert, empathischer Ansprache und echten Praxisbeispielen',
  },
]

const TESTIMONIALS = [
  {
    text: 'Markus hat unser Event mit seiner Keynote bereichert. Die Teilnehmer waren begeistert!',
    author: 'Sandra L.',
    role: 'Event-Managerin, Tech-Konferenz',
  },
  {
    text: 'Praxisnah, unterhaltsam und inspirierend. Genau das, was wir gesucht haben.',
    author: 'Michael K.',
    role: 'Head of Events, Verband',
  },
  {
    text: 'Die perfekte Mischung aus Fachwissen und Entertainment. Absolute Empfehlung!',
    author: 'Julia M.',
    role: 'Marketing Director, Enterprise',
  },
]

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function MarkusPage({ params }: PageProps) {
  const { locale } = await params
  if (locale !== 'de') redirect('/de/markus')

  const accent = '#1A5FD4'
  const navy = '#0F1E3A'

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28" style={{ backgroundColor: navy }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: 'rgba(26,95,212,0.25)', color: '#93B8F5' }}
            >
              TOP 100 Speaker · Microsoft Cloud Ambassador
            </span>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Smarter Selling — <span style={{ color: accent }}>Kunden wirksam überzeugen im KI-Zeitalter.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Gefragter Keynote Speaker für modernes Marketing, authentischen
              Vertrieb und wirksame Kundenkommunikation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {['25+ Jahre Erfahrung', 'Microsoft Cloud Ambassador', 'TOP 100 Speaker', 'TEDx Speaker'].map((p) => (
                <span
                  key={p}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ color: '#93B8F5', borderColor: 'rgba(147,184,245,0.35)' }}
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                <Mic size={16} /> Keynote anfragen <ArrowRight size={16} />
              </Link>
              <a
                href="#topics"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Keynote-Themen ansehen
              </a>
            </div>
            <p className="mt-6 text-xs italic" style={{ color: 'rgba(255,255,255,0.55)' }}>
              „Praxisnah, empathisch und unterhaltsam — Markus begeistert jedes Publikum."
              <span className="ml-2 not-italic" style={{ color: 'rgba(255,255,255,0.35)' }}>— Event-Manager, Tech-Konferenz</span>
            </p>
          </div>

          {/* Photo */}
          <div className="mx-auto lg:mx-0">
            <div className="overflow-hidden rounded-3xl border-4" style={{ width: 320, height: 400, borderColor: 'rgba(147,184,245,0.25)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/markus-photo.jpg"
                alt="Markus Eilers"
                className="h-full w-full object-cover"
                style={{ filter: 'grayscale(20%)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TOPICS ───────────────────────────────────────────────── */}
      <section id="topics" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Keynote-Themen
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Praxisnahe Impulse für Ihr B2B-Event
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              Unterhaltsam, empathisch und mit echtem Mehrwert.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {TOPICS.map((t, i) => (
              <div key={t.title} className="rounded-2xl border bg-white p-8" style={{ borderColor: '#BBCFF5' }}>
                <div className="text-xs font-bold tracking-widest" style={{ color: accent }}>KEYNOTE {String(i + 1).padStart(2, '0')}</div>
                <h3 className="mt-3 text-xl font-bold leading-snug" style={{ color: '#0D0D0B' }}>{t.title}</h3>
                <p className="mt-2 text-sm font-semibold text-gray-500">{t.subtitle}</p>
                <ul className="mt-6 space-y-3">
                  {t.points.map((p) => (
                    <li key={p} className="flex gap-3 text-sm leading-relaxed text-gray-600">
                      <span className="mt-1.5 flex-shrink-0 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CREDENTIALS ──────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Warum Markus Eilers?</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Über 25 Jahre Erfahrung, die Du spüren wirst.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {CREDENTIALS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-5 rounded-2xl border bg-white p-6" style={{ borderColor: '#BBCFF5' }}>
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#EBF1FF' }}
                >
                  <Icon size={20} style={{ color: accent }} />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: '#0D0D0B' }}>{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Was Veranstalter sagen</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Stimmen aus echten Events
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <blockquote className="text-sm leading-relaxed text-gray-700">„{t.text}"</blockquote>
                <figcaption className="mt-4 border-t border-gray-100 pt-4">
                  <div className="text-sm font-bold" style={{ color: '#0D0D0B' }}>{t.author}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ALSO BUILDS / SALESMADE-CROSSLINK ─────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-4xl rounded-3xl p-10 text-white" style={{ backgroundColor: navy }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>
            Auch interessant
          </span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            Markus baut nicht nur Bühnen-Momente.
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Hinter den Keynotes steht ein System: die SalesMade Academy.
            12 Monate, 13 Sales-Skills, AI-powered — für B2B-Teams, die
            planbare Umsätze wollen.
          </p>
          <Link
            href="/salesmade"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
            style={{ backgroundColor: accent, color: 'white' }}
          >
            Zur SalesMade Academy <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">
            Markus für Ihr Event buchen
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Begeistere Dein Publikum mit einer Keynote, die inspiriert und
            echten Mehrwert liefert.
          </p>
          <Link
            href="/kontakt"
            className="mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Mic size={16} /> Keynote anfragen <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Kostenlose Erstberatung · Maßgeschneiderter Content · Für B2B-Events
          </p>
        </div>
      </section>

    </main>
  )
}
