'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { WelcomeStep } from './WelcomeStep'
import { BeefRadarStep } from './BeefRadarStep'
import { StepCompanion } from './StepCompanion'
import { StepSummary } from './StepSummary'

interface Step { key: string; nav: string; navSub: string; live: boolean }

const STEPS: Step[] = [
  { key: '00-welcome', nav: 'Welcome', navSub: 'Dein Unternehmen verstehen', live: true },
  { key: '01-beef-radar', nav: 'Beef-Radar', navSub: 'Inhalte → Wellen-Effekt', live: true },
  { key: '02-doppelschmerz', nav: 'Hürden entfernen', navSub: 'Heute & Morgen', live: false },
  { key: '03-sichtbarer-pfad', nav: 'Sichtbarer Pfad', navSub: 'Bulletproof Delivery Plan', live: false },
  { key: '04-phasen-waehrung', nav: 'Phasen-Währung', navSub: 'Currencies pro Phase', live: false },
  { key: '05-beweis-stapel', nav: 'Beweis-Stapel', navSub: 'ROI-Spur', live: false },
  { key: '06-booster', nav: 'Booster', navSub: 'Bonus, der die Marge schont', live: false },
  { key: '07-wort-garantie', nav: 'Wort-Garantie', navSub: 'Verteidigbare Garantie', live: false },
  { key: '08-letzten-20-prozent', nav: 'Die letzten 20 %', navSub: 'Name · Headline · CTA', live: false },
]

interface Props {
  answers: Record<string, unknown>
  stepsCompleted: number
  startedAt: Date
}

