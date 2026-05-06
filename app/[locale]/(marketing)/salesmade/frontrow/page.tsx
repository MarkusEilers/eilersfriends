import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowDown, ArrowRight, Calendar, BookOpen, Reply, Award, Package, Linkedin, Youtube,
} from 'lucide-react'
import { FrontRowForm } from './FrontRowForm'

export const metadata: Metadata = {
  title: 'Front Row — Instant Influence',
  description:
    'Front Row für das Buch Instant Influence. Frühe Kapitel-Drafts in deine Inbox, ein direkter Draht zu Markus, dein Name in den Acknowledgements und ein signiertes Exemplar zum Launch.',
}

interface PageProps {
  params: Promise<{ locale: string }>
}

const PERKS = [
  {
    icon: BookOpen,
    title: 'Frühe Kapitel-Drafts.',
    body: 'Jedes Kapitel landet in deiner Inbox bevor es woanders auftaucht. Etwa alle 2–3 Wochen ein Draft.',
  },
  {
    icon: Reply,
    title: 'Direkter Draht zum Pushback.',
    body: 'Antworte auf jeden Draft. Hinterfrage das Framework, schlag eine Story vor, sag wo das Kapitel nicht landet. Ich lese jede Antwort.',
  },
  {
    icon: Award,
    title: 'Acknowledgements, wenn du willst.',
    body: 'Dein Name auf den Danksagungs-Seiten. Kein Mindesteinsatz nötig.',
  },
  {
    icon: Package,
    title: 'Signiertes Exemplar zum Launch.',
    body: 'An deine Adresse versendet, sobald das Buch live geht.',
  },
]

export default async function FrontRowPage({ params }: PageProps) {
  const { locale } = await params
  if (locale !== 'de') redirect('/de/salesmade/frontrow')

  const accent = '#1A5FD4'
  const navy = '#0F1E3A'

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'rgba(147,184,245,0.15)', color: '#93B8F5', border: '1px solid rgba(147,184,245,0.30)' }}
          >
            Instant Influence — Buch im Bau
          </span>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Front Row
          </h1>
          <p className="mt-6 text-lg leading-relaxed sm:text-xl" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Hilf mir, das Buch zu bauen, das B2B-Sales 2026 wirklich braucht.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Ich habe versucht, dieses Buch dreimal zu schreiben. Keiner der Drafts ist je rausgegangen.
            Dann hat AI das Gespräch übernommen — und das Buch hat endlich seine Form gefunden.
            Dieses Mal schreibe ich es <em>mit</em> den Menschen, die diese Arbeit schon kennen — nicht <em>für</em> sie.
          </p>
          <a
            href="#take-seat"
            className="mt-10 inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            Platz nehmen <ArrowDown size={14} />
          </a>
        </div>
      </section>

      {/* ─── PULL QUOTE ──────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <blockquote
            className="rounded-3xl px-8 py-12 text-center text-2xl font-bold italic leading-tight sm:text-3xl"
            style={{ backgroundColor: '#F5E8C8', color: navy }}
          >
            „Ich starte keinen Launch. Ich starte einen Build."
          </blockquote>
        </div>
      </section>

      {/* ─── WHAT YOU GET ────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Was die Front Row bekommt
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Vier Dinge — keine Marketing-Sequenz
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {PERKS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#EBF1FF' }}
                >
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <h3 className="text-base font-bold" style={{ color: '#0D0D0B' }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT I ASK BACK ─────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Was ich zurück frage
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Eine Frage pro Kapitel — wenn du eine hast
            </h2>
          </div>
          <p className="text-base leading-relaxed text-gray-700">
            Eine Frage pro Kapitel, wenn du eine hast. Das ist die einzige Bitte. Wenn du keine
            hast, ignorier die Mail und lies in deinem Tempo. Die Front Row lebt von echten
            Reaktionen, nicht von performativem Engagement. Lurke, wenn du das brauchst. Schieb
            zurück, wenn du etwas hast. Beides funktioniert.
          </p>
        </div>
      </section>

      {/* ─── SIGN-UP FORM ────────────────────────────────────────── */}
      <section id="take-seat" className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Platz nehmen
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              In die Front Row
            </h2>
          </div>
          <FrontRowForm />
        </div>
      </section>

      {/* ─── TALK FIRST ──────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Lieber erst sprechen?
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Mussst du es vorher durchdenken?
            </h2>
          </div>
          <p className="text-base leading-relaxed text-gray-700">
            Manche von euch haben spezifische Fragen — ob dieses Buch zu eurem Team, eurer
            Karrierephase oder gerade jetzt passt. Zwanzig Minuten. Kein Pitch. Ich will hören,
            woran du arbeitest.
          </p>
          <a
            href="https://calendly.com/markuseilers/kennenlernen"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Calendar size={16} /> 20 Minuten mit Markus <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* ─── ABOUT MARKUS ────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
            Wer das schreibt
          </span>
          <h2 className="mt-3 mb-8 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Markus Eilers
          </h2>
          <div className="grid gap-8 sm:grid-cols-[160px_1fr] sm:items-start">
            <div className="overflow-hidden rounded-2xl" style={{ width: 160, height: 200 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/markus-photo.jpg"
                alt="Markus Eilers"
                className="h-full w-full object-cover"
                style={{ filter: 'grayscale(15%)' }}
              />
            </div>
            <div>
              <p className="text-base leading-relaxed text-gray-700">
                Markus Eilers ist Sales-Coach, Ex-Founder und TEDx Speaker. Er hat 27 Jahre damit
                verbracht, herauszufinden, warum die meisten ersten B2B-Gespräche scheitern — und
                was die wenigen, die funktionieren, gemeinsam haben. Er führt SalesMade — eine
                Coaching-Praxis für B2B-Sales-Teams, die ohne Pitchen verkaufen wollen.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://www.linkedin.com/in/markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: accent, borderColor: '#BBCFF5' }}
                >
                  <Linkedin size={13} /> LinkedIn
                </a>
                <a
                  href="https://youtube.com/@markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: '#D4192B', borderColor: '#F5BBBC' }}
                >
                  <Youtube size={13} /> TEDx Darmstadt 2025
                </a>
                <Link
                  href="/salesmade"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: accent, borderColor: '#BBCFF5' }}
                >
                  SalesMade
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
