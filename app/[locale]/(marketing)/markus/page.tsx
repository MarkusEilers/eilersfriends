import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { AuthorLatest } from '@/components/blog/AuthorLatest'
import { ArrowRight, Mic, Award, Target, Lightbulb } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('markusPage.meta')
  return { title: t('title'), description: t('description') }
}

interface PageProps {
  params: Promise<{ locale: string }>
}

interface TopicItem { title: string; subtitle: string; points: string[] }
interface CredentialCard { title: string; description: string }
interface TestimonialItem { text: string; author: string; role: string }

const CREDENTIAL_ICONS = [Award, Target, Lightbulb, Mic]

export default async function MarkusPage({ params }: PageProps) {
  await params
  const t = await getTranslations('markusPage')

  const accent = '#1A5FD4'
  const navy = '#0F1E3A'

  const heroPills = (t.raw('hero.pills') as string[]) ?? []
  const topicItems = (t.raw('topics.items') as TopicItem[]) ?? []
  const credentialCards = (t.raw('credentials.cards') as CredentialCard[]) ?? []
  const testimonialItems = (t.raw('testimonials.items') as TestimonialItem[]) ?? []

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
              {t('hero.badge')}
            </span>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {t('hero.headline1')} <span style={{ color: accent }}>{t('hero.headlineAccent')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('hero.subtext')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {heroPills.map((p) => (
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
                <Mic size={16} /> {t('hero.ctaPrimary')} <ArrowRight size={16} />
              </Link>
              <a
                href="#topics"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t('hero.ctaSecondary')}
              </a>
            </div>
            <p className="mt-6 text-xs italic" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t('hero.quote')}
              <span className="ml-2 not-italic" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('hero.quoteAuthor')}</span>
            </p>
          </div>
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
              {t('topics.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('topics.headline')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              {t('topics.subtext')}
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {topicItems.map((topic, i) => (
              <div key={topic.title} className="rounded-2xl border bg-white p-8" style={{ borderColor: '#BBCFF5' }}>
                <div className="text-xs font-bold tracking-widest" style={{ color: accent }}>{t('topics.keynoteLabel')} {String(i + 1).padStart(2, '0')}</div>
                <h3 className="mt-3 text-xl font-bold leading-snug" style={{ color: '#0D0D0B' }}>{topic.title}</h3>
                <p className="mt-2 text-sm font-semibold text-gray-500">{topic.subtitle}</p>
                <ul className="mt-6 space-y-3">
                  {topic.points.map((p) => (
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
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{t('credentials.eyebrow')}</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('credentials.headline')}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {credentialCards.map((card, i) => {
              const Icon = CREDENTIAL_ICONS[i] ?? Award
              return (
                <div key={card.title} className="flex gap-5 rounded-2xl border bg-white p-6" style={{ borderColor: '#BBCFF5' }}>
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#EBF1FF' }}
                  >
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold" style={{ color: '#0D0D0B' }}>{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{t('testimonials.eyebrow')}</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('testimonials.headline')}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonialItems.map((item, i) => (
              <figure key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <blockquote className="text-sm leading-relaxed text-gray-700">„{item.text}"</blockquote>
                <figcaption className="mt-4 border-t border-gray-100 pt-4">
                  <div className="text-sm font-bold" style={{ color: '#0D0D0B' }}>{item.author}</div>
                  <div className="text-xs text-gray-500">{item.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CROSSLINK ─────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-4xl rounded-3xl p-10 text-white" style={{ backgroundColor: navy }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>
            {t('crosslink.eyebrow')}
          </span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            {t('crosslink.headline')}
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {t('crosslink.body')}
          </p>
          <Link
            href="/salesmade"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors"
            style={{ backgroundColor: accent, color: 'white' }}
          >
            {t('crosslink.cta')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">
            {t('finalCta.headline')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('finalCta.subtext')}
          </p>
          <Link
            href="/kontakt"
            className="mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Mic size={16} /> {t('finalCta.cta')} <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t('finalCta.note')}
          </p>
        </div>
      </section>

          {/* Blog-Block: drei Karten als Beweis, der Rest liegt im Briefing. */}
      <AuthorLatest slug="markus" />

</main>
  )
}
