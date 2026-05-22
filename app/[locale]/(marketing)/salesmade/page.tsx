import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import {
  Calendar, ArrowRight, Shield, Check, TrendingUp,
  Award, Users, Sparkles, Play, Headphones, CreditCard, MessageCircle, X as XIcon,
} from 'lucide-react'
import { SalesMadeRoiCalculator } from './RoiCalculator'
import { SkillInventory } from '@/components/sections/salesmade/SkillInventory'
import { ProgressionLadder } from '@/components/sections/salesmade/ProgressionLadder'
import { SalesPricing } from '@/components/sections/salesmade/SalesPricing'
import { MarketRealityStats } from '@/components/sections/salesmade/MarketRealityStats'
import { CeoMonologue } from '@/components/sections/salesmade/CeoMonologue'
import { MethodologyTriptych } from '@/components/sections/salesmade/MethodologyTriptych'
import { SalesFlywheel } from '@/components/sections/salesmade/SalesFlywheel'
import { BeforeAfter } from '@/components/sections/salesmade/BeforeAfter'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('salesmadePage.meta')
  return { title: t('title'), description: t('description') }
}

interface PageProps {
  params: Promise<{ locale: string }>
}

interface CrisisCard { persona: string; number: string; label: string; description: string; source: string }
interface ResearchHighlight { value: string; label: string; body: string }
interface RuleCard { number: string; label: string; text: string; source: string }
interface SystemStat { value: string; label: string }
interface FaqItem { q: string; a: string }
interface FormatItem { title: string; body: string }
interface CompareRow { left: string; right: string }

