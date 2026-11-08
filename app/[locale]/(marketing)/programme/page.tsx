import type { Metadata } from 'next'
import { Link } from '@/lib/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { HOME_CSS } from '@/components/lp/story/home-assets'
import { HeroBackdrop } from '@/components/lp/story/HeroBackdrop'

type Card = { key: string; eyebrow: string; title: string; desc: string; chips?: string[]; cta: string; href: string; img?: string }

const TX = {
  de: {
    meta: { title: 'Programme · Eilers+Friends', description: 'SalesMade Academy, Liquid Leadership, AI Intensive, Team-Coaching und 1:1-Coaching — Programme für planbares Wachstum von B2B-Teams.' },
    eyebrow: 'Programme · Coaching · Training',
    h1a: 'Vom ersten Gespräch zum', h1b: 'Gewinner-Team.',
    lead: 'Ob Dein ganzes Sales-Team ein Jahr lang wachsen soll, Deine Führung den nächsten Schritt braucht oder Du jemanden suchst, der Dir klar sagt, wo es hakt: Hier findest Du das passende Format.',
    alt: 'Aljona und Markus Eilers mit einer Gruppe im Workshop',
    sectionLabel: 'Alle Programme',
    cards: [
      { key: 'academy', eyebrow: 'Markus · 12 Monate · Sales-Teams', title: 'SalesMade Academy', desc: 'Die 12-Monats-Ausbildung für B2B-Sales-Teams: 19 Skills, individuelles Assessment, Sparring in 5 Schwierigkeitsstufen, monatliches 1:1-Coaching und KI-Werkzeuge für den Alltag. Gemessen an Euren echten Deals.', chips: ['Nächster Start: 20. November', '30 Founding-Plätze', '90 Tage Geld-zurück-Garantie'], cta: 'Zur Academy', href: '/academy', img: '/heroes/academy.jpg' },
      { key: 'liquid', eyebrow: 'Aljona · Leadership', title: 'Liquid Leadership', desc: 'Aljonas Transformational-Leadership-Programm: mit Empathie und Selbstführung zum Leader, dem andere gerne folgen. Für Führungskräfte in Tech-Unternehmen, die ihr Team durch Wachstum und Wandel tragen.', chips: ['TEDx Speakerin', 'WSJ-Bestseller-Autorin'], cta: 'Zu Liquid Leadership', href: '/aljona', img: '/heroes/aljona.jpg' },
      { key: 'ai', eyebrow: 'Markus · 2 Tage · nur Alumni', title: 'SalesMade AI Intensive', desc: 'Zwei Tage live in Stuttgart oder Berlin: Gesprächsführung frisch geschärft plus der komplette AI-Sales-Stack — Frameworks und Prompts zum Mitnehmen. Maximal 20 Teilnehmer pro Termin.', cta: 'Zum AI Intensive', href: '/salesmade/ai-intensive', img: '/heroes/ai.jpg' },
      { key: 'team', eyebrow: 'Für ganze Teams', title: 'Team-Coaching', desc: 'Begleitete Sparring-Sessions für Dein gesamtes Team — an Euren echten Gesprächen und Deals, nicht an Lehrbuch-Fällen.', cta: 'Gespräch vereinbaren', href: '/kontakt' },
      { key: 'one', eyebrow: 'Markus oder Aljona', title: '1:1 Coaching', desc: 'Persönlich, regelmäßig, ergebnisorientiert. Für CEOs und Gründer, die wissen, dass sich etwas ändern muss — und es nicht mehr allein herausfinden wollen.', cta: '1:1 mit Markus', href: '/markus' },
    ] as Card[],
    bandEyebrow: 'Noch unsicher?',
    bandTitle: 'Findet zuerst heraus, wo Euer Team steht.',
    bandText: 'Beim Mystery Shopping rufen wir Euer Team als fiktiver Kunde an. Ihr bekommt einen 14-seitigen Report zu den wichtigsten Skills — und eine kostenlose Trainingssession zum wichtigsten Hebel.',
    bandCta1: 'Mystery Shopping für 1 €', bandCta2: 'Kostenloses Strategiegespräch',
  },
  en: {
    meta: { title: 'Programmes · Eilers+Friends', description: 'SalesMade Academy, Liquid Leadership, AI Intensive, team coaching and 1:1 coaching — programmes for predictable growth of B2B teams.' },
    eyebrow: 'Programmes · Coaching · Training',
    h1a: 'From the first conversation to a', h1b: 'winning team.',
    lead: 'Whether your whole sales team should grow over a year, your leadership needs its next step, or you want someone to tell you clearly where things are stuck: this is where you find the right format.',
    alt: 'Aljona and Markus Eilers with a group in a workshop',
    sectionLabel: 'All programmes',
    cards: [
      { key: 'academy', eyebrow: 'Markus · 12 months · sales teams', title: 'SalesMade Academy', desc: 'The 12-month programme for B2B sales teams: 19 skills, individual assessment, sparring at 5 difficulty levels, monthly 1:1 coaching and AI tools for everyday work. Measured against your real deals.', chips: ['Next start: 20 November', '30 founding seats', '90-day money-back guarantee'], cta: 'Explore the Academy', href: '/academy', img: '/heroes/academy.jpg' },
      { key: 'liquid', eyebrow: 'Aljona · leadership', title: 'Liquid Leadership', desc: "Aljona's transformational leadership programme: with empathy and self-leadership to become the leader others gladly follow. For leaders in tech companies carrying their team through growth and change.", chips: ['TEDx speaker', 'WSJ bestselling author'], cta: 'Explore Liquid Leadership', href: '/aljona', img: '/heroes/aljona.jpg' },
      { key: 'ai', eyebrow: 'Markus · 2 days · alumni only', title: 'SalesMade AI Intensive', desc: 'Two days live in Stuttgart or Berlin: conversation skills freshly sharpened plus the complete AI sales stack — frameworks and prompts to take home. Maximum 20 participants per date.', cta: 'Explore the AI Intensive', href: '/salesmade/ai-intensive', img: '/heroes/ai.jpg' },
      { key: 'team', eyebrow: 'For whole teams', title: 'Team coaching', desc: 'Guided sparring sessions for your entire team — on your real conversations and deals, not textbook cases.', cta: 'Arrange a call', href: '/kontakt' },
      { key: 'one', eyebrow: 'Markus or Aljona', title: '1:1 coaching', desc: 'Personal, recurring, outcome-driven. For CEOs and founders who know something needs to change — and no longer want to figure it out alone.', cta: '1:1 with Markus', href: '/markus' },
    ] as Card[],
    bandEyebrow: 'Not sure yet?',
    bandTitle: 'First find out where your team stands.',
    bandText: 'With Mystery Shopping we call your team as an imaginary customer. You get a 14-page report on the key skills — and a free training session on the biggest lever.',
    bandCta1: 'Mystery Shopping for €1', bandCta2: 'Free strategy call',
  },
  es: {
    meta: { title: 'Programas · Eilers+Friends', description: 'SalesMade Academy, Liquid Leadership, AI Intensive, coaching de equipos y coaching 1:1: programas para un crecimiento predecible de equipos B2B.' },
    eyebrow: 'Programas · Coaching · Formación',
    h1a: 'De la primera conversación a un', h1b: 'equipo ganador.',
    lead: 'Si quieres que todo tu equipo de ventas crezca durante un año, tu liderazgo necesita el siguiente paso o buscas a alguien que te diga con claridad dónde está el bloqueo: aquí encuentras el formato adecuado.',
    alt: 'Aljona y Markus Eilers con un grupo en un taller',
    sectionLabel: 'Todos los programas',
    cards: [
      { key: 'academy', eyebrow: 'Markus · 12 meses · equipos de ventas', title: 'SalesMade Academy', desc: 'La formación de 12 meses para equipos de ventas B2B: 19 habilidades, evaluación individual, sparring en 5 niveles de dificultad, coaching 1:1 mensual y herramientas de IA para el día a día. Medido con tus deals reales.', chips: ['Próximo inicio: 20 de noviembre', '30 plazas Founding', 'Garantía de devolución de 90 días'], cta: 'Ver la Academy', href: '/academy', img: '/heroes/academy.jpg' },
      { key: 'liquid', eyebrow: 'Aljona · liderazgo', title: 'Liquid Leadership', desc: 'El programa de liderazgo transformacional de Aljona: con empatía y autoliderazgo hacia el líder al que otros quieren seguir. Para líderes de empresas tecnológicas que llevan a su equipo a través del crecimiento y el cambio.', chips: ['Ponente TEDx', 'Autora bestseller del WSJ'], cta: 'Ver Liquid Leadership', href: '/aljona', img: '/heroes/aljona.jpg' },
      { key: 'ai', eyebrow: 'Markus · 2 días · solo alumni', title: 'SalesMade AI Intensive', desc: 'Dos días en directo en Stuttgart o Berlín: conversación de ventas afinada y el stack completo de IA para ventas, con frameworks y prompts para llevar. Máximo 20 participantes por fecha.', cta: 'Ver el AI Intensive', href: '/salesmade/ai-intensive', img: '/heroes/ai.jpg' },
      { key: 'team', eyebrow: 'Para equipos completos', title: 'Coaching de equipos', desc: 'Sesiones de sparring guiadas para todo tu equipo, con vuestras conversaciones y deals reales, no con casos de manual.', cta: 'Concertar una llamada', href: '/kontakt' },
      { key: 'one', eyebrow: 'Markus o Aljona', title: 'Coaching 1:1', desc: 'Personal, recurrente, orientado a resultados. Para CEOs y fundadores que saben que algo tiene que cambiar y ya no quieren averiguarlo solos.', cta: '1:1 con Markus', href: '/markus' },
    ] as Card[],
    bandEyebrow: '¿Aún no lo tienes claro?',
    bandTitle: 'Descubre primero dónde está tu equipo.',
    bandText: 'Con el Mystery Shopping llamamos a tu equipo como un cliente imaginario. Recibes un informe de 14 páginas sobre las habilidades clave y una sesión de formación gratuita sobre la palanca más importante.',
    bandCta1: 'Mystery Shopping por 1 €', bandCta2: 'Llamada estratégica gratuita',
  },
}
const tx = (l: string) => TX[l as keyof typeof TX] ?? TX.de

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return tx(locale).meta
}

