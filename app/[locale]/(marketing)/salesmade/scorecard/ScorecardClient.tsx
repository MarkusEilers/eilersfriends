'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, RefreshCw, Trophy } from 'lucide-react'

interface Tier { from: number; label: string; body: string; cta: string }
interface Labels {
  scaleLow: string; scaleHigh: string; progress: string; submit: string
  yourScore: string; maxScore: string; startOver: string
  wantReport: string; wantReportBody: string; emailLabel: string; firstNameLabel: string
  sendReport: string; reportSent: string
}

interface Props { questions: string[]; tiers: Tier[]; labels: Labels }

export function ScorecardClient({ questions, tiers, labels }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [sending, setSending] = useState(false)

  const total = questions.length * 5
  const score = useMemo(() => Object.values(answers).reduce((a, b) => a + b, 0), [answers])
  const answered = Object.keys(answers).length
  const progress = Math.round((answered / questions.length) * 100)
  const tier = useMemo(() => {
    return [...tiers].reverse().find((t) => score >= t.from) ?? tiers[0]
  }, [score, tiers])

  const pct = Math.round((score / total) * 100)

  function setAnswer(i: number, v: number) {
    setAnswers((p) => ({ ...p, [i]: v }))
  }

  async function sendReport(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSending(true)
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, source: 'discovery-scorecard' }),
      })
      setReportSent(true)
    } catch { /* surface a toast in a future iteration */ }
    finally { setSending(false) }
  }

  function reset() {
    setAnswers({})
    setSubmitted(false)
    setEmail('')
    setFirstName('')
    setReportSent(false)
  }

  if (submitted && tier) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>
            <Trophy size={22} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#1A5FD4' }}>{labels.yourScore}</p>
          <p className="mt-2 text-5xl font-bold tabular-nums" style={{ color: '#0D0D0B' }}>{score}<span className="text-2xl text-gray-400">/{total}</span></p>
          <div className="mx-auto mt-5 h-2 max-w-md rounded-full bg-gray-100">
            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#1A5FD4' }} />
          </div>
          <h2 className="mt-6 text-2xl font-bold" style={{ color: '#0D0D0B' }}>{tier.label}</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-gray-600">{tier.body}</p>
          <a
            href="/kontakt"
            className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1A5FD4' }}
          >
            {tier.cta} <ArrowRight size={14} />
          </a>
        </div>

        {/* Email capture */}
        {!reportSent ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>{labels.wantReport}</h3>
            <p className="mt-2 text-sm text-gray-600">{labels.wantReportBody}</p>
            <form onSubmit={sendReport} className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={labels.firstNameLabel}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder={labels.emailLabel}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !email}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {labels.sendReport}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-3xl border border-green-200 bg-green-50 p-5">
            <CheckCircle2 size={20} className="text-green-600" />
            <span className="text-sm font-semibold text-green-800">{labels.reportSent}</span>
          </div>
        )}

        <div className="text-center">
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <RefreshCw size={12} /> {labels.startOver}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{labels.progress}: {answered}/{questions.length}</p>
        <div className="h-1.5 w-32 rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#1A5FD4' }} />
        </div>
      </div>

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: '#1A5FD4' }}>{i + 1}</span>
              <p className="text-base font-semibold leading-snug" style={{ color: '#0D0D0B' }}>{q}</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="hidden text-[10px] uppercase tracking-widest text-gray-400 sm:inline">{labels.scaleLow}</span>
              <div className="flex flex-1 justify-center gap-2">
                {[1, 2, 3, 4, 5].map((v) => {
                  const sel = answers[i] === v
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAnswer(i, v)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold transition ${
                        sel ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {v}
                    </button>
                  )
                })}
              </div>
              <span className="hidden text-[10px] uppercase tracking-widest text-gray-400 sm:inline">{labels.scaleHigh}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={answered < questions.length}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {labels.submit} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
