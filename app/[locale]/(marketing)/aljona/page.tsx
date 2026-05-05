import type { Metadata } from 'next'
import Link from 'next/link'
import {
import { redirect } from 'next/navigation'
  Calendar, ArrowRight, Heart, MessageCircle, Shield, Sparkles,
  Mic, Award, AlertTriangle, Check, Star,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Aljona Eilers — Leadership für ein Winning Team',
  description:
    'Mit Empathie und Selbstführung zum Leader, dem andere gerne folgen. TEDx Speaker · WSJ Bestseller-Autorin · Applied Neuroscience Expert. Liquid Leadership für Tech-Führungskräfte.',
}

const PROBLEMS = [
  { icon: AlertTriangle, title: 'Burnout-Spirale', description: 'Du arbeitest 60+ Stunden, aber das Team liefert nicht wie erwartet' },
  { icon: AlertTriangle, title: 'Talent-Flucht', description: 'Deine besten Leute gehen — und du weißt nicht warum' },
  { icon: AlertTriangle, title: 'Emotionale Distanz', description: 'Du fühlst dich isoliert, obwohl du von Menschen umgeben bist' },
  { icon: AlertTriangle, title: 'Entscheidungsmüdigkeit', description: 'Jede Entscheidung fühlt sich schwerer an als die letzte' },
]

const FRAMEWORK = [
  { icon: Heart, title: 'Emotionale Intelligenz', description: 'Verstehe dich selbst, bevor du andere führst' },
  { icon: MessageCircle, title: 'Adaptive Kommunikation', description: 'Sprich die Sprache deines Teams' },
  { icon: Shield, title: 'Resiliente Entscheidungen', description: 'Klarheit unter Druck bewahren' },
  { icon: Sparkles, title: 'Authentische Präsenz', description: 'Führe mit deiner wahren Stärke' },
]

const PROGRAMS = [
  {
    badge: '⭐ Empfohlen',
    title: 'Liquid Leadership',
    subtitle: 'Für Tech-Führungskräfte, die ihr Team auf das nächste Level bringen wollen.',
    description: 'Ein 6-monatiges Intensiv-Programm, das emotionale Intelligenz mit Applied Neuroscience verbindet.',
    sectionTitle: 'Was Dich erwartet:',
    features: [
      'Persönliche Bestandsaufnahme & Zielsetzung',
      '4× monatliche 1:1 Coaching Sessions',
      'EQ & Kommunikations-Training',
      '2-wöchentliche Gruppen-Masterminds',
      'Zugang zu exklusiven Leadership-Resources',
      'Lifetime Alumni-Netzwerk',
    ],
    quote: 'Leader, denen ihr Team mit Begeisterung folgt',
    cta: 'Mehr erfahren',
    primary: true,
    anchor: 'liquid',
  },
  {
    badge: 'Mastermind',
    title: 'LeaderShe Mastermind',
    subtitle: 'Für Frauen in Führungspositionen in Technologie-Unternehmen.',
    description: 'Eine exklusive Community für weibliche Tech-Leader, die authentisch führen wollen.',
    sectionTitle: 'Deine Vorteile:',
    features: [
      'Monatliche Mastermind-Sessions',
      'Peer Support & Accountability Network',
      'Exklusive Leadership-Resources',
      'Quarterly Retreats & Workshops',
      '1:1 Coaching-Calls bei Bedarf',
      'Zugang zur LeaderShe Community',
    ],
    quote: 'Erkenne ungenutztes Potenzial. Führe authentisch.',
    cta: 'Mehr erfahren',
    primary: false,
    anchor: 'leadershe',
  },
  {
    badge: 'Bestseller',
    title: 'Bestseller-Programm',
    subtitle: 'Ihr persönlicher Bestseller — die Story, die Entscheider begeistert.',
    description: 'Werde zum Thought Leader mit Deinem eigenen Buch auf Amazon & Barnes & Noble.',
    sectionTitle: 'Ihr Weg zum Bestseller:',
    features: [
      'Deine Hero-Journey als Buch (200+ Seiten)',
      '12+ Monate an überzeugendem Content',
      'Plattform für Premium-Kundengewinnung',
      'Amazon & Barnes & Noble Veröffentlichung',
      'Marketing & Launch-Support',
      '36-Monate Erfolgsgarantie',
    ],
    quote: 'Garantie: A-Kunde oder Geld zurück',
    cta: 'Mehr erfahren',
    primary: false,
    anchor: 'bestseller',
  },
]

