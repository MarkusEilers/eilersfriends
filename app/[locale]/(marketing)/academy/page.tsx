import type { Metadata } from 'next'
import { ArrowRight, CheckCircle, Users, BookOpen, Zap, Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'SalesMade Academy — Systematisches Vertriebs-Training für Gründer',
  description: 'Das 12-Wochen Vertriebs-Trainingsprogramm für Gründer und Teams. Foundation + Execution. Nur 30 Plätze.',
}

const MODULES = [
  'Positionierung & Messaging',
  'Ideales Kundenprofil (ICP)',
  'Pipeline-Aufbau & Lead-Generierung',
  'Discovery & Bedarfsanalyse',
  'Solution Selling & Wertargumentation',
  'Einwandbehandlung',
  'Closing-Prozess & Verhandlung',
  'CRM & Sales-Ops Setup',
  'Team-Onboarding & Enablement',
  'Forecast & Pipeline-Management',
  'Skalierung & Playbook-Erstellung',
  'Retention & Upsell',
  'Revenue Architecture & Review',
]

const OUTCOMES = [
  'Dein vollständiges Vertriebssystem — von Positionierung bis Closing',
  'Eine reproduzierbare Closing-Rate von 50–70 %',
  'Ein dokumentiertes Sales Playbook für Dein Team',
  'CRM-Setup & Pipeline-Management',
  'Live-Coaching in echten Verkaufssituationen',
]

const STATS = [
  { value: '12', label: 'Wochen Programm' },
  { value: '30', label: 'Plätze (limitiert)' },
  { value: '13', label: 'Module' },
  { value: '867+', label: 'Alumni seit 2019' },
]

export default function AcademyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full opacity-10 blur-3xl" style={{ backgroundColor: '#1A5FD4' }} />

        <div className="relative mx-auto max-w-4xl text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'white', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Soft-Launch 2026 · Nur 30 Plätze
          </span>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl mb-6" style={{ color: '#0D0D0B' }}>
            SalesMade{' '}
            <span style={{ color: '#1A5FD4' }}>Academy</span>
          </h1>
          <p className="text-xl font-medium mb-4" style={{ color: '#1A5FD4' }}>
            Bridging the Sales Education Gap.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Das systematische 12-Wochen Vertriebs-Training für Gründer und Teams.
            Von der Positionierung bis zur reproduzierbaren Closing-Rate.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
            {STATS.map(({ value, label }) => (
              <div key={label} className="rounded-2xl bg-white py-6 px-4 border border-blue-100">
                <div className="text-3xl font-bold" style={{ color: '#1A5FD4' }}>{value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="https://calendly.com/eilersfriends"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1A5FD4' }}
            >
              Jetzt bewerben <ArrowRight size={15} />
            </a>
            <a
              href="/academy#curriculum"
              className="inline-flex items-center gap-2 rounded-full border px-8 py-4 text-sm font-semibold transition-colors hover:bg-white"
              style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}
            >
              Curriculum ansehen
            </a>
          </div>
        </div>
      </section>

      {/* ─── TWO STEPS ────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
            >
              Das Programm
            </span>
            <h2 className="text-3xl font-bold" style={{ color: '#0D0D0B' }}>
              Zwei Phasen. Ein Ergebnis.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div
              className="rounded-3xl p-8"
              style={{ backgroundColor: '#EBF1FF', border: '1.5px solid #BBCFF5' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#1A5FD4' }}>1</div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>SCHRITT 1 — Wochen 1–6</p>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#0D0D0B' }}>Foundation</h3>
              <p className="text-sm text-gray-600">
                Dein Vertriebssystem aufbauen: von der Positionierung über das ideale
                Kundenprofil, die Pipeline-Struktur bis zum dokumentierten Closing-Prozess.
              </p>
            </div>

            <div
              className="rounded-3xl p-8"
              style={{ backgroundColor: '#EDFAF3', border: '1.5px solid #A7E9C4' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#157A45' }}>2</div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#157A45' }}>SCHRITT 2 — Wochen 7–12</p>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#0D0D0B' }}>Execution</h3>
              <p className="text-sm text-gray-600">
                Live-Calls, echte Deals, echte Ergebnisse — begleitet von Markus und dem Team.
                Du verkaufst, wir coachen. Bis die Rate stimmt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── OUTCOMES ─────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-4xl grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
            >
              Was du mitnimmst
            </span>
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#0D0D0B' }}>
              Nach 12 Wochen hast Du:
            </h2>
            <ul className="space-y-4">
              {OUTCOMES.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle size={18} className="mt-0.5 shrink-0" style={{ color: '#1A5FD4' }} />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { icon: Users, label: 'Live-Coaching' },
                { icon: BookOpen, label: 'B2B-Fokus' },
                { icon: Award, label: 'Zertifikat' },
                { icon: Zap, label: 'Sofort anwendbar' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: '#BBCFF5', color: '#1A5FD4', backgroundColor: 'white' }}
                >
                  <Icon size={13} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial card */}
          <div
            className="relative overflow-hidden rounded-3xl p-8"
            style={{ backgroundColor: '#0F1E3A' }}
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20" style={{ backgroundColor: '#1A5FD4' }} />
            <p className="relative text-base font-medium leading-relaxed text-white/80 italic mb-6">
              &ldquo;Nach 12 Wochen SalesMade Academy hatte unser Team eine Closing-Rate von 67 % —
              das Doppelte von vorher. Und vor allem: ein System, das skaliert.&rdquo;
            </p>
            <div className="relative border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-sm font-semibold text-white">Teilnehmer</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>SalesMade Academy 2025</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CURRICULUM ───────────────────────────────────────── */}
      <section id="curriculum" className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
            >
              Curriculum
            </span>
            <h2 className="text-3xl font-bold" style={{ color: '#0D0D0B' }}>13 Module. Ein System.</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {MODULES.map((module, i) => (
              <div
                key={module}
                className="flex items-center gap-4 rounded-2xl px-5 py-4 border"
                style={{ backgroundColor: '#FAFAF8', borderColor: '#E5E7EB' }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium text-gray-700">{module}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#1A5FD4' }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Nur 30 Plätze. Soft-Launch 2026.
          </h2>
          <p className="text-white/80 mb-8 text-base">
            Bewirb Dich jetzt für einen der limitierten Frühbucher-Plätze.
            Ein kurzes Gespräch mit Markus stellt sicher, dass das Programm zu Dir passt.
          </p>
          <a
            href="https://calendly.com/eilersfriends"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold shadow-md transition-opacity hover:opacity-90"
            style={{ color: '#1A5FD4' }}
          >
            Jetzt bewerben <ArrowRight size={15} />
          </a>
          <p className="mt-4 text-xs text-white/50">Kos0enloser Erstcall · Keine Vorabkosten</p>
        </div>
      </section>

    </div>
  )
}
