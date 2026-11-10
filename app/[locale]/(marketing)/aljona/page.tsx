import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { AuthorLatest } from '@/components/blog/AuthorLatest'
import { HeroBackdrop } from '@/components/lp/story/HeroBackdrop'
import { SITE } from '@/lib/seo/site'
import { PersonJsonLd } from '@/components/seo/PersonJsonLd'
import {
  Calendar, ArrowRight, Heart, MessageCircle, Shield, Sparkles,
  Mic, AlertTriangle, Check, Star,
} from 'lucide-react'

const PHOTO = `${SITE}/aljona-photo.jpg`
const JOB: Record<string, string> = { de: 'Leadership Coach & Keynote Speaker', en: 'Leadership Coach & Keynote Speaker', es: 'Leadership Coach y Keynote Speaker' }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'aljonaPage.meta' })
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { type: 'profile', firstName: 'Aljona', lastName: 'Eilers', title: t('title'), description: t('description'), images: [{ url: PHOTO, alt: 'Aljona Eilers' }] },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description'), images: [PHOTO] },
  }
}

interface PageProps {
  params: Promise<{ locale: string }>
}

interface NamedCard { title: string; description: string }
interface ProgramItem {
  badge: string; title: string; subtitle: string; description: string
  sectionTitle: string; features: string[]; quote: string; cta: string
}
interface TestimonialItem { quote: string; author: string; role: string }

const PROBLEM_ICONS = [AlertTriangle, AlertTriangle, AlertTriangle, AlertTriangle]
const FRAMEWORK_ICONS = [Heart, MessageCircle, Shield, Sparkles]
const PROGRAM_ANCHORS = ['liquid', 'leadershe', 'bestseller'] as const
const PROGRAM_PRIMARY = [true, false, false]

