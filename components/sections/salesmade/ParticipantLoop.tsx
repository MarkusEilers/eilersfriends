'use client'

/**
 * SalesMade Participant Loop — die 6-Stufen-Reise eines Teilnehmers
 * als selbstverstärkende Schleife. Inspiriert von community.com/integrations
 * Loyalty Loop. Klickbare Knoten im Kreis + Detail-Panel darunter.
 */
import { useState } from 'react'
import {
  ClipboardCheck, Map, BookOpen, Swords, Briefcase, TrendingUp,
} from 'lucide-react'

interface Stage {
  key: string
  n: string
  label: string
  tagline: string
  icon: typeof ClipboardCheck
  body: string
  artifact: string
  duration: string
}

const STAGES: Stage[] = [
  {
    key: 'assessment',
    n: '01',
    label: 'Assessment',
    tagline: 'Diagnose · 30 Min',
    icon: ClipboardCheck,
    body:
      'In einem realistischen Kundenszenario zeigt sich, wo die echten Lücken sind. Wir messen alle 16 Skills entlang der Customer Journey — von der Vorbereitung bis zum Closing.',
    artifact: 'Personal Skill-Radar mit Stärken & nächsten Hebeln',
    duration: 'Einmalig 30 Min · plus Quartalsweise',
  },
  {
    key: 'skillplan',
    n: '02',
    label: 'Skill-Plan',
    tagline: 'Maßgeschneidert',
    icon: Map,
    body:
      'Aus dem Assessment entsteht Dein individueller Lernpfad: welches Modul zuerst, in welcher Sparring-Stufe Du startest, welche Disziplin den größten Hebel hat.',
    artifact: '12-Monats-Roadmap mit Modul-Reihenfolge und Meilensteinen',
    duration: 'Innerhalb 48h nach Assessment',
  },
  {
    key: 'training',
    n: '03',
    label: 'Live Training',
    tagline: '90 Min/Monat',
    icon: BookOpen,
    body:
      'Monatliche Live-Sessions mit Europas Top-Praktikern. Pro Modul kommt ein vortrainierter AI-Agent dazu — keine 47 Custom-GPTs basteln, sondern direkt anwenden.',
    artifact: 'Modul-Bauplan · GPT Engine · Playbook',
    duration: '90 Min Live · 24/7 On-Demand-Replays',
  },
  {
    key: 'sparring',
    n: '04',
    label: 'Sparring',
    tagline: '5 Schwierigkeitsstufen',
    icon: Swords,
    body:
      'Übung im sicheren Raum. Realistische Kundenszenarien in fünf eskalierenden Schwierigkeiten — vom freundlichen Erstgespräch bis zum erfahrenen CFO mit Einwänden.',
    artifact: 'Skill-Score · Coach-Notes · Wiederholung bis es sitzt',
    duration: '120 Min Group-Coaching pro Monat',
  },
  {
    key: 'realdeal',
    n: '05',
    label: 'Real Deal',
    tagline: 'Anwendung im Feld',
    icon: Briefcase,
    body:
      'Du nimmst das Gelernte mit ins echte Kundengespräch. Anschließend Auswertung im Group-Coaching mit anonymisiertem Material: was lief, was geht besser, wo hilft welcher Skill.',
    artifact: 'Documented Win · Coach-Auswertung · Team-Learning',
    duration: 'Laufend · auf eigene Kadenz',
  },
  {
    key: 'compounding',
    n: '06',
    label: 'Compounding',
    tagline: 'Stufe steigt',
    icon: TrendingUp,
    body:
      'Ergebnisse erzeugen Confidence, Confidence erzeugt Aktivität, Aktivität erzeugt mehr Ergebnisse. Du steigst die Werkstatt-Progression hoch (Apprentice → Master) und coachst irgendwann selber.',
    artifact: 'Skill-Level Pin · LinkedIn-Badge · Faculty-Path',
    duration: 'Kontinuierlich · 6 Stufen',
  },
]