export default async function SalesMadePage({ params }: PageProps) {
  await params
  const t = await getTranslations('salesmadePage')

  const accent = '#1A5FD4'
  const navy = '#0F1E3A'

  const crisisCards = (t.raw('crisis.cards') as CrisisCard[]) ?? []
  const ruleCards = (t.raw('rules.cards') as RuleCard[]) ?? []
  const visionItems = (t.raw('vision.items') as string[]) ?? []
  const systemStats = (t.raw('system.stats') as SystemStat[]) ?? []
  const systemMeasures = (t.raw('system.measures') as string[]) ?? []
  const resultItems = (t.raw('results.items') as string[]) ?? []
  const coachTags = (t.raw('coach.tags') as string[]) ?? []
  const faqItems = (t.raw('faq.items') as FaqItem[]) ?? []
  const heroPills = (t.raw('hero.pills') as string[]) ?? []
  const researchHighlights = (t.raw('hero.researchHighlights.items') as ResearchHighlight[]) ?? []
  const antiMythProofs = (t.raw('antiMyth.proofs') as string[]) ?? []
  const formats = (t.raw('formatPill.formats') as FormatItem[]) ?? []
  const compareRows = (t.raw('coursesVsSkill.rows') as CompareRow[]) ?? []

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-4xl text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'rgba(26,95,212,0.25)', color: '#93B8F5' }}
          >
            {t('hero.badge')}
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            {t('hero.headline1')}<br />
            <span style={{ color: accent }}>{t('hero.headlineAccent')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('hero.subtext')}
          </p>
          {/* Trust pills row */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {heroPills.map((p, i) => {
              const Icon = [Award, Shield, Users][i] ?? Sparkles
              return (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(147,184,245,0.30)', color: '#93B8F5' }}
                >
                  <Icon size={12} /> {p}
                </span>
              )
            })}
          </div>

          {/* Research highlights row — Confidence · Behavior · Outcome */}
          {researchHighlights.length === 3 && (
            <div className="mx-auto mt-10 max-w-4xl">
              <div className="text-center text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(147,184,245,0.7)' }}>
                {t('hero.researchHighlights.eyebrow')}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {researchHighlights.map((h, i) => (
                  <div
                    key={h.label + i}
                    className="rounded-2xl px-5 py-5 text-left"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(147,184,245,0.25)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-3xl font-bold" style={{ color: accent }}>{h.value}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#93B8F5' }}>
                        {h.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {h.body}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-[10px] uppercase tracking-[0.18em]" style={{ color: 'rgba(147,184,245,0.55)' }}>
                {t('hero.researchHighlights.sources')}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              <Calendar size={16} /> {t('hero.cta')} <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t('hero.note')}
          </p>
        </div>
      </section>

      {/* ─── 1. CRISIS ───────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('crisis.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('crisis.headline')}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr] items-stretch">
            {/* Left: Permission stat — large, founder-positive */}
            <div
              className="rounded-2xl p-8 flex flex-col justify-between"
              style={{ backgroundColor: '#EBF1FF', border: '1.5px solid #BBCFF5' }}
            >
              <div>
                <span
                  className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] mb-5"
                  style={{ backgroundColor: 'white', color: accent, border: `1px solid #BBCFF5` }}
                >
                  ★ Was Gründer:innen sagen
                </span>
                <div className="text-6xl font-bold leading-none" style={{ color: accent }}>
                  {t('permissionStat.value')}
                </div>
                <p className="mt-4 text-lg font-bold leading-snug" style={{ color: '#0D0D0B' }}>
                  {t('permissionStat.headline')}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {t('permissionStat.body')}
                </p>
              </div>
              <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-gray-500">
                {t('crisis.sourceLabel')}: {t('permissionStat.source')}
              </p>
            </div>

            {/* Right: 2 smaller crisis cards stacked */}
            <div className="grid gap-4">
              {crisisCards.map((s) => (
                <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-6 flex gap-5 items-start">
                  <div className="text-4xl font-bold flex-shrink-0" style={{ color: accent, minWidth: 80 }}>{s.number}</div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-gray-400">{s.persona}</div>
                    <div className="mt-1 text-sm font-bold" style={{ color: '#0D0D0B' }}>{s.label}</div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.description}</p>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-gray-400">
                      {t('crisis.sourceLabel')}: {s.source}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 1b. ANTI-MYTH ────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border p-8 sm:p-10 text-center" style={{ borderColor: '#BBCFF5', backgroundColor: '#FFFFFF' }}>
            <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: '#EBF1FF', color: accent }}>
              {t('antiMyth.eyebrow')}
            </span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl leading-tight" style={{ color: '#0D0D0B' }}>
              {t('antiMyth.headline')}
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-base leading-relaxed text-gray-600">
              {t('antiMyth.body')}
            </p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-3 text-left">
              {antiMythProofs.map((p) => (
                <li key={p} className="flex gap-3 text-sm rounded-xl p-4" style={{ backgroundColor: '#FAFAF8' }}>
                  <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: accent }} />
                  <span style={{ color: '#0D0D0B' }}>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 2. RULES ────────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('rules.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('rules.headline')}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-700">
              {t('rules.subtext')}
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {ruleCards.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-white p-6 flex flex-col" style={{ borderColor: '#BBCFF5' }}>
                <div className="text-4xl font-bold" style={{ color: accent }}>{s.number}</div>
                <div className="mt-1 text-sm font-bold" style={{ color: '#0D0D0B' }}>{s.label}</div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 flex-1">{s.text}</p>
                <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-gray-400">
                  {t('crisis.sourceLabel')}: {s.source}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketRealityStats />
      <CeoMonologue />

      {/* ─── 4. GOOD NEWS ────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'white', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            {t('goodNews.badge')}
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('goodNews.headline')}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-gray-700">
            {t('goodNews.bodyPre')}
            <strong style={{ color: '#1A5FD4' }}>{t('goodNews.bodyAccent')}</strong>
          </p>
        </div>
      </section>

      <MethodologyTriptych />
      {/* ─── 4d. COURSES VS. SKILL ─────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: '#EBF1FF', color: accent, border: '1px solid #BBCFF5' }}
            >
              {t('coursesVsSkill.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl whitespace-pre-line" style={{ color: '#0D0D0B' }}>
              {t('coursesVsSkill.headline')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
              {t('coursesVsSkill.subtext')}
            </p>
          </div>
          <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-0 items-center mb-4 px-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: '#9CA3AF', color: '#fff' }}>
                <XIcon size={12} strokeWidth={3} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{t('coursesVsSkill.leftLabel')}</span>
            </div>
            <div aria-hidden className="w-10" />
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: accent, color: '#fff' }}>
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{t('coursesVsSkill.rightLabel')}</span>
            </div>
          </div>
          <div className="space-y-3">
            {compareRows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 items-stretch overflow-hidden rounded-2xl"
                style={{ border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
              >
                <div className="p-5 sm:p-6 flex items-start gap-3" style={{ backgroundColor: '#F6F6F4' }}>
                  <XIcon size={16} className="mt-1 flex-shrink-0 text-gray-400" strokeWidth={2.5} />
                  <p className="text-sm leading-relaxed text-gray-600">{row.left}</p>
                </div>
                <div className="hidden md:flex items-center justify-center px-2" aria-hidden="true">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white" style={{ border: '1px solid #E5E7EB', color: '#0F1E3A' }}>
                    <ArrowRight size={14} />
                  </span>
                </div>
                <div className="md:hidden h-px" aria-hidden="true" style={{ background: 'linear-gradient(90deg, #9CA3AF30 0%, #0F1E3A 50%, #1A5FD430 100%)' }} />
                <div className="p-5 sm:p-6 flex items-start gap-3" style={{ backgroundColor: '#F4F7FE' }}>
                  <Check size={16} className="mt-1 flex-shrink-0" style={{ color: accent }} strokeWidth={2.5} />
                  <p className="text-sm leading-relaxed font-medium" style={{ color: '#0F1E3A' }}>{row.right}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── 5. VISION ───────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{t('vision.eyebrow')}</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('vision.headline')}
            </h2>
          </div>
          <ul className="mt-12 grid gap-4 md:grid-cols-2">
            {visionItems.map((v) => (
              <li key={v} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#EBF1FF' }}>
                  <Check size={16} style={{ color: accent }} />
                </div>
                <span className="text-sm leading-relaxed text-gray-700">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── 6. SYSTEM ───────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>
              {t('system.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-white">
              {t('system.headline')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {t('system.subtext')}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm" style={{ border: '1px solid rgba(147,184,245,0.25)' }}>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: 'rgba(26,95,212,0.4)', color: '#93B8F5' }}>
                {t('system.step1Label')}
              </span>
              <h3 className="mt-3 text-xl font-bold text-white">{t('system.step1Title')}</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {t('system.step1Pre')}
                <strong style={{ color: accent }}>{t('system.step1Accent')}</strong>
                {t('system.step1Post')}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm" style={{ border: '1px solid rgba(147,184,245,0.25)' }}>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: 'rgba(26,95,212,0.4)', color: '#93B8F5' }}>
                {t('system.step2Label')}
              </span>
              <h3 className="mt-3 text-xl font-bold text-white">{t('system.step2Title')}</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {t('system.step2Pre')}
                <strong style={{ color: accent }}>{t('system.step2Accent')}</strong>
                {t('system.step2Post')}
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {systemStats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-bold" style={{ color: accent }}>{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Format pill — four learning ingredients */}
          <div className="mt-16 rounded-3xl bg-white/5 p-8 backdrop-blur-sm" style={{ border: '1px solid rgba(147,184,245,0.25)' }}>
            <div className="text-center">
              <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: 'rgba(26,95,212,0.4)', color: '#93B8F5' }}>
                {t('formatPill.eyebrow')}
              </span>
              <h3 className="mt-3 text-xl font-bold text-white sm:text-2xl">
                {t('formatPill.headline')}
              </h3>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {formats.map((f, i) => {
                const Icon = [Play, Headphones, CreditCard, MessageCircle][i] ?? MessageCircle
                return (
                  <div key={f.title} className="flex flex-col gap-3 rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(147,184,245,0.18)' }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(26,95,212,0.25)', color: '#93B8F5' }}>
                      <Icon size={18} />
                    </div>
                    <h4 className="text-sm font-bold text-white">{f.title}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.body}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-white/5 p-8 backdrop-blur-sm" style={{ border: '1px solid rgba(147,184,245,0.25)' }}>
            <h3 className="text-center text-sm font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>
              {t('system.measuresLabel')}
            </h3>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {systemMeasures.map((m) => (
                <li key={m} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: accent }} />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 7. RESULTS ──────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{t('results.eyebrow')}</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('results.headline')}
            </h2>
          </div>
          <ul className="mt-12 grid gap-4 md:grid-cols-2">
            {resultItems.map((r) => (
              <li key={r} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#EBF1FF' }}>
                  <TrendingUp size={16} style={{ color: accent }} />
                </div>
                <span className="text-sm leading-relaxed text-gray-700">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SalesFlywheel />

      {/* ─── 8. COACH ────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('coach.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('coach.name')}
            </h2>
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
              {t('coach.roleTag')}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {coachTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ color: accent, borderColor: '#BBCFF5', backgroundColor: '#EBF1FF' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-10 md:grid-cols-[280px_1fr] md:items-start">
            <div className="mx-auto md:mx-0">
              <div className="overflow-hidden rounded-3xl" style={{ width: 280, height: 360, backgroundColor: '#EBF1FF' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/markus-photo.jpg"
                  alt={t('coach.name')}
                  className="h-full w-full object-cover"
                  style={{ filter: 'grayscale(100%)' }}
                />
              </div>
            </div>
            <div>
              <div className="space-y-4 text-sm leading-relaxed text-gray-700">
                <p>{t('coach.bio1')}</p>
                <p>{t('coach.bio2')}</p>
              </div>
              <blockquote
                className="mt-8 rounded-2xl border-l-4 px-6 py-5 italic text-gray-700"
                style={{ borderColor: accent, backgroundColor: '#EBF1FF' }}
              >
                {t('coach.quote')}
                <footer className="mt-3 text-xs font-semibold uppercase tracking-widest not-italic" style={{ color: accent }}>
                  — {t('coach.name')}
                </footer>
              </blockquote>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://www.linkedin.com/in/markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: accent, borderColor: '#BBCFF5' }}
                >
                  LinkedIn
                </a>
                <a
                  href="https://youtube.com/@markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: '#EB0028', borderColor: '#F5BBBC' }}
                >
                  YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SkillInventory />
      <ProgressionLadder />

      {/* ─── 10. COMPARISON ──────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('comparison.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('comparison.headline')}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-8">
              <h3 className="text-xl font-bold" style={{ color: '#0D0D0B' }}>{t('comparison.hardTitle')}</h3>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                {t('comparison.hardTextPre')}
                <strong className="text-gray-900">{t('comparison.hardTextAccent')}</strong>
                {t('comparison.hardTextPost')}
              </p>
            </div>
            <div className="rounded-3xl border-2 p-8" style={{ borderColor: accent, backgroundColor: '#EBF1FF' }}>
              <h3 className="text-xl font-bold" style={{ color: '#0D0D0B' }}>{t('comparison.easyTitle')}</h3>
              <p className="mt-4 text-sm leading-relaxed text-gray-700">
                {t('comparison.easyTextPre')}
                <strong style={{ color: accent }}>{t('comparison.easyTextAccent')}</strong>
                {t('comparison.easyTextPost')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <BeforeAfter />
      <SalesPricing />

      {/* ─── 12. ROI CALCULATOR ─────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              {t('roi.eyebrow')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              {t('roi.headline')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-600">
              {t('roi.subtext')}
            </p>
          </div>
          <div className="mt-12">
            <SalesMadeRoiCalculator accent={accent} />
          </div>
        </div>
      </section>

      {/* ─── 13. GUARANTEE ──────────────────────────────────────────── */}
      <section className="px-6 py-16" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto flex max-w-3xl items-start gap-6 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#EBF1FF' }}>
            <Shield size={24} style={{ color: '#1A5FD4' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>
              {t('guarantee.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {t('guarantee.text')}
            </p>
          </div>
        </div>
      </section>

      {/* ─── 14. FAQ ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            {t('faq.headline')}
          </h2>
          <div className="mt-10 space-y-4">
            {faqItems.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-colors open:bg-gray-50"
              >
                <summary
                  className="flex cursor-pointer items-center justify-between text-base font-semibold"
                  style={{ color: '#0D0D0B' }}
                >
                  {f.q}
                  <span
                    className="ml-4 text-2xl transition-transform group-open:rotate-45"
                    style={{ color: accent }}
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 15. FINAL CTA ──────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>
            {t('finalCta.eyebrow')}
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-white">
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
            <Calendar size={16} /> {t('finalCta.cta')} <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t('finalCta.note')}
          </p>
        </div>
      </section>

    </main>
  )
}