export default async function AljonaPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations('aljonaPage')

  const accent = '#EB0028'
  const burgundy = '#7A1019'

  const heroPills = (t.raw('hero.pills') as string[]) ?? []
  const problemCards = (t.raw('problem.cards') as NamedCard[]) ?? []
  const frameworkCards = (t.raw('framework.cards') as NamedCard[]) ?? []
  const programItems = (t.raw('programs.items') as ProgramItem[]) ?? []
  const speakerTopics = (t.raw('speaker.topics') as string[]) ?? []
  const testimonialItems = (t.raw('testimonials.items') as TestimonialItem[]) ?? []
  const benefits = (t.raw('finalCta.benefits') as string[]) ?? []

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <PersonJsonLd locale={locale} p={{
        slug: 'aljona', name: 'Aljona Eilers', givenName: 'Aljona', familyName: 'Eilers', image: PHOTO,
        jobTitle: JOB[locale] ?? JOB.de, description: t('meta.description'), title: t('meta.title'),
        award: ['TEDx Speaker', 'Wall Street Journal Bestseller-Autorin'],
        knowsAbout: ['Leadership', 'Selbstführung', 'Empathische Führung', 'Applied Neuroscience', 'Liquid Leadership', 'Führungskräfteentwicklung'],
        knowsLanguage: ['de', 'en'],
        sameAs: ['https://www.linkedin.com/in/aljonaeilers', 'https://www.youtube.com/@liquid.leadership', 'https://www.instagram.com/aljonaeilers'],
      }} />

      {/* ─── HERO (vollflächiges S/W-Bild mit Rot-Akzenten) ───────── */}
      <section className="efh px-6 py-20 sm:py-24">
        <HeroBackdrop src="/heroes/aljona.jpg" label="Aljona Eilers im Gespräch mit einem Führungsteam" glow="rgba(235,0,40,.10)" />
        <div className="mx-auto w-full max-w-6xl">
          <div className="efh-copy">
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ backgroundColor: 'rgba(235,0,40,0.08)', color: burgundy }}
            >
              {t('hero.badge')}
            </span>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl" style={{ color: '#0D0D0B', letterSpacing: '-0.035em' }}>
              {t('hero.headline1')}<br />
              <span style={{ color: accent }}>{t('hero.headlineAccent')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: '#3A3633' }}>
              {t('hero.subtext')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {heroPills.map((p) => (
                <span
                  key={p}
                  className="rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold"
                  style={{ color: burgundy, borderColor: 'rgba(122,16,25,0.25)' }}
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
                <Calendar size={16} /> {t('hero.ctaPrimary')} <ArrowRight size={16} />
              </Link>
              <a
                href="#programs"
                className="inline-flex items-center gap-2 rounded-full border bg-white/60 px-8 py-4 text-sm font-semibold transition-colors hover:bg-white"
                style={{ color: '#0D0D0B', borderColor: 'rgba(13,13,11,0.2)' }}
              >
                {t('hero.ctaSecondary')}
              </a>
            </div>
            <p className="mt-6 text-xs italic" style={{ color: '#605D5D' }}>
              {t('hero.quote')}
              <span className="ml-2 not-italic" style={{ color: '#8A8784' }}>{t('hero.quoteAuthor')}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM ──────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('problem.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('problem.headline')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
              {t('problem.subtext')}
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {problemCards.map((card, i) => {
              const Icon = PROBLEM_ICONS[i] ?? AlertTriangle
              return (
                <div key={card.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#FFEBEC' }}
                  >
                    <Icon size={18} style={{ color: accent }} />
                  </div>
                  <h3 className="text-base font-bold" style={{ color: '#0D0D0B' }}>{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FRAMEWORK ─────────────────────────────────────────── */}
      <section id="liquid" className="px-6 py-20" style={{ backgroundColor: '#FFEBEC' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{t('framework.eyebrow')}</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              <span style={{ color: accent }}>{t('framework.headline')}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-700">
              {t('framework.subtext')}
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {frameworkCards.map((card, i) => {
              const Icon = FRAMEWORK_ICONS[i] ?? Heart
              return (
                <div key={card.title} className="flex gap-5 rounded-2xl border bg-white p-6" style={{ borderColor: '#F5BBBC' }}>
                  <div
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#FFEBEC' }}
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

      {/* ─── PROGRAMS ─────────────────────────────────────────── */}
      <section id="programs" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{t('programs.eyebrow')}</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('programs.headline')}
            </h2>
            <p className="mt-4 text-base text-gray-600">
              {t('programs.subtext')}
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {programItems.map((p, i) => {
              const primary = PROGRAM_PRIMARY[i] ?? false
              const anchor = PROGRAM_ANCHORS[i] ?? p.title.toLowerCase()
              return (
                <div
                  key={p.title}
                  id={anchor}
                  className="rounded-3xl p-8 flex flex-col"
                  style={
                    primary
                      ? { backgroundColor: accent, color: 'white', boxShadow: '0 25px 50px -12px rgba(212,25,43,0.4)' }
                      : { backgroundColor: 'white', border: '1px solid #E5E7EB' }
                  }
                >
                  <span
                    className="self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                    style={
                      primary
                        ? { backgroundColor: 'white', color: accent }
                        : { backgroundColor: '#FFEBEC', color: accent, border: '1px solid #F5BBBC' }
                    }
                  >
                    {p.badge}
                  </span>
                  <h3 className="mt-4 text-2xl font-bold" style={{ color: primary ? 'white' : '#0D0D0B' }}>
                    {p.title}
                  </h3>
                  <p
                    className="mt-2 text-sm font-semibold"
                    style={{ color: primary ? 'rgba(255,255,255,0.8)' : '#6B7280' }}
                  >
                    {p.subtitle}
                  </p>
                  <p
                    className="mt-4 text-sm leading-relaxed"
                    style={{ color: primary ? 'rgba(255,255,255,0.85)' : '#4B5563' }}
                  >
                    {p.description}
                  </p>
                  <div className="mt-6">
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: primary ? 'rgba(255,255,255,0.7)' : accent }}
                    >
                      {p.sectionTitle}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {p.features.map((f) => (
                        <li
                          key={f}
                          className="flex gap-3 text-sm"
                          style={{ color: primary ? 'rgba(255,255,255,0.9)' : '#374151' }}
                        >
                          <Check
                            size={16}
                            className="mt-0.5 flex-shrink-0"
                            style={{ color: primary ? 'white' : accent }}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p
                    className="mt-6 text-xs italic leading-relaxed"
                    style={{ color: primary ? 'rgba(255,255,255,0.7)' : '#6B7280' }}
                  >
                    „{p.quote}"
                  </p>
                  <Link
                    href={anchor === 'liquid' ? '/liquidleadership' : '/kontakt'}
                    className="mt-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold mt-8 transition-opacity hover:opacity-90"
                    style={
                      primary
                        ? { backgroundColor: 'white', color: accent }
                        : { backgroundColor: accent, color: 'white' }
                    }
                  >
                    {p.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── SPEAKER ──────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: burgundy }}>
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FFB3B8' }}>
            {t('speaker.eyebrow')}
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-white">
            {t('speaker.headline')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('speaker.subtext')}
          </p>
          <p className="mt-3 text-sm" style={{ color: '#FFB3B8' }}>
            {t('speaker.credentials')}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {speakerTopics.map((topic) => (
              <div
                key={topic}
                className="rounded-2xl p-5 text-sm font-medium leading-snug"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,179,184,0.2)' }}
              >
                {topic}
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              <Mic size={16} /> {t('speaker.cta')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('testimonials.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('testimonials.headline')}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonialItems.map((item, i) => (
              <figure key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <Star size={16} style={{ color: accent }} />
                <blockquote className="mt-3 text-sm leading-relaxed text-gray-700">„{item.quote}"</blockquote>
                <figcaption className="mt-4 border-t border-gray-100 pt-4">
                  <div className="text-sm font-bold" style={{ color: '#0D0D0B' }}>{item.author}</div>
                  <div className="text-xs text-gray-500">{item.role}</div>
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
            {t('finalCta.headline')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {t('finalCta.subtext')}
          </p>
          <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
            {benefits.map((b) => (
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
            <Calendar size={16} /> {t('finalCta.cta')} <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('finalCta.note')}
          </p>
        </div>
      </section>

          {/* Blog-Block: drei Karten als Beweis, der Rest liegt im Briefing. */}
      <AuthorLatest slug="aljona" />

</main>
  )
}
