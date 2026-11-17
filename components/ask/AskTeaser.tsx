'use client'

import { useEffect, useState } from 'react'
import type { Lang } from '@/lib/ask/types'
import { UI, localePrefix } from '@/lib/ask/ui'
import { efTrack } from '@/components/analytics/visitor'
import { Journey } from './Journey'

export interface TeaserData {
  slug: string; kicker: string; headline: string; sub: string; button: string; duration: string
  stages: { key: string; name: string }[]
  questions: { id: string; stage: string; prompt: string; options: string[] }[]
}

/**
 * Kurzer Einstieg auf Startseite oder Landingpage: zwei, drei Fragen mit der
 * Umsatz-Reise als Visual. Die Antworten wandern in den vollen Funnel mit.
 */
export function AskTeaser({ data, lang }: { data: TeaserData; lang: Lang }) {
  const T = UI[lang]
  const key = `ask:${data.slug}`
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [step, setStep] = useState(0)
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(key) || '{}')
      if (s.answers && !s.done) {
        setAnswers(s.answers)
        const n = data.questions.findIndex((q) => s.answers[q.id] === undefined)
        setStep(n < 0 ? data.questions.length : n)
      }
    } catch { /* privat */ }
  }, [key, data.questions])

  const href = `${localePrefix(lang)}/check/${data.slug}?src=teaser`
  const done = step >= data.questions.length
  const q = data.questions[Math.min(step, data.questions.length - 1)]
  const lit = new Set(data.questions.filter((x) => answers[x.id] !== undefined).map((x) => x.stage))

  function pick(i: number) {
    const a = { ...answers, [q.id]: i }
    setAnswers(a)
    try { sessionStorage.setItem(key, JSON.stringify({ answers: a })) } catch { /* privat */ }
    efTrack('quiz_answer', `ask:${data.slug}:${q.id}`, { i, step: step + 1, of: data.questions.length, teaser: true, lang })
    setTimeout(() => setStep(step + 1), 200)
  }

  return (
    <div className="ask teaser">
      <div className="tz">
        <div>
          <span className="eb">{data.kicker}</span>
          <h2>{data.headline}</h2>
          <p style={{ marginTop: 12 }}>{data.sub}</p>
          <div style={{ marginTop: 22 }}>
            <Journey stages={data.stages.map((s) => ({ ...s, state: lit.has(s.key) ? 'on' : undefined }))} current={done ? undefined : q.stage} />
          </div>
        </div>
        <div className="qcard">
          {!done ? (
            <>
              <div className="qhead">
                <span className="st">{data.stages.find((s) => s.key === q.stage)?.name}</span>
                <span>{T.qOf.replace('{n}', String(step + 1)).replace('{t}', String(data.questions.length))}</span>
              </div>
              <div className="bars">{data.questions.map((x, i) => <span key={x.id} className={i <= step ? 'on' : ''} />)}</div>
              <div className="qt">{q.prompt}</div>
              <div className="opts">
                {q.options.map((o, i) => (
                  <button key={i} type="button" className={`opt${answers[q.id] === i ? ' sel' : ''}`} onClick={() => pick(i)}>
                    <span className="k">{'ABCD'[i]}</span><span>{o}</span>
                  </button>
                ))}
              </div>
              <div className="qfoot">
                {step > 0 ? <button className="link" onClick={() => setStep(step - 1)}>{T.back}</button> : <span />}
                <a className="link" href={href} onClick={() => efTrack('cta_click', `ask_teaser:${data.slug}:skip`, { href })}>{data.button}</a>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
              <div className="qt" style={{ marginTop: 0 }}>{data.sub}</div>
              <a className="btn blue" href={href} onClick={() => efTrack('cta_click', `ask_teaser:${data.slug}`, { href })}>{data.button}</a>
              <span className="small">{data.duration}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
