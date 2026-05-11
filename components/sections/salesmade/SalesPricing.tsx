/**
 * SalesMade Pricing — Standard + Platinum.
 *
 * Bei Jahres-Vorauszahlung: 2 Monate gratis (10 Monatsraten = Jahrespreis).
 * Plätze-Limits sichtbar: 250 Standard, 30 Platinum.
 */
import { Check, Star } from 'lucide-react'

interface PricingTier {
  name: string
  monthly: number
  yearly: number
  monthlyEffective: number
  seats: number
  accent: string
  accentBg: string
  border: string
  highlight?: boolean
  features: string[]
  cta: string
  ctaHref: string
  note: string
}

const TIERS: PricingTier[] = [
  {
    name: 'Standard',
    monthly: 247,
    yearly: 2470,
    monthlyEffective: 205,
    seats: 250,
    accent: '#1A5FD4',
    accentBg: '#EBF1FF',
    border: '#BBCFF5',
    features: [
      '90 Min. monatliches Live-Training mit Top-Praktikern',
      '120 Min. Group-Coaching pro Monat',
      'Offene Community mit erfahrenen Coaches',
      'Alle 16 Trainingsmodule (Sofortzugang)',
      'Sparring in 5 Schwierigkeitsstufen',
      'Playbooks, Vorlagen, E-Mails, Poster',
      'GPT Engines für Vorbereitung & Follow-Up',
      'Kampagnen für Upsell, Cross-Sell & Winback',
      'Zertifikate & Netzwerk',
      '90-Tage-Garantie',
    ],
    cta: 'Jetzt starten',
    ctaHref: '#kontakt',
    note: 'Max. 250 Plätze · monatlich kündbar',
  },
  {
    name: 'Platinum',
    monthly: 580,
    yearly: 5800,
    monthlyEffective: 483,
    seats: 30,
    accent: '#0F1E3A',
    accentBg: '#E5E9F0',
    border: '#0F1E3A',
    highlight: true,
    features: [
      'Alles aus Standard',
      'Monatliche 1:1 Coaching Session (60 Min.)',
      'Exklusive VIP-Gruppen-Session pro Monat',
      'Persönliche Lernpfade nach individuellem Assessment',
      'Direkter Coach-Zugang für dringende Fälle',
      'Bis zu 50 % zusätzliche Performance-Steigerung',
      'Priorisiertes Onboarding & Setup',
    ],
    cta: 'Jetzt bewerben',
    ctaHref: '#kontakt',
    note: 'Nur 30 Plätze · wegen 1:1-Interaktion limitiert',
  },
]

export function SalesPricing() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Investition
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Das Investment amortisiert sich
            <br className="hidden sm:block" /> mit dem ersten zusätzlichen Deal.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            Wähle den Weg, der zu Deinem Team und Deinen Zielen passt.
            Wer upfront zahlt, bekommt zwei Monate gratis.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="relative flex flex-col rounded-3xl bg-white p-8 border-2"
              style={{
                borderColor: t.highlight ? t.accent : '#E5E7EB',
                boxShadow: t.highlight
                  ? '0 10px 30px rgba(15,30,58,0.08), 0 2px 6px rgba(15,30,58,0.05)'
                  : '0 1px 2px rgba(15,30,58,0.04)',
              }}
            >
              {/* Badge */}
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                    style={{ backgroundColor: t.accent }}
                  >
                    <Star size={10} fill="#fff" stroke="#fff" /> Empfohlen
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <h3
                  className="text-2xl font-bold uppercase tracking-wide"
                  style={{ color: t.accent }}
                >
                  {t.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold" style={{ color: '#0D0D0B' }}>
                    €{t.monthly}
                  </span>
                  <span className="text-sm text-gray-500">/ Monat</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  oder <strong style={{ color: '#0D0D0B' }}>€{t.yearly.toLocaleString('de-DE')}</strong> /
                  Jahr — entspricht € {t.monthlyEffective} / Monat (2 Monate gratis)
                </p>
              </div>

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm">
                    <div
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: t.accentBg }}
                    >
                      <Check size={12} style={{ color: t.accent }} strokeWidth={3} />
                    </div>
                    <span style={{ color: '#374151' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={t.ctaHref}
                className="inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: t.accent }}
              >
                {t.cta} →
              </a>

              {/* Note */}
              <p className="mt-3 text-center text-xs text-gray-500">
                {t.highlight && (
                  <span style={{ color: t.accent }}>⚠ </span>
                )}
                {t.note}
              </p>
            </div>
          ))}
        </div>

        {/* Footer reassurance */}
        <div
          className="mt-8 rounded-2xl border p-6 text-center"
          style={{ backgroundColor: '#FFF9F5', borderColor: '#BBCFF5' }}
        >
          <p className="text-sm" style={{ color: '#0D0D0B' }}>
            <strong>90-Tage Geld-zurück-Garantie.</strong>{' '}
            Wenn Du nach 90 Tagen keine messbaren Verbesserungen in Deinen KPIs siehst,
            erstatten wir die volle Investition zurück. Keine Fragen gestellt.
          </p>
        </div>
      </div>
    </section>
  )
}
