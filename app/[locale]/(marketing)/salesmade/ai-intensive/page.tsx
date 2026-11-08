import type { Metadata } from 'next'
import { Link } from '@/lib/i18n/navigation'
import { Check, MapPin, ArrowRight, Lock, Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { HOME_CSS } from '@/components/lp/story/home-assets'
import { HeroBackdrop } from '@/components/lp/story/HeroBackdrop'

const CHECKOUT = '/checkout/salesmade-ai-intensive'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('aiIntensive')
  return { title: t('meta.title'), description: t('meta.description') }
}

export default async function AiIntensivePage() {
  const t = await getTranslations('aiIntensive')
  const DATES = t.raw('dates') as { city: string; when: string }[]
  const offerBullets = t.raw('offer.bullets') as string[]
  return (
    <main className="hm">
      <style href="home-css" precedence="default">{HOME_CSS}</style>

      {/* HERO */}
      <section className="efh" style={{ padding: 'clamp(56px,7vw,96px) clamp(20px,6vw,96px)' }}>
        <HeroBackdrop src="/heroes/ai.jpg" label="SalesMade AI Intensive" />
        <div className="wrap">
          <div className="efh-copy" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <span className="chip" style={{ alignSelf: 'flex-start', background: '#E8EFFB', color: '#124293', fontSize: 12, padding: '7px 12px', gap: 6 }}>
              <Lock size={12} /> {t('hero.badge')}
            </span>
            <h1 style={{ margin: 0, fontSize: 'clamp(40px,5vw,76px)', fontWeight: 600, letterSpacing: '-.045em', lineHeight: 0.98, textWrap: 'balance' } as React.CSSProperties}>
              {t.rich('hero.title', { span: (c) => <span style={{ color: '#1A5FD4' }}>{c}</span> })}
            </h1>
            <p className="lead" style={{ maxWidth: 580 }}>{t('hero.desc')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, paddingTop: 4 }}>
              <Link href={CHECKOUT as '/'} className="btnb">{t('hero.cta')} <ArrowRight size={16} style={{ marginLeft: 8 }} /></Link>
              <span style={{ fontSize: 13, color: '#605D5D' }}>{t('hero.priceHint')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* WAS DU MITNIMMST */}
      <section className="sec sand">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="mono">{t('blocks.badge')}</span>
            <h2 className="h2">{t('blocks.title')}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 'clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="mono" style={{ color: '#1A5FD4' }}>{t('blocks.block1.badge')}</span>
              <span style={{ fontSize: 'clamp(26px,2.4vw,34px)', fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.08 }}>{t('blocks.block1.title')}</span>
              <p className="body" style={{ margin: 0 }}>{t('blocks.block1.desc')}</p>
            </div>
            <div style={{ background: '#1A5FD4', color: '#fff', borderRadius: 20, padding: 'clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="mono" style={{ color: '#E8EFFB', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={12} /> {t('blocks.block2.badge')}</span>
              <span style={{ fontSize: 'clamp(26px,2.4vw,34px)', fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.08 }}>{t('blocks.block2.title')}</span>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: '#E8EFFB' }}>{t('blocks.block2.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* TERMINE + ANGEBOT */}
      <section className="sec">
        <div className="wrap" style={{ display: 'flex', gap: '40px 64px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 className="h2">{t('datesTitle')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              {DATES.map((d) => (
                <div key={d.city} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: '#E8EFFB', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><MapPin size={19} color="#1A5FD4" /></span>
                  <span><b style={{ display: 'block', fontSize: 19, fontWeight: 600 }}>{d.city}</b><span style={{ fontSize: 14, color: '#605D5D' }}>{d.when}</span></span>
                </div>
              ))}
            </div>
            <p className="body" style={{ margin: 0 }}>{t('datesHint')}</p>
          </div>
          <div className="card" style={{ flex: '1 1 380px', minWidth: 0, padding: 'clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', gap: 14, border: '1px solid #BBCFF5' }}>
            <span className="mono" style={{ color: '#1A5FD4' }}>{t('offer.badge')}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span className="num" style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-.04em', lineHeight: 1 }}>{t('offer.price')}</span>
              <span style={{ fontSize: 20, color: '#9A938B', textDecoration: 'line-through' }}>{t('offer.strike')}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1A5FD4' }}>{t('offer.priceHint')}</span>
            <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {offerBullets.map((b) => (
                <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 16, lineHeight: 1.5, color: '#3A3633' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: '#1A5FD4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', marginTop: 1 }}><Check size={13} /></span>{b}
                </li>
              ))}
            </ul>
            <Link href={CHECKOUT as '/'} className="btnb" style={{ marginTop: 10, alignSelf: 'flex-start' }}>{t('offer.cta')} <ArrowRight size={16} style={{ marginLeft: 8 }} /></Link>
          </div>
        </div>
      </section>

      {/* KNAPPHEIT */}
      <section className="has-neuro" style={{ background: 'linear-gradient(170deg,#141311 0%,#0D0D0B 60%,#0A0A09 100%)', padding: 'clamp(72px,9vw,128px) clamp(20px,6vw,96px)', color: '#fff' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center', textAlign: 'center', maxWidth: 820 }}>
          <h2 className="h2" style={{ color: '#fff' }}>{t('scarcity.title')}</h2>
          <p style={{ margin: 0, fontSize: 'clamp(18px,1.6vw,21px)', lineHeight: 1.5, color: '#D6D2CC' }}>{t('scarcity.desc')}</p>
          <Link href={CHECKOUT as '/'} className="btn" style={{ background: '#fff', color: '#0D0D0B' }}>{t('scarcity.cta')} →</Link>
        </div>
      </section>
    </main>
  )
}
