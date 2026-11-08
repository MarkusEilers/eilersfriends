/* eslint-disable @next/next/no-img-element */
import { STORY_CSS } from './story-css'
import { OptinForm } from './OptinForm'
import { CheckoutBox } from './CheckoutBox'
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import { getVisibleTrustLogos } from '@/lib/db/queries/trust-logos'
import { LogoScrollbar } from '@/components/blocks/LogoScrollbar'
import { getAvailability, nextQuarterLabel } from '@/lib/mystery-shopping/slots'
import { ACADEMY_CSS } from './academy-assets'
import { AcademyInit } from './AcademyInit'
import { HOME_CSS } from './home-assets'
import { HomeInit } from './HomeInit'
import { getLocale } from 'next-intl/server'
import { ST, storyLang, quarterLabel, type StoryLang } from '@/lib/lp/story-i18n'

/**
 * „Story“-Bausteine für Landing- und Checkout-Seiten im Stories-Designsystem
 * (12er-Raster, Bento-Karten, DM Sans). Jede Sektion im Landingpage-System mit
 * type „story_*“ wird hier gerendert; Inhalte sind JSON im Backend.
 */

type C = Record<string, any>

export interface StoryCtx {
  slots: { capacity: number; free: number; nextOpens: string } | null
  lang?: StoryLang
  prefill?: { email?: string; firstName?: string; lead?: string }
}

export async function loadStoryCtx(prefill?: StoryCtx['prefill']): Promise<StoryCtx> {
  const lang = storyLang(await getLocale().catch(() => 'de'))
  try {
    const a = await getAvailability()
    return { slots: { capacity: a.capacity, free: a.free, nextOpens: quarterLabel(nextQuarterLabel(a.quarter), lang) }, prefill, lang }
  } catch {
    return { slots: null, prefill, lang }
  }
}

/** CSS einmal pro Seite (React 19 dedupliziert über href). */
export function StoryStyles() {
  return <style href="story-css" precedence="default">{STORY_CSS}</style>
}

export function Slots({ ctx, dark = false, quarterHint = true, style }: { ctx: StoryCtx; dark?: boolean; quarterHint?: boolean; style?: React.CSSProperties }) {
  if (!ctx.slots) return null
  const { capacity, free, nextOpens } = ctx.slots
  const sold = capacity - free
  const T = ST[ctx.lang ?? 'de']
  return (
    <div className={`slots${dark ? ' on-dark' : ''}`} style={style}>
      <div className="lbl">
        {free === 0
          ? <><b>{T.soldOut}</b> · {T.nextFrom} {nextOpens}</>
          : <><b>{T.onlyLeft(free, capacity)}</b>{quarterHint ? T.thisQuarter : ''}</>}
      </div>
      <div className="dots">
        {Array.from({ length: capacity }, (_, i) => <i key={i} className={i < sold ? '' : i === sold ? 'free next' : 'free'} />)}
      </div>
    </div>
  )
}

