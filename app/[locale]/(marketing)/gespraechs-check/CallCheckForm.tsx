'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { FileUp, Loader2, ArrowRight } from 'lucide-react'
import { parseTranscript } from '@/lib/call-check/transcript'

const MIN_WORDS = 250
const MAX_WORDS = 12_000

export function CallCheckForm() {
  const t = useTranslations('callCheck.form')
  const locale = useLocale()
  const router = useRouter()

  const [text, setText] = useState('')
  const [seller, setSeller] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const parsed = useMemo(() => (text.trim() ? parseTranscript(text) : null), [text])
  const speakers = parsed?.speakers.filter((s) => s.name !== '?').slice(0, 6) ?? []

  // Keep the chosen speaker valid when the text changes.
  useEffect(() => {
    if (seller && !speakers.some((s) => s.name === seller)) setSeller(null)
  }, [speakers, seller])

  // The waiting time is part of the experience: say what is happening.
  useEffect(() => {
    if (!busy) return
    const id = setInterval(() => setStep((s) => s + 1), 7000)
    return () => clearInterval(id)
  }, [busy])

  const working = t.raw('working') as string[]
  const words = parsed?.words ?? 0
  const lengthOk = words >= MIN_WORDS && words <= MAX_WORDS
  const canSubmit = lengthOk && consent && /\S+@\S+\.\S+/.test(email) && !busy

  async function onFile(f: File | undefined) {
    if (!f) return
    setText(await f.text())
  }

  async function submit() {
    setBusy(true); setError(null); setStep(0)
    try {
      const res = await fetch('/api/call-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          transcript: text, seller, firstName: firstName || null, email,
          consent: true, newsletter, locale,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(t.has(`errors.${data.error}`) ? t(`errors.${data.error}`) : t('errors.analysis_failed'))
        setBusy(false)
        return
      }
      router.push(data.url)
    } catch {
      setError(t('errors.network'))
      setBusy(false)
    }
  }

  if (busy) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
        <div className="relative h-28 w-28">
          <div className="absolute inset-0 rounded-full border-2 border-[#5DDBF5]/30" />
          <div className="absolute inset-3 rounded-full border-2 border-[#5DDBF5]/20" />
          <div className="absolute inset-0 animate-spin rounded-full"
            style={{ background: 'conic-gradient(from 0deg, rgba(93,219,245,0.55), transparent 35%)', animationDuration: '2.4s' }} />
          <div className="absolute inset-[46%] rounded-full bg-[#FFD37A]" />
        </div>
        <p className="mt-8 text-lg font-semibold text-gray-900">{working[step % working.length]}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F1E3A] text-sm font-bold text-white">1</span>
          <h2 className="text-lg font-bold text-gray-900">{t('step1')}</h2>
        </div>
        <p className="mt-1 pl-10 text-sm text-gray-500">{t('step1Hint')}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          rows={10}
          className="mt-4 w-full rounded-2xl border border-gray-200 bg-[#FAFAF8] p-4 font-mono text-sm text-gray-800 outline-none focus:border-[#1A5FD4] focus:ring-2 focus:ring-[#1A5FD4]/15"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
            <FileUp size={15} /> {t('upload')}
            <input type="file" accept=".txt,.vtt,.srt,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {parsed ? (
            <span className={lengthOk ? 'text-gray-500' : 'font-medium text-[#EB0028]'}>
              {words < MIN_WORDS ? t('tooShort', { min: MIN_WORDS })
                : words > MAX_WORDS ? t('tooLong', { max: MAX_WORDS })
                : t('words', { count: words.toLocaleString(locale) })}
            </span>
          ) : null}
        </div>

        {parsed && lengthOk ? (
          parsed.labelled ? (
            <div className="mt-5 rounded-2xl bg-[#EBF1FF] p-4">
              <p className="text-sm font-bold text-gray-900">{t('whoAreYou')}</p>
              <p className="text-xs text-gray-500">{t('whoAreYouHint')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {speakers.map((s) => (
                  <button key={s.name} type="button" onClick={() => setSeller(s.name)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                      seller === s.name ? 'border-[#1A5FD4] bg-[#1A5FD4] text-white' : 'border-[#BBCFF5] bg-white text-gray-800 hover:border-[#1A5FD4]'}`}>
                    {s.name}
                    <span className={`ml-2 text-xs font-normal ${seller === s.name ? 'text-white/80' : 'text-gray-400'}`}>
                      {Math.round((s.words / parsed.words) * 100)} %
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{t('noSpeakers')}</p>
          )
        ) : null}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F1E3A] text-sm font-bold text-white">2</span>
          <h2 className="text-lg font-bold text-gray-900">{t('step2')}</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('firstName')}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1A5FD4]" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email')} type="email" required
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1A5FD4]" />
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1A5FD4]" />
          <span>{t('consent')}</span>
        </label>
        <label className="mt-3 flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1A5FD4]" />
          <span>{t('newsletter')}</span>
        </label>
      </div>

      {error ? <p className="rounded-xl bg-[#FFEBEC] p-3 text-sm font-medium text-[#EB0028]">{error}</p> : null}

      <button type="button" onClick={submit} disabled={!canSubmit}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1A5FD4] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#1A5FD4]/25 transition hover:bg-[#154fb3] disabled:cursor-not-allowed disabled:opacity-40">
        {busy ? <Loader2 className="animate-spin" size={18} /> : null}
        {t('submit')} <ArrowRight size={18} />
      </button>
    </div>
  )
}