// Position 6 stages around a circle (top = 0°, clockwise).
function pos(i: number, radius: number, cx: number, cy: number) {
  const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

export function ParticipantLoop() {
  const [active, setActive] = useState<string>('assessment')
  const activeStage = STAGES.find((s) => s.key === active) ?? STAGES[0]
  const ActiveIcon = activeStage.icon

  const W = 720
  const H = 480
  const cx = W / 2
  const cy = H / 2
  const R = 175

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4', border: '1px solid #BBCFF5' }}
          >
            Die Teilnehmer-Reise
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Eine Schleife, die mit jedem
            <br className="hidden sm:block" /> Gespräch klüger wird.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-gray-600 leading-relaxed">
            Jede Stufe füttert die nächste. Klicke auf einen Knoten, um zu sehen,
            was in dieser Phase passiert.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_440px] items-start">
          {/* SVG Loop */}
          <div className="rounded-3xl bg-white border border-gray-100 p-4 sm:p-8">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
              role="img"
              aria-label="Participant Experience Loop"
            >
              {/* Circle path connecting stages */}
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="#DCE8F7" strokeWidth="1.5" strokeDasharray="4 6" />

              {/* Arrows along the circle between stages */}
              {STAGES.map((_, i) => {
                const a1 = (i / 6) * Math.PI * 2 - Math.PI / 2 + 0.18
                const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2 - 0.18
                const x1 = cx + R * Math.cos(a1)
                const y1 = cy + R * Math.sin(a1)
                const x2 = cx + R * Math.cos(a2)
                const y2 = cy + R * Math.sin(a2)
                // Mid for arrow head direction
                const mx = (x1 + x2) / 2
                const my = (y1 + y2) / 2
                // Tangent vector
                const ang = Math.atan2(y2 - y1, x2 - x1)
                const ah = 6
                return (
                  <g key={i}>
                    <path
                      d={`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`}
                      fill="none"
                      stroke="#BBCFF5"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points={`${mx},${my} ${mx - ah * Math.cos(ang - 0.5)},${my - ah * Math.sin(ang - 0.5)} ${mx - ah * Math.cos(ang + 0.5)},${my - ah * Math.sin(ang + 0.5)}`}
                      fill="#1A5FD4"
                    />
                  </g>
                )
              })}

              {/* Stage nodes */}
              {STAGES.map((stage, i) => {
                const { x, y } = pos(i, R, cx, cy)
                const isActive = stage.key === active
                const labelOffset = 56
                const lx = cx + (R + labelOffset) * Math.cos((i / 6) * Math.PI * 2 - Math.PI / 2)
                const ly = cy + (R + labelOffset) * Math.sin((i / 6) * Math.PI * 2 - Math.PI / 2)
                return (
                  <g
                    key={stage.key}
                    onClick={() => setActive(stage.key)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Node circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 32 : 26}
                      fill={isActive ? '#1A5FD4' : '#FFFFFF'}
                      stroke={isActive ? '#0F3D8E' : '#BBCFF5'}
                      strokeWidth={isActive ? 2 : 1.5}
                      style={{ transition: 'all 0.25s' }}
                    />
                    {/* Stage number */}
                    <text
                      x={x}
                      y={y - 4}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="monospace"
                      fill={isActive ? 'rgba(255,255,255,0.7)' : '#9CA3AF'}
                    >
                      {stage.n}
                    </text>
                    {/* Stage label centered */}
                    <text
                      x={x}
                      y={y + 9}
                      textAnchor="middle"
                      fontSize={isActive ? '11' : '10'}
                      fontWeight="700"
                      fill={isActive ? '#FFFFFF' : '#0F1E3A'}
                    >
                      {stage.label}
                    </text>
                    {/* Outer label */}
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill={isActive ? '#1A5FD4' : '#6B7280'}
                      style={{ transition: 'all 0.25s' }}
                    >
                      {stage.tagline}
                    </text>
                  </g>
                )
              })}

              {/* Center hub */}
              <g>
                <circle cx={cx} cy={cy} r={42} fill="#0F1E3A" />
                <text
                  x={cx}
                  y={cy - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#5DDBF5"
                  letterSpacing="2"
                >
                  SALESMADE
                </text>
                <text
                  x={cx}
                  y={cy + 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#FFFFFF"
                >
                  Academy
                </text>
                <text
                  x={cx}
                  y={cy + 24}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgba(255,255,255,0.6)"
                >
                  12 Monate
                </text>
              </g>
            </svg>
          </div>

          {/* Detail panel for active stage */}
          <div className="rounded-3xl bg-white border border-gray-100 p-7">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#EBF1FF', color: '#1A5FD4' }}
              >
                <ActiveIcon size={20} />
              </div>
              <div>
                <div className="font-mono text-xs font-bold" style={{ color: '#1A5FD4' }}>
                  Stufe {activeStage.n}
                </div>
                <div className="text-xl font-bold" style={{ color: '#0D0D0B' }}>
                  {activeStage.label}
                </div>
              </div>
            </div>

            <p className="mb-6 text-sm leading-relaxed" style={{ color: '#374151' }}>
              {activeStage.body}
            </p>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: '#9CA3AF' }}>
                  Was Du herausbekommst
                </div>
                <div
                  className="rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ backgroundColor: '#EBF1FF', color: '#0F1E3A' }}
                >
                  {activeStage.artifact}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: '#9CA3AF' }}>
                  Zeitinvestment
                </div>
                <div className="text-sm" style={{ color: '#0D0D0B' }}>
                  {activeStage.duration}
                </div>
              </div>
            </div>

            {/* Mini-stepper */}
            <div className="mt-6 flex gap-1">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{
                    backgroundColor: s.key === active ? '#1A5FD4' : '#E5E7EB',
                  }}
                  aria-label={`Stufe ${s.n}: ${s.label}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
