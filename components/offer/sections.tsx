import type { LucideIcon } from 'lucide-react'
import { Target, Users, TrendingUp, Shield, Zap, Star, CalendarCheck, Sparkles, Check, AlertCircle } from 'lucide-react'

// ─── Shared types (mirror offer-builder/src/types/offer.ts) ────────────────────
export interface UnderstandingData { title?: string; goals?: string[]; challenges?: string[] }
export interface EmpathyData { title?: string; statement?: string; successMessage?: string }
export interface EconomicResult { id?: string; icon?: 'target'|'users'|'trending-up'|'shield'|'zap'|'star'; title: string; description?: string }
export interface PricingOption { id?: string; type?: 'DIY'|'DWY'|'DFY'; title: string; description?: string; price: number; priceType?: 'fixed'|'perParticipant'; monthlyDuration?: number; features?: string[]; recommended?: boolean }
export interface ProgramSummary { id?: string; title: string; subtitle?: string; description?: string; pricing?: PricingOption[] }

const ICONS: Record<string, LucideIcon> = {
  target: Target, users: Users, 'trending-up': TrendingUp, shield: Shield, zap: Zap, star: Star,
}

// ─── 1. Hero ────────────────────────────────────────────────────────────────
export function OfferHero({
  offerNumber, title, subtitle, tagline, customerName, customerCompany, customerLogoUrl, validUntil,
}: {
  offerNumber: string
  title: string
  subtitle?: string | null
  tagline?: string | null
  customerName: string
  customerCompany?: string | null
  customerLogoUrl?: string | null
  validUntil: Date
}) {
  const validStr = validUntil.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  const recipient = customerCompany?.trim() ? `${customerName} · ${customerCompany}` : customerName
  return (
    <section className="px-6 py-24 sm:py-32" style={{ background: 'linear-gradient(180deg, #0F1E3A 0%, #15315E 100%)' }}>
      <div className="mx-auto max-w-3xl text-center">
        {/* Customer logo (if uploaded) — sits at the top, soft & quiet */}
        {customerLogoUrl && (
          <div className="mb-8 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={customerLogoUrl}
              alt={customerCompany || customerName}
              className="h-12 w-auto opacity-80"
              style={{ filter: 'brightness(0) invert(1)', maxWidth: 200 }}
            />
          </div>
        )}
        <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFC93C', border: '1px solid rgba(255,201,60,0.35)' }}>
          <Sparkles size={12} /> Persönliches Angebot für {recipient}
        </span>
        <p className="mt-6 text-sm font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{offerNumber}</p>
        {tagline && (
          <p className="mt-3 text-base font-semibold tracking-wide" style={{ color: '#FFC93C' }}>{tagline}</p>
        )}
        <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{title}</h1>
        {subtitle && (
          <p className="mt-6 text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{subtitle}</p>
        )}
        <p className="mt-8 inline-flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <CalendarCheck size={12} /> Gültig bis {validStr}
        </p>
      </div>
    </section>
  )
}

