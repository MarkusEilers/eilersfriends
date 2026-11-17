import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFunnel } from '@/lib/ask/registry'
import { readReportToken } from '@/lib/ask/tokens'
import { getSubmission, countView } from '@/lib/ask/store'
import { UI, localePrefix } from '@/lib/ask/ui'
import { ASK_CSS } from '@/components/ask/ask-css'
import { Journey } from '@/components/ask/Journey'
import { PrintButton } from '@/components/ask/PrintButton'
import type { AskCta, Lang } from '@/lib/ask/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

type P = { params: Promise<{ locale: string; slug: string; token: string }> }

/** Persönlicher Report — nur über den signierten Link, erst nach Double-Opt-In. Druckfassung über das Print-Stylesheet. */
export default async function ReportPage({ params }: P) {
  const { slug, token } = await params
  const f = getFunnel(slug)
  const id = readReportToken(decodeURIComponent(token))
  if (!f || !id) notFound()
  const s = await getSubmission(id)
  if (!s || s.funnel !== slug) notFound()
  const lang: Lang = s.lang
  const T = UI[lang], R = T.report, def = f.def
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

  return (
    <div className="ask" style={{ background: '#FAFAF8' }}>
      {css}
      <div className="wrap">
        <div className="rhead">
          <div>
            <span className="eb">{def.kicker[lang]} · {R.eyebrow}</span>
            <h1>{s.company ? R.forTitle(s.company) : def.title[lang]}</h1>
            <p className="small" style={{ marginTop: 10 }}>{R.date} {date}</p>
          </div>
          <PrintButton label={R.print} />
        </div>

        <div className="sec grid">
          <div className="card line">
            <span className="eb">{R.overview}</span>
            <p style={{ marginTop: 8 }}>{R.overviewSub}</p>
            <div className="rows">
              {r.stages.map((x) => (
                <div className="row" key={x.key}>
                  <span className="nm">{stage(x.key).name[lang]}</span>
                  <div className="track" aria-label={`${R.score} ${x.score}, ${R.target} ${x.green}`}>
                    <div className={`fill ${x.status}`} style={{ width: `${Math.max(3, x.score)}%` }} />
                    <div className="tick" style={{ left: `${x.green}%` }} />
                  </div>
                  <span className="v">{x.score}</span>
                </div>
              ))}
            </div>
            <p className="small" style={{ marginTop: 18 }}>{R.method}</p>
          </div>
          <div className="card">
            <span className="eb" style={{ marginBottom: 14 }}>{T.journey}</span>
            <Journey stages={r.stages.map((x) => ({ key: x.key, name: stage(x.key).name[lang], state: x.status }))} first={r.first} />
          </div>
        </div>

        <div className="sec">
          <span className="eb">{R.order}</span>
          <h2>{r.constraints.length ? R.orderSub : R.noRed}</h2>
          <div className="steps">
            {order.map((k, i) => {
              const st = stage(k), red = r.stages.find((x) => x.key === k)?.status === 'red'
              return (
                <div className={`step${red ? '' : ' y'}`} key={k}>
                  <span className="no">{labels[i]} · {st.name[lang]}</span>
                  <p style={{ color: 'var(--ink)' }}>{st.diagnosis[lang]}</p>
                  <div className="fx"><b>{R.fix}</b>{st.fixFirst[lang]}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="sec">
          <span className="eb">{R.strengths}</span>
          {strengths.length ? (
            <div className="chips">{strengths.map((x) => <span key={x.key} title={stage(x.key).strength[lang]}>{stage(x.key).name[lang]}</span>)}</div>
          ) : <p style={{ marginTop: 10 }}>{R.strengthsNone}</p>}
        </div>

        {main && (
          <div className="sec">
            <div className="card blue">
              <span className="eb">{R.rec}</span>
              <h2 style={{ color: '#fff' }}>{main.title[lang]}</h2>
              <p style={{ marginTop: 12, maxWidth: 640 }}>{main.text[lang]}</p>
              <a className="btn white" style={{ marginTop: 22 }} href={href(main)}>{main.button[lang]}</a>
            </div>
            <div className="alt">
              {r.secondary.map((k) => def.ctas[k]).filter(Boolean).map((c) => (
                <div className="card line" key={c.title.de}>
                  <span className="eb">{R.other}</span>
                  <h3 style={{ marginTop: 8 }}>{c.title[lang]}</h3>
                  <p style={{ marginTop: 8, fontSize: 15 }}>{c.text[lang]}</p>
                  <a className="btn ghost" style={{ marginTop: 16 }} href={href(c)}>{c.button[lang]}</a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sec card no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div><span className="eb">{R.frameworks}</span><p style={{ marginTop: 6 }}>{R.frameworksText}</p></div>
          <a className="btn ghost" href={`${localePrefix(lang)}/frameworks`}>{R.frameworksBtn}</a>
        </div>
      </div>
    </div>
  )
}
