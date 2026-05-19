'use client'

import { useState, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { Calendar, Calculator } from 'lucide-react'

const CURRENCY_LOCALE: Record<string, string> = {
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
  ru: 'ru-RU',
}

export function SalesMadeRoiCalculator({ accent }: { accent: string }) {
  const t = useTranslations('salesmadePage.roiCalculator')
  const locale = useLocale()
  const currencyLocale = CURRENCY_LOCALE[locale] ?? 'en-US'

  const [salespeople, setSalespeople] = useState(8)
  const [dealValue, setDealValue] = useState(15000)
  const [meetings, setMeetings] = useState(12)
  const [conversion, setConversion] = useState(28) // % — Discovery-to-Close

  const ACTIVITY_FLOOR = 10
  const upgradedMeetings = Math.max(meetings, ACTIVITY_FLOOR)
  const isLifted = meetings < ACTIVITY_FLOOR

  const CONVERSION_CAP = 72
  const CONVERSION_LIFT_PP = 26
  const isAtCap = conversion >= CONVERSION_CAP
  const upgradedConversion = isAtCap
    ? conversion
    : Math.min(conversion + CONVERSION_LIFT_PP, CONVERSION_CAP)

  const result = useMemo(() => {
    const baselineRevenue = meetings * 12 * salespeople * (conversion / 100) * dealValue
    const upgradedRevenue =
      upgradedMeetings * 12 * salespeople * (upgradedConversion / 100) * dealValue * 1.48
    const delta = Math.max(0, upgradedRevenue - baselineRevenue)
    return Math.round(delta)
  }, [salespeople, dealValue, meetings, upgradedMeetings, conversion, upgradedConversion])

  const formatted = new Intl.NumberFormat(currencyLocale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(result)

  const dealValueFmt = (n: number) =>
    new Intl.NumberFormat(currencyLocale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
      <div className="grid gap-8 md:grid-cols-[1fr_320px] md:items-start">
        <div className="space-y-5">
          <Field
            label={t('labelSalespeople')}
            value={salespeople}
            min={1} max={50} step={1}
            onChange={setSalespeople} accent={accent}
          />
          <Field
            label={t('labelDealValue')}
            value={dealValue}
            min={1000} max={250000} step={1000}
            onChange={setDealValue} accent={accent}
            format={dealValueFmt}
          />
          <div>
            <Field
              label={t('labelMeetings')}
              value={meetings}
              min={1} max={40} step={1}
              onChange={setMeetings} accent={accent}
            />
            {isLifted && (
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                <span className="font-semibold" style={{ color: accent }}>
                  {t('activityLiftLabel')}
                </span>{' '}
                {t('activityLiftBody', { floor: ACTIVITY_FLOOR, current: meetings })}
              </p>
            )}
          </div>
          <div>
            <Field
              label={t('labelConversion')}
              value={conversion}
              min={5} max={75} step={1}
              onChange={setConversion} accent={accent}
              format={(n) => `${n} %`}
            />
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {isAtCap ? (
                <>
                  <span className="font-semibold" style={{ color: accent }}>
                    {t('capLabel')}
                  </span>{' '}
                  {t('capBody', { cap: CONVERSION_CAP })}
                </>
              ) : (
                <>
                  <span className="font-semibold" style={{ color: accent }}>
                    {t('liftLabel')}
                  </span>{' '}
                  {t('liftBody', { lift: CONVERSION_LIFT_PP, cap: CONVERSION_CAP, upgraded: upgradedConversion, current: conversion })}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ backgroundColor: '#EBF1FF' }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
            <Calculator size={14} /> {t('resultEyebrow')}
          </div>
          <div className="mt-3 text-3xl font-bold leading-tight" style={{ color: accent }}>
            {formatted}
          </div>
          <div className="mt-1 text-xs text-gray-500">{t('perYear')}</div>
          <p className="mt-4 text-xs leading-relaxed text-gray-600">
            {isAtCap
              ? t('narrativeAtCapPre', { current: conversion })
              : t('narrativeLiftPre', { current: conversion, upgraded: upgradedConversion })}
            {t('narrativePost', { floor: ACTIVITY_FLOOR })}
          </p>
          <Link
            href="/kontakt"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Calendar size={14} /> {t('cta')}
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
  min: number; max: number; step: number
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
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
        style={{ accentColor: accent }}
      />
    </div>
  )
}