// ─── 2. Understanding (goals + challenges) ──────────────────────────────────
export function OfferUnderstanding({ data }: { data: UnderstandingData }) {
  const goals = data.goals ?? []
  const challenges = data.challenges ?? []
  if (!goals.length && !challenges.length) return null
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Unser Verständnis</span>
          <h2 className="mt-2 text-3xl font-bold" style={{ color: '#0D0D0B' }}>
            {data.title ?? 'Das haben wir verstanden.'}
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {goals.length > 0 && (
            <div className="rounded-3xl bg-white p-8" style={{ border: '1px solid #BBCFF5', boxShadow: '0 4px 20px rgba(15,30,58,0.05)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Deine Ziele</p>
              <ul className="mt-4 space-y-3">
                {goals.map((g, i) => (
                  <li key={i} className="flex gap-3 text-sm" style={{ color: '#374151' }}>
                    <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#1A5FD4' }} />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {challenges.length > 0 && (
            <div className="rounded-3xl bg-white p-8" style={{ border: '1px solid #FECDBB', boxShadow: '0 4px 20px rgba(15,30,58,0.05)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F05A1A' }}>Deine aktuellen Herausforderungen</p>
              <ul className="mt-4 space-y-3">
                {challenges.map((c, i) => (
                  <li key={i} className="flex gap-3 text-sm" style={{ color: '#374151' }}>
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#F05A1A' }} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── 3. Empathy ─────────────────────────────────────────────────────────────
export function OfferEmpathy({ data }: { data: EmpathyData }) {
  if (!data.statement && !data.successMessage) return null
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#0F1E3A' }}>
      <div className="mx-auto max-w-3xl text-center">
        {data.title && (
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>{data.title}</p>
        )}
        {data.statement && (
          <p className="mt-4 text-2xl font-medium leading-relaxed text-white sm:text-3xl">
            „{data.statement}"
          </p>
        )}
        {data.successMessage && (
          <div className="mt-10 rounded-2xl p-5" style={{ backgroundColor: 'rgba(255,201,60,0.12)', border: '1px solid rgba(255,201,60,0.3)' }}>
            <p className="text-sm" style={{ color: '#FFC93C' }}>
              <strong>Was Erfolg für uns heißt:</strong> {data.successMessage}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── 4. Economic Results ────────────────────────────────────────────────────
export function OfferEconomicResults({ results }: { results: EconomicResult[] }) {
  if (!results?.length) return null
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Was Du dadurch erreichst</span>
          <h2 className="mt-2 text-3xl font-bold" style={{ color: '#0D0D0B' }}>Messbare Ergebnisse.</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r, i) => {
            const Icon = (r.icon && ICONS[r.icon]) ?? Target
            return (
              <div key={i} className="rounded-2xl bg-white p-6" style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 12px rgba(15,30,58,0.05)' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>
                  <Icon size={18} />
                </div>
                <h3 className="mt-4 text-base font-bold" style={{ color: '#0D0D0B' }}>{r.title}</h3>
                {r.description && (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: '#6B7280' }}>{r.description}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── 5. Pricing ─────────────────────────────────────────────────────────────
export function OfferPricing({
  programs, selectedOption,
}: {
  programs: ProgramSummary[]
  selectedOption?: string | null
}) {
  const allOptions = programs.flatMap((p) => (p.pricing ?? []).map((o) => ({ ...o, programTitle: p.title })))
  if (!allOptions.length) return null
  const single = allOptions.length === 1

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Investment</span>
          <h2 className="mt-2 text-3xl font-bold" style={{ color: '#0D0D0B' }}>{single ? 'Euer Investment.' : 'Wähle Dein Setup.'}</h2>
          {single && (
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: '#6B7280' }}>
              Ein klar umrissenes Paket — transparent kalkuliert, monatlich abgerechnet.
            </p>
          )}
        </div>
        <div className={single ? 'mx-auto mt-12 max-w-md' : 'mt-12 grid gap-6 lg:grid-cols-3'}>
          {allOptions.map((opt) => {
            const total = opt.monthlyDuration && opt.monthlyDuration > 1
              ? opt.price * opt.monthlyDuration
              : opt.price
            const isSelected = selectedOption === opt.id
            const accent = opt.recommended ? '#0F1E3A' : '#1A5FD4'
            return (
              <div key={opt.id ?? opt.title}
                className="relative flex flex-col rounded-3xl bg-white p-7"
                style={{
                  border: opt.recommended ? `2px solid ${accent}` : '1px solid #E5E7EB',
                  boxShadow: opt.recommended ? '0 20px 50px -20px rgba(15,30,58,0.35)' : '0 2px 12px rgba(15,30,58,0.05)',
                }}>
                {opt.recommended && !single && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                    style={{ backgroundColor: accent }}>
                    <Star size={10} fill="#fff" /> Empfohlen
                  </span>
                )}
                {opt.type && (
                  <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>
                    {opt.type}
                  </p>
                )}
                <h3 className="mt-2 text-xl font-bold" style={{ color: '#0D0D0B' }}>{opt.title}</h3>
                {opt.description && (
                  <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>{opt.description}</p>
                )}
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: '#0D0D0B' }}>€{opt.price.toLocaleString('de-DE')}</span>
                  {opt.monthlyDuration && opt.monthlyDuration > 1 && (
                    <span className="text-sm" style={{ color: '#6B7280' }}>/ Monat</span>
                  )}
                  {opt.priceType === 'perParticipant' && (
                    <span className="text-sm" style={{ color: '#6B7280' }}>/ Teilnehmer</span>
                  )}
                </div>
                {opt.monthlyDuration && opt.monthlyDuration > 1 && (
                  <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
                    Gesamt: €{total.toLocaleString('de-DE')} über {opt.monthlyDuration} Monate
                  </p>
                )}
                {opt.features && opt.features.length > 0 && (
                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    {opt.features.map((f, i) => (
                      <li key={i} className="flex gap-2" style={{ color: '#374151' }}>
                        <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: accent }} /> {f}
                      </li>
                    ))}
                  </ul>
                )}
                {isSelected && (
                  <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold" style={{ color: accent }}>
                    <Check size={12} /> Du hast diese Variante gewählt
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── 6. Accept CTA — Stripe checkout starter (placeholder action for now) ───
export function OfferAcceptCta({ offerSecret, status }: { offerSecret: string; status: string }) {
  const isSigned = status === 'signed' || status === 'paid'
  if (isSigned) {
    return (
      <section className="px-6 py-20" style={{ backgroundColor: '#0F1E3A' }}>
        <div className="mx-auto max-w-2xl text-center text-white">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(93,219,245,0.15)' }}>
            <Check size={28} style={{ color: '#5DDBF5' }} />
          </div>
          <h2 className="mt-5 text-2xl font-bold">Bestätigt — vielen Dank!</h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Wir melden uns mit den nächsten Schritten und dem Onboarding bei Dir.
          </p>
        </div>
      </section>
    )
  }
  return (
    <section className="px-6 py-20" style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #FFF1EB 100%)' }}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold" style={{ color: '#0D0D0B' }}>Bereit zum Start?</h2>
        <p className="mt-4 text-base" style={{ color: '#6B7280' }}>
          Mit einem Klick bestätigst Du das Angebot. Nach der Bestätigung startet Stripe-Checkout für die erste Rate.
        </p>
        <form action={`/api/offers/${offerSecret}/accept`} method="POST" className="mt-8">
          <button type="submit"
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#F05A1A' }}>
            Angebot annehmen →
          </button>
        </form>
        <p className="mt-4 text-xs" style={{ color: '#9CA3AF' }}>
          Du kannst innerhalb von 14 Tagen ohne Angabe von Gründen widerrufen.
        </p>
      </div>
    </section>
  )
}
