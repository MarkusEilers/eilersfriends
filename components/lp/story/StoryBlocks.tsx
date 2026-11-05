/* eslint-disable @next/next/no-img-element */
import { STORY_CSS } from './story-css'
import { OptinForm } from './OptinForm'
import { CheckoutBox } from './CheckoutBox'
import { getVisibleTrustLogos } from '@/lib/db/queries/trust-logos'
import { LogoScrollbar } from '@/components/blocks/LogoScrollbar'
import { getAvailability, nextQuarterLabel } from '@/lib/mystery-shopping/slots'

/**
 * „Story“-Bausteine für Landing- und Checkout-Seiten im Stories-Designsystem
 * (12er-Raster, Bento-Karten, DM Sans). Jede Sektion im Landingpage-System mit
 * type „story_*“ wird hier gerendert; Inhalte sind JSON im Backend.
 */

type C = Record<string, any>

export interface StoryCtx {
  slots: { capacity: number; free: number; nextOpens: string } | null
  prefill?: { email?: string; firstName?: string; lead?: string }
}

export async function loadStoryCtx(prefill?: StoryCtx['prefill']): Promise<StoryCtx> {
  try {
    const a = await getAvailability()
    return { slots: { capacity: a.capacity, free: a.free, nextOpens: nextQuarterLabel(a.quarter) }, prefill }
  } catch {
    return { slots: null, prefill }
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
  return (
    <div className={`slots${dark ? ' on-dark' : ''}`} style={style}>
      <div className="lbl">
        {free === 0
          ? <><b>Ausgebucht</b> · nächster Durchgang ab {nextOpens}</>
          : <><b>Nur noch <em>{free}</em> von {capacity} Sessions frei</b>{quarterHint ? ' · in diesem Quartal' : ''}</>}
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
  const note = String(c.priceNote ?? 'nur für die nächsten {n}').replace('{n}', String(free ?? ''))
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
        <a className="btn blue sm" href={c.ctaHref ?? '#optin'}>{c.cta ?? 'Jetzt buchen'}</a>
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
  const all = await getVisibleTrustLogos().catch(() => [])
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
  const ctx = await loadStoryCtx()
  return <div className="sb" style={{ paddingBottom: 0 }}><StoryStyles /><StoryBlock type={type} c={c} ctx={ctx} /></div>
}
