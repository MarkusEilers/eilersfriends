import type { Metadata } from 'next'
import { Link } from '@/lib/i18n/navigation'
import { Check, MapPin, ArrowRight, Lock, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'SalesMade AI Intensive — Nur für Alumni | Eilers+Friends',
  description: 'Zwei Tage mit Markus: Gesprächsführung auf den Punkt plus der komplette AI-Sales-Stack. Stuttgart & Berlin, max. 20 Teilnehmer pro Termin.',
}

const ACCENT = '#1A5FD4'
const NAVY = '#0F1E3A'
const CHECKOUT = '/checkout/salesmade-ai-intensive'

const DATES = [
  { city: 'Stuttgart', when: 'Fr 10. – Sa 11. Juli' },
  { city: 'Berlin', when: 'Fr 24. – Sa 25. Juli' },
]

export default function AiIntensivePage() {
  return (
    <div style={{ backgroundColor: '#FAFAF8' }}>
      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'rgba(26,95,212,0.25)', color: '#93B8F5' }}>
            <Lock size={12} /> Nur für Alumni · max. 20 Teilnehmer · Stuttgart &amp; Berlin
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Wirksam Überzeugen auf den Punkt — plus mein kompletter <span style={{ color: '#93B8F5' }}>AI-Sales-Stack.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Ein VIP-Wochenende für maximal 20 Alumni pro Termin. Zwei Tage mit Markus in Stuttgart oder Berlin:
            Gesprächsführung frisch geschärft und der komplette Werkzeugkasten, mit dem ich heute AI im Verkauf
            einsetze — Frameworks, Prompts, alles zum Mitnehmen.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3">
            <Link href={CHECKOUT as '/'}
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT }}>
              Platz sichern <ArrowRight size={16} />
            </Link>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>897 € für Alumni · Vorkasse · max. 20 pro Termin.</span>
          </div>
        </div>
      </section>

      {/* WAS DU MITNIMMST */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Zwei Tage, Fr + Sa</p>
          <h2 className="mt-3 text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>Was Du mitnimmst.</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Block 1</span>
              <h3 className="mt-2 text-xl font-bold" style={{ color: '#0D0D0B' }}>Gesprächsführung, geschärft.</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Die Grundlagen, die verkaufen — neu justiert. Kein Theorie-Refresh, sondern an Deinen Fällen.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                <Sparkles size={12} /> Block 2
              </span>
              <h3 className="mt-2 text-xl font-bold" style={{ color: '#0D0D0B' }}>Mein AI-Sales-Stack.</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Wie ich AI über den ganzen Prozess einsetze — von der Vorbereitung bis zum Abschluss.
                Alle neuen Frameworks und Prompts, sofort einsetzbar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TERMINE */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>Zwei Städte. Zwei Termine.</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {DATES.map((d) => (
              <div key={d.city} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#EBF1FF' }}>
                  <MapPin size={20} style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: '#0D0D0B' }}>{d.city}</p>
                  <p className="text-sm text-gray-500">{d.when}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-sm text-gray-500">Je max. 20 Teilnehmer. Du wählst Deine Stadt beim Buchen.</p>
        </div>
      </section>

      {/* ANGEBOT */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-2xl rounded-2xl border p-8 text-center sm:p-10"
          style={{ borderColor: 'rgba(26,95,212,0.2)', backgroundColor: '#EBF1FF' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Das Angebot</p>
          <div className="mt-3 flex items-baseline justify-center gap-3">
            <span className="text-4xl font-bold" style={{ color: '#0D0D0B' }}>897 €</span>
            <span className="text-lg text-gray-400 line-through">1.897 €</span>
          </div>
          <p className="mt-1 text-sm font-semibold" style={{ color: ACCENT }}>Alumni-Preis</p>
          <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
            {['Zwei Tage live mit Markus', 'Gesprächsführung + kompletter AI-Sales-Stack', 'Alle Frameworks und Prompts zum Mitnehmen', 'Vorkasse bei Buchung'].map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: ACCENT }}>
                  <Check size={12} />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <Link href={CHECKOUT as '/'}
            className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}>
            Platz sichern <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* KNAPPHEIT */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: '#0D0D0B' }}>Maximal 20 Teilnehmer pro Termin.</h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            Mehr nehmen wir nicht — das Format lebt vom kleinen Kreis. Ist Dein Termin voll, rückt der nächste nach.
          </p>
          <Link href={CHECKOUT as '/'}
            className="mt-7 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: NAVY }}>
            Jetzt Platz sichern <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
