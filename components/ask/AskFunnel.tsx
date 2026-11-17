'use client'

import { useEffect, useMemo, useState } from 'react'
import type { PublicDef, ShortResult } from '@/lib/ask/engine'
import type { Lang } from '@/lib/ask/types'
import { UI, UI2, localePrefix } from '@/lib/ask/ui'
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

  if (phase === 'short' && res) return <div className="ask"><ShortView def={def} lang={lang} res={res} onRestart={restart} /></div>

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

      </div>
    </div>
  )
}

function ShortView({ def, lang, res, onRestart }: { def: PublicDef; lang: Lang; res: { id: string; claim: string; short: ShortResult }; onRestart: () => void }) {
  const T = UI[lang], U = UI2[lang]
  const s = res.short
  const sentKey = `${storeKey(def.slug)}:sent`
  const [f, setF] = useState({ email: '', company: '', phone: '', firstName: '', consent: false })
  const [state, setState] = useState<'form' | 'sending' | 'sent'>('form')
  const [err, setErr] = useState('')
  const [resent, setResent] = useState(false)
  const [brand, setBrand] = useState<{ logo: string | null; color: string | null } | null>(null)
  const counts = { red: 0, yellow: 0, green: 0 }
  for (const x of s.stages) counts[x.status]++

  useEffect(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem('ef_ctx') || '{}')
      const sent = JSON.parse(sessionStorage.getItem(sentKey) || 'null')
      setF((x) => ({ ...x, email: sent?.email || c.email || x.email, firstName: c.firstName || x.firstName, company: sent?.company || x.company }))
      if (sent) setState('sent')
    } catch { /* privat */ }
  }, [sentKey])

  // Logo und Farbe nachladen, sobald das Formular raus ist (Server sucht im Hintergrund)
  useEffect(() => {
    if (state !== 'sent' || brand?.logo) return
    let n = 0, stop = false
    const tick = async () => {
      if (stop || n++ > 12) return
      try {
        const r = await fetch(`/api/ask/${def.slug}/brand?id=${res.id}&claim=${encodeURIComponent(res.claim)}`, { cache: 'no-store' })
        const j = await r.json()
        if (j.ok && (j.logo || j.done)) { setBrand({ logo: j.logo, color: j.color }); if (j.company) setF((x) => ({ ...x, company: x.company || j.company })); return }
      } catch { /* weiter */ }
      setTimeout(tick, 1500)
    }
    tick()
    return () => { stop = true }
  }, [state, brand?.logo, def.slug, res.id, res.claim])

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
      try { sessionStorage.setItem(sentKey, JSON.stringify({ email: f.email.trim(), company: f.company.trim() })) } catch { /* privat */ }
      rememberContext({ email: f.email.trim(), firstName: f.firstName.trim() || undefined })
      setState('sent')
    } catch {
      setErr(T.errGeneric); setState('form')
    }
  }

  const headline = s.first ? (s.first.kind === 'red' ? T.firstRed : T.firstYellow) : T.allGreen
  const statusColor = { red: 'linear-gradient(90deg,#C80022,#FF3B5C)', yellow: 'linear-gradient(90deg,#E09E00,#FFC83D)', green: 'linear-gradient(90deg,#16955C,#2BD083)' }
  const widths = { red: 22, yellow: 52, green: 86 }

  return (
    <>
      {/* Bühne: Ergebnis */}
      <section className="stage">
        <img className="wing" src="/wing-white.png" alt="" aria-hidden />
        <div className="in hero2">
          <div>
            <span className="eb rise"><i className="live" />{T.resultEyebrow}</span>
            <p className="kick rise d1">{headline}</p>
            <div className="big rise d2">{s.first ? <span className="mark">{s.first.name}</span> : T.allGreen}</div>
            <p className="lead rise d3" style={{ marginTop: 22 }}>{s.first ? s.first.diagnosis : T.allGreenText}</p>
            <div className="trio rise d4">
              <div className="r"><b>{counts.red}</b><span>{U.trio[0]}</span></div>
              <div className="y"><b>{counts.yellow}</b><span>{U.trio[1]}</span></div>
              <div className="g"><b>{counts.green}</b><span>{U.trio[2]}</span></div>
            </div>
            <div className="rise d5" style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 34, flexWrap: 'wrap' }}>
              <a className="btn go" href="#report" onClick={(e) => { e.preventDefault(); document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' }) }}>{U.toReport}</a>
              <button className="link no-print" style={{ color: 'rgba(255,255,255,.6)' }} onClick={onRestart}>{T.restart}</button>
            </div>
          </div>
          <div className="glassp rise d2">
            <span className="eb" style={{ marginBottom: 18 }}>{T.journey}</span>
            <Journey dark anim stages={s.stages.map((x) => ({ key: x.key, name: x.name, state: x.status }))} first={s.first?.key} firstTag={s.first?.kind === 'red' ? 'Nr. 1' : undefined} />
            <div className="legend">
              <span><i style={{ background: 'var(--red-s)' }} />{T.legendRed}</span>
              <span><i style={{ background: 'var(--amber)' }} />{T.legendYellow}</span>
              <span><i style={{ background: 'var(--green)' }} />{T.legendGreen}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Report freischalten */}
      <section className="unlock" id="report">
        <div className="in cols">
          <div className="paper-stack" aria-hidden>
            <div className="paper back" />
            <div className="paper">
              <div className="ph">
                <div style={{ minWidth: 0 }}>
                  <div className="ttl">{U.coverTitle}</div>
                  <div className={`for${f.company.trim() ? '' : ' empty'}`}>{U.coverFor} {f.company.trim() || U.coverEmpty}</div>
                  {brand?.color && <span style={{ display: 'block', width: 48, height: 4, borderRadius: 2, marginTop: 10, background: brand.color }} />}
                </div>
                <div className={`logo-slot${brand?.logo ? ' has' : ''}`}>{brand?.logo ? <img src={brand.logo} alt="" /> : U.logoSlot}</div>
              </div>
              <div className="mini">
                {s.stages.map((x) => (
                  <div key={x.key}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.name}</span>
                    <i style={{ ['--w' as string]: `${widths[x.status]}%`, ['--c' as string]: statusColor[x.status] } as React.CSSProperties} /><em /></div>
                ))}
              </div>
              <div className="blurred"><span /><span /><span /></div>
              <div style={{ height: 34 }} />
              <span className={`lockchip${state === 'sent' ? ' ok' : ''}`}>{state === 'sent' ? '✓ ' + U.okChip : '🔒 ' + U.lockChip}</span>
            </div>
          </div>

          <div className="form-card">
            {state === 'sent' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
                <div className="done-ic"><svg width="30" height="30" viewBox="0 0 30 30"><path d="M8 15.5l5 5 9-11" fill="none" stroke="#16955C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                <h2 style={{ marginTop: 0 }}>{T.sentTitle}</h2>
                <p>{T.sentText(f.email || '…')}</p>
                <button className="link" style={{ textDecoration: 'underline' }} disabled={resent || !f.email || !f.consent}
                  onClick={async () => { await send(); setResent(true) }}>{resent ? T.resent : T.resend}</button>
              </div>
            ) : (
              <>
                <span className="eb">{T.lockedTitle}</span>
                <h2>{U.formTitle}</h2>
                <p style={{ marginTop: 6 }}>{U.formSub}</p>
                <ul className="ticks">{T.locked.map((x) => <li key={x}>{x}</li>)}</ul>
                <form className="contact" onSubmit={send} noValidate>
                  <label className="f"><span>{T.email}</span><input className="inp" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
                  <label className="f"><span>{T.company}</span><input className="inp" autoComplete="organization" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></label>
                  <div className="two">
                    <label className="f"><span>{T.firstName} <small>· {T.firstNameOpt}</small></span><input className="inp" autoComplete="given-name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></label>
                    {def.phone !== 'off' && (
                      <label className="f"><span>{T.phone} {def.phone === 'optional' && <small>· {T.firstNameOpt}</small>}</span><input className="inp" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
                    )}
                  </div>
                  <label className="terms">
                    <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
                    <span>{T.consent} <a href={`${localePrefix(lang)}/datenschutz`} target="_blank" rel="noopener">{T.privacy}</a></span>
                  </label>
                  <div className="err" role="alert">{err}</div>
                  <button className="btn blue full" type="submit" disabled={state === 'sending'}>{state === 'sending' ? T.sending : T.submit}</button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