function ImgCard({ c, big }: { c: Card; big?: boolean }) {
  return (
    <Link href={c.href as '/'} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textDecoration: 'none', color: '#0D0D0B', gridColumn: big ? 'span 1' : undefined }}>
      {c.img && <div style={{ aspectRatio: big ? '16/8' : '16/9', background: `#D8D1C7 url(${c.img}) 75% center/cover` }} />}
      <div style={{ padding: 'clamp(22px,2.4vw,32px)', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <span className="mono">{c.eyebrow}</span>
        <span style={{ fontSize: big ? 'clamp(28px,2.8vw,40px)' : 'clamp(24px,2.2vw,30px)', fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1.05 }}>{c.title}</span>
        <p className="body" style={{ margin: 0 }}>{c.desc}</p>
        {c.chips && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.chips.map((x, i) => <span key={x} className="chip" style={{ background: i === 0 ? '#E8EFFB' : '#F6F2EC', color: i === 0 ? '#124293' : '#3A3633', fontSize: 12, padding: '6px 10px' }}>{x}</span>)}
          </div>
        )}
        <span style={{ marginTop: 'auto', paddingTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: '#1A5FD4' }}>{c.cta} <ArrowRight size={15} /></span>
      </div>
    </Link>
  )
}

export default async function ProgrammePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = tx(locale)
  const [academy, liquid, ai, team, one] = t.cards
  return (
    <main className="hm">
      <style href="home-css" precedence="default">{HOME_CSS}</style>

      <section className="efh" style={{ padding: 'clamp(56px,7vw,96px) clamp(20px,6vw,96px)' }}>
        <HeroBackdrop src="/heroes/programme.jpg" label={t.alt} />
        <div className="wrap">
          <div className="efh-copy" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <span className="mono">{t.eyebrow}</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(44px,5.6vw,88px)', fontWeight: 600, letterSpacing: '-.05em', lineHeight: 0.96, textWrap: 'balance' } as React.CSSProperties}>
              {t.h1a} <span style={{ color: '#1A5FD4' }}>{t.h1b}</span>
            </h1>
            <p className="lead" style={{ maxWidth: 560 }}>{t.lead}</p>
          </div>
        </div>
      </section>

      <section className="sec sand" style={{ paddingTop: 'clamp(48px,6vw,80px)' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="mono" style={{ marginBottom: 8 }}>{t.sectionLabel}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 16 }}>
            <ImgCard c={academy} big />
            <ImgCard c={liquid} big />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            <ImgCard c={ai} />
            <ImgCard c={team} />
            <ImgCard c={one} />
          </div>
        </div>
      </section>

      <section className="has-neuro" style={{ background: 'linear-gradient(170deg,#141311 0%,#0D0D0B 60%,#0A0A09 100%)', padding: 'clamp(72px,9vw,128px) clamp(20px,6vw,96px)', color: '#fff' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 860 }}>
          <span className="mono" style={{ color: '#8FB0EC' }}>{t.bandEyebrow}</span>
          <h2 className="h2" style={{ color: '#fff' }}>{t.bandTitle}</h2>
          <p style={{ margin: 0, fontSize: 'clamp(18px,1.6vw,21px)', lineHeight: 1.5, color: '#D6D2CC' }}>{t.bandText}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 6 }}>
            <Link href="/mystery-shopping" className="btnb">{t.bandCta1} →</Link>
            <a href="/schedule/markus/strategie-60" className="btn" style={{ background: '#fff', color: '#0D0D0B' }}>{t.bandCta2} →</a>
          </div>
        </div>
      </section>
    </main>
  )
}
