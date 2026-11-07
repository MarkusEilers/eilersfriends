import type { Metadata } from 'next'
import { getSetting } from '@/lib/db/queries/settings'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowDown, ArrowRight, Calendar, BookOpen, Reply, Award, Package, Linkedin, Youtube,
} from 'lucide-react'
import { FrontRowForm } from './FrontRowForm'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('frontRow.page')
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function FrontRowPage({ params }: PageProps) {
  const t = await getTranslations('frontRow.page')
  const { locale } = await params
  if (locale !== 'de') redirect('/de/salesmade/frontrow')
  const calendlyUrl = await getSetting('calendly.markus')

  const accent = '#1A5FD4'
  const navy = '#0F1E3A'

  const perks = t.raw('perks') as { icon: any; title: string; body: string }[]
  const icons = [BookOpen, Reply, Award, Package]

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'rgba(147,184,245,0.15)', color: '#93B8F5', border: '1px solid rgba(147,184,245,0.30)' }}
          >
            {t('hero.badge')}
          </span>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg leading-relaxed sm:text-xl" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('hero.subtitle')}
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {t.rich('hero.body', {
              em: (c) => <em>{c}</em>,
            })}
          </p>
          <a
            href="#take-seat"
            className="mt-10 inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {t('hero.cta')} <ArrowDown size={14} />
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
            {t('pullQuote')}
          </blockquote>
        </div>
      </section>

      {/* ─── WHAT YOU GET ────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('perksSection.badge')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('perksSection.title')}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {perks.map(({ title, body }, i) => {
              const Icon = icons[i]
              return (
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
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── WHAT I ASK BACK ─────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('askBackSection.badge')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('askBackSection.title')}
            </h2>
          </div>
          <p className="text-base leading-relaxed text-gray-700">
            {t('askBackSection.body')}
          </p>
        </div>
      </section>

      {/* ─── SIGN-UP FORM ────────────────────────────────────────── */}
      <section id="take-seat" className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('signupSection.badge')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('signupSection.title')}
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
              {t('talkFirstSection.badge')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('talkFirstSection.title')}
            </h2>
          </div>
          <p className="text-base leading-relaxed text-gray-700">
            {t('talkFirstSection.body')}
          </p>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Calendar size={16} /> {t('talkFirstSection.cta')} <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* ─── ABOUT MARKUS ────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
            {t('aboutSection.badge')}
          </span>
          <h2 className="mt-3 mb-8 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('aboutSection.title')}
          </h2>
          <div className="grid gap-8 sm:grid-cols-[160px_1fr] sm:items-start">
            <div className="overflow-hidden rounded-2xl" style={{ width: 160, height: 200 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/markus-photo.jpg"
                alt={t('aboutSection.photoAlt')}
                className="h-full w-full object-cover"
                style={{ filter: 'grayscale(15%)' }}
              />
            </div>
            <div>
              <p className="text-base leading-relaxed text-gray-700">
                {t('aboutSection.body')}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://www.linkedin.com/in/markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: accent, borderColor: '#BBCFF5' }}
                >
                  <Linkedin size={13} /> {t('aboutSection.linkedin')}
                </a>
                <a
                  href="https://youtube.com/@markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: '#EB0028', borderColor: '#F5BBBC' }}
                >
                  <Youtube size={13} /> {t('aboutSection.tedx')}
                </a>
                <Link
                  href="/academy"
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: accent, borderColor: '#BBCFF5' }}
                >
                  {t('aboutSection.salesmade')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
