'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Clock, Sparkles } from 'lucide-react'
import { WelcomeStep } from './WelcomeStep'
import { BeefRadarStep } from './BeefRadarStep'
import { StepCompanion } from './StepCompanion'

interface Step { key: string; nav: string; navSub: string; live: boolean }

const STEPS: Step[] = [
  { key: '00-welcome', nav: 'Welcome', navSub: 'Set up your organisation', live: true },
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

export function WizardEditorial({ answers, stepsCompleted, startedAt }: Props) {
  const router = useRouter()
  const firstUnfinished = STEPS.findIndex((s) => answers[s.key] == null)
  const initial = firstUnfinished >= 0 ? firstUnfinished : 0
  const [activeIdx, setActiveIdx] = useState(initial)
  const active = STEPS[activeIdx]
  const stepIndex = activeIdx + 1
  const totalSteps = STEPS.length

  function go(idx: number) {
    setActiveIdx(idx)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function handleSaved() { setTimeout(() => router.refresh(), 600) }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Topbar */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={'/dashboard/frameworks' as '/'} className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900">
              <ArrowLeft size={11} /> Meine Frameworks
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bauplan · Schritt {stepIndex}/{totalSteps}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1">
              {STEPS.map((s, i) => (
                <span key={s.key} className="h-0.5 w-6 rounded-full" style={{ backgroundColor: i < stepsCompleted ? '#7A1F1F' : i === activeIdx ? '#7A1F1F' : '#D6D2C9' }} />
              ))}
            </div>
            <span className="font-mono text-[11px] tabular-nums text-gray-500">{String(stepIndex).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[180px_1fr_220px] xl:grid-cols-[200px_1fr_260px]">
          {/* Left nav */}
          <aside className="hidden lg:block">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Die 8 Schritte</p>
            <ol className="space-y-1">
              {STEPS.map((s, i) => {
                const done = answers[s.key] != null
                const isActive = i === activeIdx
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => go(i)}
                      className={`group w-full rounded-lg px-2.5 py-2 text-left transition-colors ${isActive ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                      style={isActive ? { boxShadow: '0 0 0 1px rgba(122,31,31,0.2)' } : undefined}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-[10px] font-mono tabular-nums ${isActive ? 'text-red-900' : 'text-gray-400'}`}>
                          {i === 0 ? '★' : String(i).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] font-bold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
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
          </aside>

          {/* Center: editorial flow */}
          <main className="min-w-0 max-w-2xl mx-auto w-full">
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full border border-gray-300 bg-white/60 px-3 py-1 text-[10px] font-mono tabular-nums text-gray-600">
                Schritt {String(stepIndex).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl leading-[1.1] tracking-tight" style={{ fontFamily: 'var(--font-serif)', color: '#0D0D0B' }}>
              {active.nav}.
            </h1>
            <p className="mt-3 text-sm italic text-gray-600">— {active.navSub}</p>

            <div className="mt-8 space-y-8">
              {active.key === '00-welcome' && <WelcomeStep onCompleted={handleSaved} />}
              {active.key === '01-beef-radar' && (
                <BeefRadarStep
                  initialAnswers={answers['01-beef-radar'] as Parameters<typeof BeefRadarStep>[0]['initialAnswers']}
                  onSaved={handleSaved}
                />
              )}
              {!active.live && <LockedStubBody stepKey={active.key} />}
            </div>

            {/* Step nav: back / next */}
            <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
              <button onClick={() => activeIdx > 0 && go(activeIdx - 1)} disabled={activeIdx === 0}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-30">
                <ArrowLeft size={11} /> Zurück
              </button>
              <span className="text-[11px] italic text-gray-500">Auto-Save · alle 30 Sek</span>
              <button onClick={() => activeIdx < totalSteps - 1 && go(activeIdx + 1)} disabled={activeIdx === totalSteps - 1}
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-30">
                Weiter <ArrowRight size={11} />
              </button>
            </div>
          </main>

          {/* Right sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Aktiv</p>
                <p className="text-xs font-semibold text-gray-900 leading-snug">{active.nav}</p>
                <p className="text-[11px] text-gray-500 leading-snug">{active.navSub}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Fortschritt</p>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-[11px] text-gray-700">Bausteine erfasst <span className="float-right font-mono tabular-nums">{Math.round((stepsCompleted / totalSteps) * 100)}%</span></p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((stepsCompleted / totalSteps) * 100)}%`, backgroundColor: '#7A1F1F' }} />
                  </div>
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
                  Stecken? Druck <kbd className="rounded border border-gray-300 bg-white px-1 font-mono text-[10px]">?</kbd> fuer die Markus-Lehre — oder lass die Beispiele aufklappen.
                </p>
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

function LockedStubBody({ stepKey }: { stepKey: string }) {
  return (
    <div className="space-y-6">
      <StepCompanion stepKey={stepKey} />
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Naechste Welle</p>
        <p className="mt-2 text-xs leading-relaxed text-amber-900">
          Die interaktive Eingabe fuer diesen Schritt rollen wir im naechsten Update frei. Edge-Route + Prompt sind schon angelegt.
          Beef-Radar oben ist der Stencil.
        </p>
      </div>
    </div>
  )
}
