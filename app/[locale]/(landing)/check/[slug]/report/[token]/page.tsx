/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFunnel } from '@/lib/ask/registry'
import { readReportToken } from '@/lib/ask/tokens'
import { getSubmission, countView } from '@/lib/ask/store'
import { UI, UI2, localePrefix } from '@/lib/ask/ui'
import { ASK_CSS } from '@/components/ask/ask-css'
import { Journey } from '@/components/ask/Journey'
import { PrintButton } from '@/components/ask/PrintButton'
import type { AskCta, Lang } from '@/lib/ask/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Report · Umsatz-Engpass-Diagnose', robots: { index: false, follow: false } }

type P = { params: Promise<{ locale: string; slug: string; token: string }> }

/** Persönlicher Report — nur über den signierten Link, erst nach Double-Opt-In. Mit Logo und Farbe des Teilnehmers. */
export default async function ReportPage({ params }: P) {
  const { slug, token } = await params
  const f = getFunnel(slug)
  const id = readReportToken(decodeURIComponent(token))
  if (!f || !id) notFound()
  const s = await getSubmission(id)
  if (!s || s.funnel !== slug) notFound()
  const lang: Lang = s.lang
  const T = UI[lang], R = T.report, U = UI2[lang], def = f.def
  const css = <style href="ask-css" precedence="default">{ASK_CSS}</style>

  if (!s.confirmedAt) {
    return <div className="ask">{css}<div className="wrap"><div className="card"><h2>{R.notConfirmed}</h2></div></div></div>
  }
  await countView(s.id)

  const r = s.result
  const stage = (k: string) => def.stages.find((x) => x.key === k)!
  const order = r.constraints.length ? r.constraints : r.stages.filter((x) => x.status === 'yellow').sort((a, b) => a.score - b.score).slice(0, 3).map((x) => x.key)
  const strengths = r.stages.filter((x) => x.status === 'green')
  const labels = [R.first, R.then, R.after]
  const date = new Date(s.confirmedAt).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const href = (c: AskCta) => (c.href.startsWith('/') ? `${localePrefix(lang)}${c.href}` : c.href)
  const main = def.ctas[r.cta]
  const avg = Math.round(r.stages.reduce((a, x) => a + x.score, 0) / Math.max(1, r.stages.length))
  const R0 = 92, LEN = 2 * Math.PI * R0, arc = (LEN * avg) / 100
  const firstSt = r.first ? stage(r.first) : null
  const brand = s.brand.color && /^#[0-9a-f]{6}$/i.test(s.brand.color) ? s.brand.color : null

  return (
    <div className="ask" style={brand ? ({ ['--brand' as string]: brand } as React.CSSProperties) : undefined}>
      {css}
      {/* Kopf */}
      <section className="stage">
        <img className="wing" src="/wing-white.png" alt="" aria-hidden />
        <div className="in">
          <div className="rtop rise">
            <div className="brandrow">
              {s.brand.logo && <><span className="lg"><img src={s.brand.logo} alt={s.company ?? ''} /></span><span className="x">×</span></>}
              <span className="ef"><img src="/wing-white.png" alt="" />Eilers+Friends</span>
            </div>
            <div className="no-print"><PrintButton label={R.print} /></div>
          </div>
          <div className="rhero">
            <div>
              <span className="eb rise d1">{def.kicker[lang]} · {R.eyebrow}</span>
              <h1 className="rise d2">{s.company ? R.forTitle(s.company) : def.title[lang]}</h1>
              <span className="accent rise d3" />
              <p className="rise d3" style={{ marginTop: 18 }}>{R.date} {date}</p>
              {firstSt && (
                <div className="rise d4" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 26 }}>
                  <span className={`pill ${r.firstKind === 'red' ? 'red' : 'yellow'}`}>{r.firstKind === 'red' ? U.bottleneck : U.lever}: {firstSt.name[lang]}</span>
                  {r.redCount > 0 && <span className="pill red">{T.redCount(r.redCount)}</span>}
                  {strengths.length > 0 && <span className="pill green">{strengths.length} × {T.legendGreen}</span>}
                </div>
              )}
            </div>
            <div className="gauge rise d3" aria-label={`${U.score} ${avg} ${U.scoreOf}`}>
              <svg viewBox="0 0 220 220">
                <circle cx="110" cy="110" r={R0} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" />
                <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6FA3FF" /><stop offset="1" stopColor="#2563FF" /></linearGradient></defs>
                <circle className="arc" cx="110" cy="110" r={R0} fill="none" stroke="url(#g)" strokeWidth="14" strokeLinecap="round" style={{ ['--len' as string]: `${arc}` } as React.CSSProperties} />
              </svg>
              <div className="c"><b>{avg}</b><span>{U.score}</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="rbody">
        <div className="in" style={{ paddingBottom: 104 }}>
          {/* Alle neun Stufen */}
          <section className="sec">
            <div className="shead">
              <div><span className="eb">{R.overview}</span><h2>{U.stagesTitle}</h2></div>
              <p>{R.overviewSub}</p>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '7fr 4fr', alignItems: 'stretch' }}>
              <div className="card line" style={{ padding: '26px 28px' }}>
                <div className="rows">
                  {r.stages.map((x, i) => (
                    <div className={`row ${x.status}`} key={x.key} style={{ ['--i' as string]: i } as React.CSSProperties}>
                      <span className="ix">{i + 1}</span>
                      <span className="nm">{stage(x.key).name[lang]}</span>
                      <div className="track" aria-label={`${R.score} ${x.score}, ${R.target} ${x.green}`}>
                        <div className={`fill ${x.status}`} style={{ width: `${Math.max(3, x.score)}%` }} />
                        <div className="tick" style={{ left: `${x.green}%` }} data-l={i === 0 ? U.target : ''} />
                      </div>
                      <span className="v">{x.score}</span>
                      <span className={`st ${x.status}`}>{x.status === 'red' ? T.legendRed : x.status === 'yellow' ? T.legendYellow : T.legendGreen}</span>
                    </div>
                  ))}
                </div>
                <p className="small" style={{ marginTop: 18 }}>{R.method}</p>
              </div>
              <div className="navycard">
                <span className="eb" style={{ marginBottom: 18 }}>{T.journey}</span>
                <Journey dark anim stages={r.stages.map((x) => ({ key: x.key, name: stage(x.key).name[lang], state: x.status }))} first={r.first} firstTag={r.firstKind === 'red' ? 'Nr. 1' : undefined} />
              </div>
            </div>
          </section>

          {/* Reihenfolge */}
          {order.length > 0 && (
            <section className="sec">
              <div className="shead">
                <div><span className="eb">{R.order}</span><h2>{r.constraints.length ? R.orderSub : R.noRed}</h2></div>
              </div>
              <div className="order">
                {order.map((k, i) => {
                  const st = stage(k), red = r.stages.find((x) => x.key === k)?.status === 'red'
                  return (
                    <div className={`ocard${red ? '' : ' y'}`} key={k} style={{ ['--i' as string]: i } as React.CSSProperties}>
                      <span className="n">{i + 1}</span>
                      <span className="when">{labels[i]}</span>
                      <h3>{st.name[lang]}</h3>
                      <p>{st.diagnosis[lang]}</p>
                      <div className="fx"><b>{R.fix}</b>{st.fixFirst[lang]}</div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Stärken */}
          <section className="sec">
            <div className="shead"><div><span className="eb">{R.strengths}</span></div></div>
            {strengths.length ? (
              <div className="strong">{strengths.map((x) => <div key={x.key}><p><b>{stage(x.key).name[lang]}</b><span>{stage(x.key).strength[lang]}</span></p></div>)}</div>
            ) : <p>{R.strengthsNone}</p>}
          </section>

          {/* Empfehlung */}
          {main && (
            <section className="sec">
              <div className="rec">
                <img className="ph" src="/markus-photo.jpg" alt="Markus Eilers" />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <span className="eb">{R.rec}</span>
                  <h2>{main.title[lang]}</h2>
                  <p>{main.text[lang]}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 24 }}>
                    <a className="btn white" href={href(main)}>{main.button[lang]}</a>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>{U.recBy}</span>
                  </div>
                </div>
              </div>
              <div className="alt">
                {r.secondary.map((k) => def.ctas[k]).filter(Boolean).map((c) => (
                  <div className="card line" key={c.title.de}>
                    <span className="eb">{R.other}</span>
                    <h3 style={{ marginTop: 8 }}>{c.title[lang]}</h3>
                    <p style={{ marginTop: 8, fontSize: 15 }}>{c.text[lang]}</p>
                    <a className="btn ghost" style={{ marginTop: 18 }} href={href(c)}>{c.button[lang]}</a>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="sec no-print">
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div><span className="eb">{R.frameworks}</span><p style={{ marginTop: 6 }}>{R.frameworksText}</p></div>
              <a className="btn ghost" href={`${localePrefix(lang)}/frameworks`}>{R.frameworksBtn}</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