const SPEAKER_TOPICS = [
  'Geheimnisse für Wirksames Leadership in einer AI Welt',
  'Wenn Dir niemand folgen möchte, bist Du kein Leader',
  'Wirksamer führen mit Emotionaler Intelligenz',
]

const TESTIMONIALS = [
  { quote: 'Alles, was ich erreicht habe, habe ich Dank und mit Aljona erreicht.', author: 'Katharina Michrin', role: 'Tech-Führungskraft' },
  { quote: 'Aljona half mir zu erkennen, dass ich nicht zwischen Erfolg und Gesundheit wählen muss.', author: 'Anonym', role: 'Scale-up CEO' },
  { quote: 'Die Präzision einer Ballerina und die Resilienz einer Unternehmerin — genau das brauchte ich.', author: 'Startup-Gründerin', role: 'Tech Industry' },
]

const CTA_BENEFITS = [
  'Klarheit über Deine größte Führungsherausforderung',
  'Einen konkreten ersten Schritt zur Lösung',
  'Ehrliches Feedback zu Deinem Leadership-Stil',
]

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AljonaPage({ params }: PageProps) {
  const { locale } = await params
  if (locale !== 'de') redirect('/de/aljona')

  const accent = '#D4192B'
  const burgundy = '#7A1019'

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28" style={{ backgroundColor: burgundy }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: 'rgba(212,25,43,0.25)', color: '#FFB3B8' }}
            >
              Leadership für ein WinningTeam
            </span>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Mit Empathie und Selbstführung zum<br />
              <span style={{ color: '#FFB3B8' }}>Leader, dem andere gerne folgen.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Die Leadership Secrets einer Bolshoi Ballerina und Serial-Entrepreneurin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {['TEDx Speaker', 'WSJ Bestseller-Autorin', '500+ Führungskräfte begleitet', '15+ Jahre Erfahrung'].map((p) => (
                <span
                  key={p}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ color: '#FFB3B8', borderColor: 'rgba(255,179,184,0.35)' }}
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
                <Calendar size={16} /> Kostenloses Strategiegespräch <ArrowRight size={16} />
              </Link>
              <a
                href="#programs"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Programme entdecken
              </a>
            </div>
            <p className="mt-6 text-xs italic" style={{ color: 'rgba(255,255,255,0.6)' }}>
              „Alles, was ich erreicht habe, habe ich Dank Aljona erreicht."
              <span className="ml-2 not-italic" style={{ color: 'rgba(255,255,255,0.4)' }}>— Katharina M.</span>
            </p>
          </div>

          {/* Photo */}
          <div className="mx-auto lg:mx-0">
            <div
              className="overflow-hidden rounded-3xl border-4"
              style={{ width: 320, height: 400, borderColor: 'rgba(255,179,184,0.25)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/aljona-photo.jpg"
                alt="Aljona Eilers"
                className="h-full w-full object-cover"
                style={{ filter: 'grayscale(20%)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM ──────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Du führst ein erfolgreiches Team.
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Aber zu welchem Preis?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
              76 % der Führungskräfte fürchten das Tempo der KI-Adoption. Aber die
              wahre Herausforderung ist nicht die Technologie — es ist die menschliche Führung.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#FFEBEC' }}
                >
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <h3 className="text-base font-bold" style={{ color: '#0D0D0B' }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FRAMEWORK ─────────────────────────────────────────── */}
      <section id="liquid" className="px-6 py-20" style={{ backgroundColor: '#FFEBEC' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Das Framework</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              <span style={{ color: accent }}>Liquid Leadership</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-700">
              Führung, die sich anpasst — ohne sich zu verlieren. Basierend auf
              Applied Neuroscience und 15+ Jahren Praxiserfahrung.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FRAMEWORK.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-5 rounded-2xl border bg-white p-6" style={{ borderColor: '#F5BBBC' }}>
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#FFEBEC' }}
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

      {/* ─── PROGRAMS ─────────────────────────────────────────── */}
      <section id="programs" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Programme</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Wähle Deinen Weg
            </h2>
            <p className="mt-4 text-base text-gray-600">
              Wähle den Weg, der zu Dir passt.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PROGRAMS.map((p) => (
              <div
                key={p.title}
                id={p.anchor}
                className="rounded-3xl p-8 flex flex-col"
                style={
                  p.primary
                    ? { backgroundColor: accent, color: 'white', boxShadow: '0 25px 50px -12px rgba(212,25,43,0.4)' }
                    : { backgroundColor: 'white', border: '1px solid #E5E7EB' }
                }
              >
                <span
                  className="self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                  style={
                    p.primary
                      ? { backgroundColor: 'white', color: accent }
                      : { backgroundColor: '#FFEBEC', color: accent, border: '1px solid #F5BBBC' }
                  }
                >
                  {p.badge}
                </span>
                <h3 className="mt-4 text-2xl font-bold" style={{ color: p.primary ? 'white' : '#0D0D0B' }}>
                  {p.title}
                </h3>
                <p
                  className="mt-2 text-sm font-semibold"
                  style={{ color: p.primary ? 'rgba(255,255,255,0.8)' : '#6B7280' }}
                >
                  {p.subtitle}
                </p>
                <p
                  className="mt-4 text-sm leading-relaxed"
                  style={{ color: p.primary ? 'rgba(255,255,255,0.85)' : '#4B5563' }}
                >
                  {p.description}
                </p>
                <div className="mt-6">
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: p.primary ? 'rgba(255,255,255,0.7)' : accent }}
                  >
                    {p.sectionTitle}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex gap-3 text-sm"
                        style={{ color: p.primary ? 'rgba(255,255,255,0.9)' : '#374151' }}
                      >
                        <Check
                          size={16}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: p.primary ? 'white' : accent }}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p
                  className="mt-6 text-xs italic leading-relaxed"
                  style={{ color: p.primary ? 'rgba(255,255,255,0.7)' : '#6B7280' }}
                >
                  „{p.quote}"
                </p>
                <Link
                  href="/kontakt"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold mt-8 transition-opacity hover:opacity-90"
                  style={
                    p.primary
                      ? { backgroundColor: 'white', color: accent }
                      : { backgroundColor: accent, color: 'white' }
                  }
                >
                  {p.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SPEAKER ──────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: burgundy }}>
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FFB3B8' }}>
            Aljona als Keynote-Sprecherin
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-white">
            Von Bolshoi Ballet zur Tech-Leadership
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Eine Story, die bewegt und inspiriert.
          </p>
          <p className="mt-3 text-sm" style={{ color: '#FFB3B8' }}>
            TEDx Speaker · WSJ Bestseller-Autorin · Applied Neuroscience Expert
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {SPEAKER_TOPICS.map((t) => (
              <div
                key={t}
                className="rounded-2xl p-5 text-sm font-medium leading-snug"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,179,184,0.2)' }}
              >
                {t}
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              <Mic size={16} /> Verfügbarkeit anfragen <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Was Führungskräfte sagen
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Stimmen aus echten Transformationen
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <Star size={16} style={{ color: accent }} />
                <blockquote className="mt-3 text-sm leading-relaxed text-gray-700">„{t.quote}"</blockquote>
                <figcaption className="mt-4 border-t border-gray-100 pt-4">
                  <div className="text-sm font-bold" style={{ color: '#0D0D0B' }}>{t.author}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: burgundy }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">
            Instant Energy Boost for your Team
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            In einem kostenlosen 30-Minuten Strategiegespräch analysieren wir
            gemeinsam:
          </p>
          <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
            {CTA_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#FFB3B8' }} />
                {b}
              </li>
            ))}
          </ul>
          <Link
            href="/kontakt"
            className="mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Calendar size={16} /> Jetzt Strategiegespräch buchen <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Wertvolle Perspektive von anderen Unternehmen · 100 % vertraulich · Für Tech-Führungskräfte
          </p>
        </div>
      </section>

    </main>
  )
}
