'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PublicDef, ShortResult } from '@/lib/ask/engine'
import type { Lang } from '@/lib/ask/types'
import { UI, localePrefix } from '@/lib/ask/ui'
import { efTrack, getVid, rememberContext } from '@/components/analytics/visitor'
import { Journey } from './Journey'

type Phase = 'intro' | 'q' | 'insight' | 'sending' | 'short'
const KEYS = 'ABCDEFG'
export const storeKey = (slug: string) => `ask:${slug}`

/** Fragenstrecke → Kurzergebnis → Kontakt. Zwischenstand in sessionStorage, gerechnet wird auf dem Server. */
export function AskFunnel({ def, lang, source }: { def: PublicDef; lang: Lang; source?: string }) {
  const T = UI[lang]
  const flat = useMemo(() => def.stages.flatMap((s, si) => s.questions.map((q, qi) => ({ ...q, stage: s, si, last: qi === s.questions.length - 1 }))), [def])
  const [phase, setPhase] = useState<Phase>('intro')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [resumed, setResumed] = useState(false)
  const [res, setRes] = useState<{ id: string; claim: string; short: ShortResult } | null>(null)
  const [err, setErr] = useState('')
  const key = storeKey(def.slug)

  // Zwischenstand übernehmen (auch aus dem Teaser auf der Startseite)
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(key) || '{}')
      if (s.done && s.id && s.claim && s.short) { setRes({ id: s.id, claim: s.claim, short: s.short }); setAnswers(s.answers || {}); setPhase('short'); return }
      if (s.answers && Object.keys(s.answers).length) {
        setAnswers(s.answers)
        const next = flat.findIndex((q) => s.answers[q.id] === undefined)
        setStep(next < 0 ? flat.length - 1 : next)
        setPhase('q'); setResumed(true)
      }
    } catch { /* privat */ }
  }, [key, flat])

  const save = (x: Record<string, unknown>) => { try { sessionStorage.setItem(key, JSON.stringify(x)) } catch { /* privat */ } }

  async function submit(a: Record<string, number>) {
    setPhase('sending'); setErr('')
    try {
      const r = await fetch(`/api/ask/${def.slug}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: a, lang, vid: getVid().vid, source: source ?? (document.referrer ? new URL(document.referrer).pathname : null) }),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j.error || 'x')
      setRes({ id: j.id, claim: j.claim, short: j.short })
      save({ answers: a, done: true, id: j.id, claim: j.claim, short: j.short })
      rememberContext({ note: `Engpass-Diagnose: ${j.short.first ? j.short.first.name : '—'}` })
      setPhase('short')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErr(T.errGeneric); setPhase('q')
    }
  }

  function pick(i: number) {
    const q = flat[step]
    const a = { ...answers, [q.id]: i }
    setAnswers(a); save({ answers: a })
    efTrack('quiz_answer', `ask:${def.slug}:${q.id}`, { i, step: step + 1, of: flat.length, lang })
    setTimeout(() => {
      if (step === flat.length - 1) { submit(a); return }
      if (q.last && q.stage.insightAfter) { setPhase('insight'); return }
      setStep(step + 1)
    }, 200)
  }

  function restart() {
    try { sessionStorage.removeItem(key) } catch { /* privat */ }
    setAnswers({}); setStep(0); setRes(null); setResumed(false); setPhase('intro')
    efTrack('quiz_restart', `ask:${def.slug}`, {})
  }

  const answeredStages = new Set(flat.filter((q) => answers[q.id] !== undefined && q.last).map((q) => q.stage.key))

  return (
    <div className="ask">
      <div className="wrap">
        {phase === 'intro' && (
          <div className="grid">
            <div>
              <span className="eb">{def.kicker}</span>
              <h1>{def.title}</h1>
              <p className="lead">{def.intro}</p>
              <ul className="promise">{def.promise.map((p) => <li key={p}>{p}</li>)}</ul>
              <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <button className="btn blue" onClick={() => { setPhase('q'); efTrack('form_start', `ask:${def.slug}:start`, {}) }}>{T.start}</button>
                <span className="meta" style={{ marginTop: 0 }}>{def.duration}</span>
              </div>
            </div>
            <div className="card">
              <span className="eb" style={{ marginBottom: 14 }}>{T.journey}</span>
              <Journey stages={def.stages.map((s) => ({ key: s.key, name: s.name }))} />
            </div>
          </div>
        )}

        {(phase === 'q' || phase === 'sending' || phase === 'insight') && (
          <div className="grid">
            <div className="qcard">
              {resumed && step > 0 && phase === 'q' && <div className="note">{T.resumed}</div>}
              <div className="qhead">
                <span className="st">{T.stageOf.replace('{n}', String(flat[step].si + 1)).replace('{t}', String(def.stages.length))} · {flat[step].stage.name}</span>
                <span>{T.qOf.replace('{n}', String(step + 1)).replace('{t}', String(flat.length))}</span>
              </div>
              <div className="bars">{flat.map((q, i) => <span key={q.id} className={i <= step ? 'on' : ''} />)}</div>
              {phase === 'insight' ? (
                <>
                  <p className="insight">{flat[step].stage.insightAfter}</p>
                  <div className="qfoot">
                    <span />
                    <button className="btn blue" onClick={() => { setStep(step + 1); setPhase('q') }}>{T.next}</button>
                  </div>
                </>
              ) : phase === 'sending' ? (
                <p className="qt" aria-live="polite">{T.computing}</p>
              ) : (
                <>
                  <div className="qt">{flat[step].prompt}</div>
                  {flat[step].hint && <p className="qh">{flat[step].hint}</p>}
                  <div className="opts">
                    {flat[step].options.map((o, i) => (
                      <button key={i} type="button" className={`opt${answers[flat[step].id] === i ? ' sel' : ''}`} onClick={() => pick(i)}>
                        <span className="k">{KEYS[i]}</span><span>{o}</span>
                      </button>
                    ))}
                  </div>
                  <div className="qfoot">
                    {step > 0 ? <button className="link" onClick={() => setStep(step - 1)}>{T.back}</button> : <span />}
                    {err && <span className="small" style={{ color: 'var(--red)' }}>{err}</span>}
                  </div>
                </>
              )}
            </div>
            <div className="card no-print">
              <span className="eb" style={{ marginBottom: 14 }}>{T.journey}</span>
              <Journey stages={def.stages.map((s) => ({ key: s.key, name: s.name, state: answeredStages.has(s.key) ? 'on' : undefined }))} current={flat[step].stage.key} />
            </div>
          </div>
        )}

        {phase === 'short' && res && <ShortView def={def} lang={lang} res={res} onRestart={restart} />}
      </div>
    </div>
  )
}

function ShortView({ def, lang, res, onRestart }: { def: PublicDef; lang: Lang; res: { id: string; claim: string; short: ShortResult }; onRestart: () => void }) {
  const T = UI[lang]
  const s = res.short
  const [f, setF] = useState({ email: '', company: '', phone: '', firstName: '', consent: false })
  const [state, setState] = useState<'form' | 'sending' | 'sent'>('form')
  const [err, setErr] = useState('')
  const [resent, setResent] = useState(false)

  useEffect(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem('ef_ctx') || '{}')
      setF((x) => ({ ...x, email: c.email || x.email, firstName: c.firstName || x.firstName }))
      if (sessionStorage.getItem(`${storeKey(def.slug)}:sent`)) setState('sent')
    } catch { /* privat */ }
  }, [def.slug])

  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return setErr(T.errMail)
    if (f.company.trim().length < 2) return setErr(T.errCompany)
    if (def.phone === 'required' && f.phone.replace(/\D/g, '').length < 6) return setErr(T.errPhone)
    if (f.phone && f.phone.replace(/\D/g, '').length < 6) return setErr(T.errPhone)
    if (!f.consent) return setErr(T.errConsent)
    setErr(''); setState('sending')
    try {
      const r = await fetch(`/api/ask/${def.slug}/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: res.id, claim: res.claim, email: f.email.trim(), company: f.company.trim(), phone: f.phone.trim(), firstName: f.firstName.trim(), consent: true, vid: getVid().vid }),
      })
      if (!r.ok) throw new Error(String(r.status))
      try { sessionStorage.setItem(`${storeKey(def.slug)}:sent`, f.email.trim()) } catch { /* privat */ }
      rememberContext({ email: f.email.trim(), firstName: f.firstName.trim() || undefined })
      setState('sent')
    } catch {
      setErr(T.errGeneric); setState('form')
    }
  }

  const sentTo = (() => { try { return sessionStorage.getItem(`${storeKey(def.slug)}:sent`) || f.email } catch { return f.email } })()
  const headline = s.first ? (s.first.kind === 'red' ? T.firstRed : T.firstYellow) : T.allGreen

  return (
    <div className="grid">
      <div>
        <span className="eb">{T.resultEyebrow}</span>
        <p style={{ marginTop: 14, fontWeight: 700, color: 'var(--g6)' }}>{headline}</p>
        <div className="first">{s.first ? s.first.name : T.allGreen}</div>
        <p className="lead" style={{ marginTop: 14 }}>{s.first ? s.first.diagnosis : T.allGreenText}</p>
        {s.redCount > 0 && <p style={{ marginTop: 10, fontWeight: 600, color: 'var(--ink)' }}>{T.redCount(s.redCount)}</p>}
        <div className="card line" style={{ marginTop: 26 }}>
          <span className="eb" style={{ marginBottom: 14 }}>{T.journey}</span>
          <Journey stages={s.stages.map((x) => ({ key: x.key, name: x.name, state: x.status }))} first={s.first?.key} />
          <div className="legend">
            <span><i style={{ background: 'var(--red)' }} />{T.legendRed}</span>
            <span><i style={{ background: '#FFE7A3' }} />{T.legendYellow}</span>
            <span><i style={{ background: '#D5F2E1' }} />{T.legendGreen}</span>
          </div>
        </div>
        <button className="link no-print" style={{ marginTop: 14 }} onClick={onRestart}>{T.restart}</button>
      </div>

      <div className="card blue">
        {state === 'sent' ? (
          <>
            <span className="eb">{T.lockedTitle}</span>
            <h2 style={{ color: '#fff' }}>{T.sentTitle}</h2>
            <p style={{ marginTop: 12 }}>{T.sentText(sentTo)}</p>
            <button className="link" style={{ color: '#fff', marginTop: 16, textDecoration: 'underline' }} disabled={resent || !f.email || !f.consent}
              onClick={async () => { if (!f.email) return; await send(); setResent(true) }}>{resent ? T.resent : T.resend}</button>
          </>
        ) : (
          <>
            <span className="eb">{T.lockedTitle}</span>
            <ul className="locked">{T.locked.map((x) => <li key={x}>{x}</li>)}</ul>
            <form className="contact" onSubmit={send} noValidate>
              <label className="f"><span>{T.email}</span><input className="in" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label className="f"><span>{T.company}</span><input className="in" autoComplete="organization" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></label>
              <div className="two">
                <label className="f"><span>{T.firstName} <small>· {T.firstNameOpt}</small></span><input className="in" autoComplete="given-name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></label>
                {def.phone !== 'off' && (
                  <label className="f"><span>{T.phone} {def.phone === 'optional' && <small>· optional</small>}</span><input className="in" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
                )}
              </div>
              {def.phone === 'optional' && <p style={{ fontSize: 12, marginTop: -4 }}>{T.phoneOpt}</p>}
              <label className="terms">
                <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
                <span>{T.consent} <a href={`${localePrefix(lang)}/datenschutz`} target="_blank" rel="noopener">{T.privacy}</a></span>
              </label>
              <div className="err" role="alert">{err}</div>
              <button className="btn white" type="submit" disabled={state === 'sending'}>{state === 'sending' ? T.sending : T.submit}</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