export function WizardEditorial({ answers, stepsCompleted }: Props) {
  const router = useRouter()
  const totalSteps = STEPS.length
  const [editingKey, setEditingKey] = useState<string | null>(null)

  function handleSaved() { setTimeout(() => router.refresh(), 600) }
  function isDone(key: string) { return answers[key] != null }
  function scrollTo(key: string) {
    if (typeof window === 'undefined') return
    const el = document.getElementById('step-' + key)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Sticky topbar with progress */}
      <div className="border-b border-gray-200 bg-white/70 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4 min-w-0">
            <Link href={'/dashboard/frameworks' as '/'} className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900">
              <ArrowLeft size={11} /> Meine Frameworks
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden sm:inline">Bauplan · {stepsCompleted}/{totalSteps} fertig</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1">
              {STEPS.map((s, i) => (
                <button key={s.key} type="button" onClick={() => scrollTo(s.key)}
                  className="h-0.5 w-6 rounded-full transition-colors"
                  style={{ backgroundColor: isDone(s.key) ? '#7A1F1F' : '#D6D2C9' }}
                  aria-label={s.nav} />
              ))}
            </div>
            <span className="font-mono text-[11px] tabular-nums text-gray-500">{String(stepsCompleted).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[180px_1fr_240px]">
          {/* Left rail — sticky step jump-nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Sprungmarken</p>
              <ol className="space-y-1">
                {STEPS.map((s, i) => {
                  const done = isDone(s.key)
                  return (
                    <li key={s.key}>
                      <button type="button" onClick={() => scrollTo(s.key)}
                        className="group w-full rounded-md px-2 py-1.5 text-left hover:bg-white/60 transition-colors">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-mono tabular-nums text-gray-400">
                            {i === 0 ? '★' : String(i).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold leading-tight text-gray-800">
                              {s.nav} {done && <Check size={9} className="inline -mt-0.5 text-green-700" />}
                            </p>
                            <p className="mt-0.5 text-[10px] leading-tight text-gray-500">{s.navSub}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
          </aside>

          {/* Center — endless page, all steps stacked */}
          <main className="min-w-0 max-w-3xl mx-auto w-full space-y-20">
            <header>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">SalesMade · Bauplan</p>
              <h1 className="mt-1 text-4xl sm:text-5xl leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: '#0D0D0B' }}>
                Der Bauplan für unwiderstehliche B2B-Angebote.
              </h1>
              <p className="mt-3 text-sm italic text-gray-600 max-w-2xl">
                Acht Schritte, vier Stunden, ein verteidigbares Angebot. Scroll Dich durch — der Wizard speichert automatisch.
              </p>
            </header>

            {STEPS.map((s, i) => {
              const done = isDone(s.key)
              const editing = editingKey === s.key
              const renderEditor = !done || editing
              return (
                <section key={s.key} id={`step-${s.key}`} className="scroll-mt-20">
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-mono text-[11px] tabular-nums text-gray-400">
                      {i === 0 ? '★' : String(i).padStart(2, '0')} / {String(totalSteps - 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-3xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: '#0D0D0B' }}>
                      {s.nav}
                      <span className="text-base text-gray-500 italic font-normal ml-3">— {s.navSub}</span>
                    </h2>
                  </div>

                  {done && !editing && (
                    <StepSummary stepKey={s.key} answers={answers[s.key] as Record<string, unknown>} onEdit={() => setEditingKey(s.key)} />
                  )}

                  {renderEditor && (
                    <div className="space-y-10">
                      {s.key === '00-welcome' && <WelcomeStep onCompleted={() => { setEditingKey(null); handleSaved() }} />}
                      {s.key === '01-beef-radar' && (
                        <BeefRadarStep
                          initialAnswers={answers['01-beef-radar'] as Parameters<typeof BeefRadarStep>[0]['initialAnswers']}
                          onSaved={() => { setEditingKey(null); handleSaved() }}
                        />
                      )}
                      {!s.live && (
                        <div className="space-y-5">
                          <StepCompanion stepKey={s.key} />
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 max-w-prose">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Naechste Welle</p>
                            <p className="mt-2 text-xs leading-relaxed text-amber-900">
                              Die interaktive Eingabe fuer diesen Schritt rollen wir im naechsten Update frei. Edge-Route + Prompt sind angelegt.
                              Beef-Radar oben ist der Stencil.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <hr className="mt-12 border-t border-gray-200" />
                </section>
              )
            })}

            <footer className="pt-6">
              <p className="text-[11px] italic text-gray-500">Auto-Save · alle 30 Sek</p>
            </footer>
          </main>

          {/* Right rail — sticky sidebar with hints + suggestions + points */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Fortschritt</p>
                <p className="text-xs text-gray-700">Bausteine erfasst <span className="float-right font-mono tabular-nums">{Math.round((stepsCompleted / totalSteps) * 100)}%</span></p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${Math.round((stepsCompleted / totalSteps) * 100)}%`, backgroundColor: '#7A1F1F' }} />
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50/40 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-900 mb-1.5">Markus&apos; Notiz</p>
                <p className="text-[11px] italic leading-snug text-red-900" style={{ fontFamily: 'var(--font-serif)' }}>
                  „Drei Phasen mit Wahrung. Das ist der Punkt, an dem die meisten Angebote aufhoren ‚umfassend‘ zu klingen."
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Punkte Heute</p>
                <ul className="space-y-1.5 text-[11px]">
                  <PointRow points={50} label="Beef · Coaching-Calls" />
                  <PointRow points={50} label="Beef · Playbook-Bibliothek" />
                  <PointRow points={250} label="Schritt 02 komplett" highlight />
                  <PointRow points={75} label="Highlight · Brücken-Satz" />
                  <PointRow points={10} label="Tages-Bonus" />
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Hilfe</p>
                <p className="text-[11px] leading-snug text-gray-600">
                  Stecken? Druck <kbd className="rounded border border-gray-300 bg-white px-1 font-mono text-[10px]">?</kbd> fuer die Markus-Lehre.
                </p>
              </div>

              <div className="pt-2">
                <button type="button" onClick={() => window.print()} className="w-full rounded-full border border-gray-300 bg-white px-3 py-2 text-[11px] font-semibold text-gray-700 hover:bg-gray-50">
                  Als PDF/Print exportieren
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function PointRow({ points, label, highlight }: { points: number; label: string; highlight?: boolean }) {
  return (
    <li className={`flex items-center gap-2 rounded ${highlight ? 'bg-gray-900 text-white px-2 py-1' : ''}`}>
      <span className={`font-mono tabular-nums text-[11px] font-bold ${highlight ? 'text-white' : 'text-red-900'}`}>+{points}</span>
      <span className={`flex-1 text-[11px] leading-tight ${highlight ? 'text-white' : 'text-gray-700'}`}>{label}</span>
      <span className={`font-mono tabular-nums text-[10px] ${highlight ? 'text-white/70' : 'text-gray-500'}`}>{points} pts</span>
    </li>
  )
}