export function PriceTag({ c, ctx }: { c: C; ctx: StoryCtx }) {
  if (!c.priceNew) return null
  const free = ctx.slots?.free
  const note = String(c.priceNote ?? ST[ctx.lang ?? 'de'].priceNote).replace('{n}', String(free ?? ''))
  if (free === 0) return null
  return (
    <div className="ptag">
      {c.priceOld && <span className="old">{c.priceOld}</span>}
      <span className="new"><small>{note.split('|').map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</small>{c.priceNew}</span>
    </div>
  )
}

/* ── Kopf ─────────────────────────────────────────────────────────── */
export function StoryTopnav({ c }: { c: C }) {
  return (
    <>
      {c.topbar && <div className="top" dangerouslySetInnerHTML={{ __html: String(c.topbar) }} />}
      <div className="nav"><div className="wrap">
        <a href="/" className="logo"><img src="/ef-logo.png" alt="Eilers+Friends" className="logo-img" /></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LocaleSwitcher />
          <a className="btn blue sm" href={c.ctaHref ?? '#optin'}>{c.cta ?? 'Jetzt buchen'}</a>
        </div>
      </div></div>
    </>
  )
}

/* ── Seite 1 ──────────────────────────────────────────────────────── */
export function StoryHeroOptin({ c, ctx }: { c: C; ctx: StoryCtx }) {
  return (
    <div className="wrap hero" id="optin">
      <div className="g12">
        <div className="c7">
          {c.eyebrow && <span className="eb">{c.eyebrow}</span>}
          <h1>{c.headline}</h1>
          {c.lead && <p className="lead">{c.lead}</p>}
          <div className="optbox">
            {c.formEyebrow && <span className="eb">{c.formEyebrow}</span>}
            {c.formTitle && <p className="opt-h">{c.formTitle}</p>}
            <OptinForm button={c.button ?? 'Jetzt buchen'} next={c.next ?? '/checkout/mystery-shopping'} source={c.source ?? 'mystery-shopping'} soldOut={ctx.slots?.free === 0} />
          </div>
          <Slots ctx={ctx} style={{ marginTop: 20 }} />
        </div>
        <div className="c5">
          <div className="visual" style={{ backgroundImage: `url(${c.image})` }}>
            <PriceTag c={c} ctx={ctx} />
            {c.speaker?.name && (
              <div className="speaker"><i className="av" style={{ backgroundImage: `url(${c.speaker.photo ?? '/markus-photo.jpg'})` }} /><div><b>{c.speaker.name}</b><span>{c.speaker.text}</span></div></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Logoleiste: dasselbe Modul wie auf der Startseite (Logos, Größen und Reihenfolge aus /admin/logos). */
export async function StoryLogoMarquee({ c }: { c: C }) {
  // Kategorie aus dem Inhalt (z. B. „academy“, „mystery“) — nur passende Logos; ohne Kategorie alle sichtbaren
  const all = await getVisibleTrustLogos(c.category ?? null).catch(() => [])
  const names: string[] | undefined = c.names
  const logos = all.filter((l) => !names || names.includes(l.name))
  if (!logos.length) return null
  return (
    <div className="wrap">
      <div className="logos"><span className="eb">{c.eyebrow ?? 'Unternehmen, die uns vertrauen'}</span></div>
      <div style={{ marginTop: 24 }}>
        <LogoScrollbar speed="normal"
          logos={logos.map((l) => ({ name: l.name, src: l.src ?? undefined, srcBw: l.srcBw ?? undefined, displayScale: l.displayScale }))} />
      </div>
    </div>
  )
}

export function StoryFindings({ c }: { c: C }) {
  const items: string[] = c.items ?? []
  return (
    <div className="wrap sec"><div className="g12">
      <div className="c4 card ink finds-intro">
        <div>
          {c.eyebrow && <span className="eb" style={{ color: 'var(--red)' }}>{c.eyebrow}</span>}
          <h2 style={{ color: '#fff' }}>{c.headline}</h2>
          {c.text && <p>{c.text}</p>}
        </div>
        {c.cta && <a className="btn white sm" href={c.ctaHref ?? '#optin'} style={{ alignSelf: 'flex-start' }}>{c.cta}</a>}
      </div>
      <div className="c8 finds">{items.map((t, i) => <div key={i} className="find"><b>{String(i + 1).padStart(2, '0')}</b><span>{t}</span></div>)}</div>
    </div></div>
  )
}

export function StoryTiles({ c }: { c: C }) {
  const items: { n: string; title: string; text: string }[] = c.items ?? []
  return (
    <div className="wrap sec">
      <div className="sec-head"><div>{c.eyebrow && <span className="eb">{c.eyebrow}</span>}<h2 style={{ marginTop: 12 }}>{c.headline}</h2></div>{c.text && <p>{c.text}</p>}</div>
      <div className="g12">{items.map((t, i) => (
        <div key={i} className="c4 card tint tile"><div className="n">{t.n}</div><h3>{t.title}</h3><p>{t.text}</p></div>
      ))}</div>
    </div>
  )
}

export function AuthorCard({ a }: { a: C }) {
  return (
    <div className="c5 card author">
      {a.eyebrow && <span className="eb">{a.eyebrow}</span>}
      <div className="who"><i className="av" style={{ backgroundImage: `url(${a.photo ?? '/markus-photo.jpg'})` }} /><div><b>{a.name}</b><span>{a.role}</span></div></div>
      <p>{a.bio}</p>
    </div>
  )
}

export function StoryQuoteAuthor({ c }: { c: C }) {
  const plain = c.variant === 'plain'
  return (
    <div className="wrap sec"><div className="g12">
      {plain ? (
        <div className="c7 pull"><q>{c.quote}</q>{c.quoteEyebrow && <cite>{c.quoteEyebrow}</cite>}</div>
      ) : (
        <div className="c7 card blue quote">
          <div>{c.quoteEyebrow && <span className="eb">{c.quoteEyebrow}</span>}<q>{c.quote}</q></div>
          {c.cta && <a className="btn white" href={c.ctaHref ?? '#optin'} style={{ alignSelf: 'flex-start' }}>{c.cta}</a>}
        </div>
      )}
      {c.author && <AuthorCard a={c.author} />}
    </div></div>
  )
}

export function StoryOptinClose({ c, ctx }: { c: C; ctx: StoryCtx }) {
  return (
    <div className="wrap sec" id="optin2">
      <div className="card navy" style={{ padding: 56 }}>
        <div className="g12 close">
          <div className="c6">
            {c.eyebrow && <span className="eb">{c.eyebrow}</span>}
            <h2 style={{ color: '#fff' }}>{c.headline}</h2>
            {c.text && <p className="lead">{c.text}</p>}
            <div style={{ marginTop: 24 }}><PriceTag c={c} ctx={ctx} /></div>
          </div>
          <div className="c6">
            <OptinForm button={c.button ?? 'Jetzt buchen'} next={c.next ?? '/checkout/mystery-shopping'} source={c.source ?? 'mystery-shopping'} soldOut={ctx.slots?.free === 0} bare />
            <Slots ctx={ctx} dark style={{ marginTop: 20 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Seite 2 (Checkout) ───────────────────────────────────────────── */
function videoEmbed(url: string) {
  const yt = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}

export function StoryCheckoutVsl({ c, ctx }: { c: C; ctx: StoryCtx }) {
  const chapters: string[] = c.chapters ?? []
  const facts: { k: string; v: string }[] = c.facts ?? []
  const embed = c.videoUrl ? videoEmbed(String(c.videoUrl)) : null
  return (
    <>
      <div className="wrap co-head">
        {c.eyebrow && <span className="eb">{c.eyebrow}</span>}
        <h1>{c.headline} {c.headlineAccent && <span>{c.headlineAccent}</span>}</h1>
      </div>
      <div className="wrap co" style={{ marginTop: 40 }} id="checkout">
        <div className="g12" style={{ alignItems: 'start' }}>
          <div className="c8">
            <div className="player" style={{ backgroundImage: embed ? undefined : `url(${c.poster})` }}>
              {embed ? <iframe src={embed} title={c.caption ?? 'Video'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                : c.videoUrl ? <video src={c.videoUrl} poster={c.poster} controls playsInline />
                  : <><div className="play" /><div className="cap">{c.captionSmall}<b>{c.caption}</b></div></>}
            </div>
            {chapters.length > 0 && <div className="chap">{chapters.map((t, i) => <div key={i} className={i < (c.chaptersDone ?? 0) ? 'on' : ''}>{t}</div>)}</div>}
            {facts.length > 0 && <dl className="facts" style={{ marginTop: 32 }}>{facts.map((f, i) => <div key={i}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}</dl>}
          </div>
          <div className="c4 card line checkout">
            <div className="prod"><div><h3>{c.product}</h3>{c.productSub && <p>{c.productSub}</p>}</div><div className="price"><b>{c.priceNew}</b>{c.priceOld && <s>{c.priceOld}</s>}</div></div>
            <Slots ctx={ctx} quarterHint={false} />
            <hr />
            <CheckoutBox slug={c.slug ?? 'mystery-shopping'} tierId={c.tierId ?? 'mystery-onetime'} button={c.button ?? 'Jetzt buchen'}
              note={c.note} prefill={ctx.prefill} soldOut={ctx.slots?.free === 0} nextOpens={ctx.slots?.nextOpens} />
          </div>
        </div>
      </div>
    </>
  )
}

export function StoryBentoOffer({ c, ctx }: { c: C; ctx: StoryCtx }) {
  const cards: C[] = c.cards ?? []
  return (
    <div className="wrap sec">
      <div className="sec-head"><div>{c.eyebrow && <span className="eb">{c.eyebrow}</span>}<h2 style={{ marginTop: 12 }}>{c.headline}</h2></div>{c.text && <p>{c.text}</p>}</div>
      <div className="g12">
        {cards.map((k, i) => (
          <div key={i} className={`${k.wide ? 'c8 card get wide' : 'c4 card get'}`}>
            {k.image && <div className="img" style={{ backgroundImage: `url(${k.image})` }} />}
            <div className="body">
              {k.num && <span className="num">{k.num}</span>}
              <h3>{k.title}</h3>
              {k.text && <p>{k.text}</p>}
              {Array.isArray(k.list) && <ul className="nine">{k.list.map((l: string, j: number) => <li key={j}>{l}</li>)}</ul>}
            </div>
          </div>
        ))}
        {c.forWhom && (
          <div className="c4 card tint forwhom">
            <div><span className="eb">{c.forWhom.eyebrow}</span><h3>{c.forWhom.title}</h3></div>
            {c.forWhom.text && <p className="sm">{c.forWhom.text}</p>}
          </div>
        )}
        {c.price && (
          <div className="c4 card blue price-card">
            <span className="eb">{c.price.eyebrow}</span>
            <div style={{ margin: '6px 0 4px' }}><PriceTag c={c.price} ctx={ctx} /></div>
            {c.price.text && <p className="sm" dangerouslySetInnerHTML={{ __html: String(c.price.text) }} />}
            <Slots ctx={ctx} dark quarterHint={false} />
            <a className="btn white full" href="#checkout">{c.price.button ?? 'Jetzt buchen'}</a>
          </div>
        )}
      </div>
    </div>
  )
}

export function StoryDarkBand({ c }: { c: C }) {
  return (
    <div className="wrap sec">
      <div className="card ink band" style={{ padding: 48 }}>
        <div>{c.eyebrow && <span className="eb">{c.eyebrow}</span>}<q>{c.text}</q></div>
        <a className="btn blue" href={c.href ?? '#checkout'}>{c.button}</a>
      </div>
    </div>
  )
}

export function StoryFaq({ c }: { c: C }) {
  const items: { q: string; a: string }[] = c.items ?? []
  return (
    <div className="wrap sec faq"><div className="g12">
      <div className="c4">{c.eyebrow && <span className="eb">{c.eyebrow}</span>}<h2 style={{ marginTop: 12 }}>{c.headline ?? 'Häufige Fragen'}</h2></div>
      <div className="c8">{items.map((it, i) => (
        <details key={i} open={i === 0}><summary>{it.q}</summary>
          {String(it.a).split(/\n\n+/).map((p, j) => <p key={j} dangerouslySetInnerHTML={{ __html: p }} />)}
        </details>
      ))}</div>
    </div></div>
  )
}

export function StoryMobileCta({ c, ctx }: { c: C; ctx: StoryCtx }) {
  const free = ctx.slots?.free
  return (
    <div className="mcta">
      <span dangerouslySetInnerHTML={{ __html: String(c.text ?? '').replace('{n}', String(free ?? '')) }} />
      <a className="btn blue sm" href={c.href ?? '#checkout'}>{c.button ?? 'Jetzt buchen'}</a>
    </div>
  )
}

/** Rendert einen „story_*“-Typ. */
/**
 * Freie HTML-Sektion (z. B. die Academy-Seite aus Claude Design). Inhalt: { label, theme, html }.
 * theme „academy“ lädt das Academy-CSS und startet Quiz/Animationen einmal pro Seite.
 */
export async function StoryHtml({ c }: { c: C }) {
  let html = String(c.html ?? '')
  // Live-Werte im HTML: {{ms.free}} / {{ms.capacity}} (Mystery-Shopping-Plätze)
  if (html.includes('{{ms.')) {
    const a = await getAvailability().catch(() => null)
    html = html.replace(/\{\{ms\.free\}\}/g, String(a?.free ?? '')).replace(/\{\{ms\.capacity\}\}/g, String(a?.capacity ?? ''))
  }
  // Logo-Kacheln: Wortmarke durch das Logo aus der Logoleiste ersetzen, sobald es dort hinterlegt ist
  if (html.includes('class="tlogo"')) {
    const logos = await getVisibleTrustLogos().catch(() => [])
    const norm = (x: string) => x.toLowerCase().replace(/^deutsche\s+/, '').replace(/[^a-z0-9]/g, '')
    html = html.replace(/<div class="tlogo"><span>([^<]+)<\/span><\/div>/g, (m, name: string) => {
      const l = logos.find((x) => x.src && norm(x.name) === norm(name))
      if (!l) return m
      const src = l.srcBw || l.src
      return `<div class="tlogo"><img src="${src}" alt="${name}" style="max-height:30px;max-width:70%;object-fit:contain;filter:grayscale(1);opacity:.75;transform:scale(${(l.displayScale ?? 100) / 100})"></div>`
    })
  }
  if (c.theme === 'academy') {
    return (
      <div className="acd">
        <style href="academy-css" precedence="default">{ACADEMY_CSS}</style>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <AcademyInit />
      </div>
    )
  }
  if (c.theme === 'home') {
    return (
      <div className="hm">
        <style href="home-css" precedence="default">{HOME_CSS}</style>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <HomeInit />
      </div>
    )
  }
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

/**
 * „Das System“: dunkles Band mit Intro, zwei Schritten, Kennzahlen, Lernformaten und Begleitmaßnahmen.
 * Ursprünglich die Sektion „Die SalesMade Academy ist kein Seminar.“ der alten Academy-Seite.
 * Inhalt: { eyebrow, headline, subtext, steps:[{label,title,text}], stats:[{value,label}],
 *           formats:{eyebrow,headline,items:[{title,body}]}, measures:{label,items:[]} }  — text darf <strong> enthalten.
 */
export function StoryProgramSystem({ c }: { c: C }) {
  const steps = (c.steps ?? []) as { label?: string; title?: string; text?: string }[]
  const stats = (c.stats ?? []) as { value: string; label: string }[]
  const fm = (c.formats ?? {}) as { eyebrow?: string; headline?: string; items?: { title: string; body: string }[] }
  const ms = (c.measures ?? {}) as { label?: string; items?: string[] }
  const card: React.CSSProperties = { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(147,184,245,.25)', borderRadius: 20, padding: 28 }
  const pill: React.CSSProperties = { display: 'inline-block', borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', background: 'rgba(26,95,212,.4)', color: '#93B8F5' }
  return (
    <section style={{ background: '#0F1E3A', color: '#fff', padding: '96px 0' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          {c.eyebrow && <span className="eb" style={{ color: '#93B8F5' }}>{c.eyebrow}</span>}
          {c.headline && <h2 style={{ marginTop: 12, color: '#fff' }}>{c.headline}</h2>}
          {c.subtext && <p className="lead" style={{ marginTop: 14, color: 'rgba(255,255,255,.72)' }}>{c.subtext}</p>}
        </div>
        {steps.length > 0 && (
          <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            {steps.map((st, i) => (
              <div key={i} style={card}>
                {st.label && <span style={pill}>{st.label}</span>}
                {st.title && <h3 style={{ marginTop: 14, color: '#fff' }}>{st.title}</h3>}
                {st.text && <p className="sm" style={{ marginTop: 10, color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: st.text }} />}
              </div>
            ))}
          </div>
        )}
        {stats.length > 0 && (
          <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 24, textAlign: 'center' }}>
            {stats.map((x, i) => (
              <div key={i}><div style={{ fontSize: 40, fontWeight: 700, color: '#1A5FD4', letterSpacing: '-.02em' }}>{x.value}</div>
                <div style={{ marginTop: 4, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>{x.label}</div></div>
            ))}
          </div>
        )}
        {(fm.items?.length ?? 0) > 0 && (
          <div style={{ ...card, marginTop: 56, padding: 32 }}>
            <div style={{ textAlign: 'center' }}>
              {fm.eyebrow && <span style={pill}>{fm.eyebrow}</span>}
              {fm.headline && <h3 style={{ marginTop: 12, color: '#fff' }}>{fm.headline}</h3>}
            </div>
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18 }}>
              {fm.items!.map((f, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(147,184,245,.18)', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{f.title}</div>
                  <p className="sm" style={{ marginTop: 8, color: 'rgba(255,255,255,.7)', lineHeight: 1.55 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {(ms.items?.length ?? 0) > 0 && (
          <div style={{ ...card, marginTop: 24, padding: 32 }}>
            {ms.label && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#93B8F5' }}>{ms.label}</div>}
            <ul style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, listStyle: 'none' }}>
              {ms.items!.map((m, i) => <li key={i} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'rgba(255,255,255,.85)' }}><span style={{ color: '#1A5FD4', fontWeight: 700 }}>✓</span>{m}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

export function StoryBlock({ type, c, ctx }: { type: string; c: C; ctx: StoryCtx }) {
  switch (type) {
    case 'story_topnav': return <StoryTopnav c={c} />
    case 'story_hero_optin': return <StoryHeroOptin c={c} ctx={ctx} />
    case 'story_logos': return <StoryLogoMarquee c={c} />
    case 'story_findings': return <StoryFindings c={c} />
    case 'story_tiles': return <StoryTiles c={c} />
    case 'story_quote_author': return <StoryQuoteAuthor c={c} />
    case 'story_optin_close': return <StoryOptinClose c={c} ctx={ctx} />
    case 'story_checkout_vsl': return <StoryCheckoutVsl c={c} ctx={ctx} />
    case 'story_bento_offer': return <StoryBentoOffer c={c} ctx={ctx} />
    case 'story_dark_band': return <StoryDarkBand c={c} />
    case 'story_faq': return <StoryFaq c={c} />
    case 'story_mobile_cta': return <StoryMobileCta c={c} ctx={ctx} />
    case 'story_html': return <StoryHtml c={c} />
    case 'story_system': return <StoryProgramSystem c={c} />
    default: return null
  }
}

/** Eine ganze Seite aus „story_*“-Sektionen. */
export function StoryPage({ sections, ctx }: { sections: { id: string; type: string; content: C }[]; ctx: StoryCtx }) {
  return (
    <div className="sb">
      <StoryStyles />
      {sections.map((s) => <StoryBlock key={s.id} type={s.type} c={s.content} ctx={ctx} />)}
    </div>
  )
}

/** Für das allgemeine LpRender (/lp/…): lädt den Kontext selbst. */
export async function StoryBlockAuto({ type, c }: { type: string; c: C }) {
  if (type === 'story_html') return <StoryHtml c={c} />
  const ctx = await loadStoryCtx()
  return <div className="sb" style={{ paddingBottom: 0 }}><StoryStyles /><StoryBlock type={type} c={c} ctx={ctx} /></div>
}
