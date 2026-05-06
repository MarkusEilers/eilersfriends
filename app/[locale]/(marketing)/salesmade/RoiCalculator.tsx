'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Calendar, Calculator } from 'lucide-react'

export function SalesMadeRoiCalculator({ accent }: { accent: string }) {
  const [salespeople, setSalespeople] = useState(8)
  const [dealValue, setDealValue] = useState(15000)
  const [meetings, setMeetings] = useState(12)
  const [conversion, setConversion] = useState(28) // % — Discovery-to-Close

  // Floor: SalesMade lifts low-activity sellers up to 10 first-meetings/month
  const ACTIVITY_FLOOR = 10
  const upgradedMeetings = Math.max(meetings, ACTIVITY_FLOOR)
  const isLifted = meetings < ACTIVITY_FLOOR

  // Conversion lift: +26 percentage points, capped at 72 %.
  // Above 72 % we don't model further isolated improvement (diminishing returns).
  const CONVERSION_CAP = 72
  const CONVERSION_LIFT_PP = 26
  const isAtCap = conversion >= CONVERSION_CAP
  const upgradedConversion = isAtCap
    ? conversion
    : Math.min(conversion + CONVERSION_LIFT_PP, CONVERSION_CAP)

  const result = useMemo(() => {
    // Baseline: current state — user's conversion %, current meeting volume
    // Upgraded: capped/lifted conversion + 48 % deal value + lifted meeting floor
    const baselineRevenue = meetings * 12 * salespeople * (conversion / 100) * dealValue
    const upgradedRevenue =
      upgradedMeetings * 12 * salespeople * (upgradedConversion / 100) * dealValue * 1.48
    const delta = Math.max(0, upgradedRevenue - baselineRevenue)
    return Math.round(delta)
  }, [salespeople, dealValue, meetings, upgradedMeetings, conversion, upgradedConversion])

  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(result)

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="grid gap-8 md:grid-cols-[1fr_320px] md:items-start">
        {/* Inputs */}
        <div className="space-y-5">
          <Field
            label="Anzahl Verkäufer"
            value={salespeople}
            min={1}
            max={50}
            step={1}
            onChange={setSalespeople}
            accent={accent}
          />
          <Field
            label="Durchschnittlicher Deal-Wert"
            value={dealValue}
            min={1000}
            max={250000}
            step={1000}
            onChange={setDealValue}
            accent={accent}
            format={(n) =>
              new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(n)
            }
          />
          <div>
            <Field
              label="Erstgespräche pro Verkäufer / Monat"
              value={meetings}
              min={1}
              max={40}
              step={1}
              onChange={setMeetings}
              accent={accent}
            />
            {isLifted && (
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                <span className="font-semibold" style={{ color: accent }}>
                  + Activity-Lift:
                </span>{' '}
                Liegt dein Team unter {ACTIVITY_FLOOR} Erstgesprächen/Monat,
                bringen wir es im Programm auf dieses Niveau. Die Berechnung
                rechnet daher mit {ACTIVITY_FLOOR} statt {meetings}.
              </p>
            )}
          </div>
          <div>
            <Field
              label="Aktuelle Conversion (Discovery → Close)"
              value={conversion}
              min={5}
              max={75}
              step={1}
              onChange={setConversion}
              accent={accent}
              format={(n) => `${n} %`}
            />
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {isAtCap ? (
                <>
                  <span className="font-semibold" style={{ color: accent }}>
                    Über dem Skill-Cap:
                  </span>{' '}
                  Ab {CONVERSION_CAP} % ist die Conversion isoliert
                  schwer weiter zu steigern. Die Berechnung modelliert für
                  diesen Slider keinen zusätzlichen Conversion-Lift —
                  Wachstum kommt dann nur aus Aktivität, Deal-Wert + Pipeline.
                </>
              ) : (
                <>
                  <span className="font-semibold" style={{ color: accent }}>
                    + Skill-Lift:
                  </span>{' '}
                  Im Programm rechnen wir mit +{CONVERSION_LIFT_PP} pp
                  (gekappt bei {CONVERSION_CAP} %). Berechnung verwendet
                  daher {upgradedConversion} % statt {conversion} %.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Result */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#EBF1FF' }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
            <Calculator size={14} /> Ungenutztes Potenzial
          </div>
          <div className="mt-3 text-3xl font-bold leading-tight" style={{ color: accent }}>
            {formatted}
          </div>
          <div className="mt-1 text-xs text-gray-500">pro Jahr</div>
          <p className="mt-4 text-xs leading-relaxed text-gray-600">
            Basierend auf{' '}
            {isAtCap
              ? <>unveränderter Conversion ({conversion}&#x202F;% — bereits über Skill-Cap)</>
              : <>verbesserter Conversion ({conversion}&#x202F;% → {upgradedConversion}&#x202F;%)</>}
            , +48&#x202F;% höheren Deal-Werten und mindestens {ACTIVITY_FLOOR}&#x202F;
            Erstgesprächen pro Verkäufer/Monat — Branchenkennzahlen unserer Kunden.
          </p>
          <Link
            href="/kontakt"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Calendar size={14} /> Jetzt unverbindliches Erstgespräch sichern
          </Link>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, min, max, step, onChange, accent, format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (n: number) => void
  accent: string
  format?: (n: number) => string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</label>
        <span className="text-base font-bold" style={{ color: accent }}>
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
        style={{ accentColor: accent }}
      />
    </div>
  )
}
