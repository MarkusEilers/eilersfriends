// app/[locale]/checkout/page.tsx — Übersicht aktueller Angebote (Standard-Chrome)
import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Link } from '@/lib/i18n/navigation'
import { GraduationCap, Sparkles, Search, ArrowRight } from 'lucide-react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Aktuell verfügbare Angebote — Eilers+Friends',
  description: 'Alle laufenden Programme und Workshops von Eilers+Friends auf einen Blick.',
}

type Offer = {
  tag: string
  title: string
  desc: string
  price: string
  href: string
  icon: 'academy' | 'workshop' | 'mystery'
}

const OFFERS: Offer[] = [
  {
    tag: 'Academy · 12 Monate',
    title: 'SalesMade Academy · Premium',
    desc: 'Ein 12-monatiges Ausbildungsprogramm, das Dein Sales-Team auf das Niveau von Ausnahme-Verkäufern bringt — mit monatlichem 1:1, Frameworks und 90-Tage-Garantie.',
    price: 'ab 549 € / Monat pro Platz',
    href: '/checkout/salesmade-academy-premium',
    icon: 'academy',
  },
  {
    tag: 'Workshop · Nur für Alumni',
    title: 'SalesMade AI Intensive',
    desc: 'Zwei Tage live: Wirksam Überzeugen auf den Punkt plus der komplette AI-Sales-Stack. Stuttgart oder Berlin, maximal 20 Teilnehmer pro Termin.',
    price: '897 € · Vorkasse',
    href: '/checkout/salesmade-ai-intensive',
    icon: 'workshop',
  },
  {
    tag: 'Service · Kennenlernangebot',
    title: 'Mystery Shopping',
    desc: 'Markus spricht als Kunde mit Deinem Sales-Team und wertet jedes Gespräch aus — 13 Skills, 5 Dimensionen. Du bekommst einen 14-Seiten-Report, das Team individuelles Feedback und das wichtigste Werkzeug gratis.',
    price: '1 € · Testphase',
    href: '/checkout/mystery-shopping',
    icon: 'mystery',
  },
]

export default async function CheckoutIndex() {

  return (
    <>
      <Topbar />
      <Navbar />
      <main style={{ backgroundColor: '#FAFAF8' }}>
        <section className="px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>Angebote</p>
              <h1 className="mt-3 text-4xl font-bold sm:text-5xl" style={{ color: '#0D0D0B' }}>Aktuell verfügbare Angebote.</h1>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                Alle laufenden Programme und Workshops von Eilers+Friends auf einen Blick. Wähle ein Angebot,
                um Details zu sehen und Deinen Platz zu sichern.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {OFFERS.map((o) => {
                const Icon = o.icon === 'academy' ? GraduationCap : o.icon === 'mystery' ? Search : Sparkles
                return (
                  <Link
                    key={o.href}
                    href={o.href as '/'}
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF' }}>
                        <Icon size={20} style={{ color: '#1A5FD4' }} />
                      </span>
                      <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}>
                        {o.tag}
                      </span>
                    </div>
                    <h2 className="mt-5 text-xl font-bold" style={{ color: '#0D0D0B' }}>{o.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{o.desc}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-sm font-semibold" style={{ color: '#0D0D0B' }}>{o.price}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold transition-colors" style={{ color: '#1A5FD4' }}>
                        Zum Angebot <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
