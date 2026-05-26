'use client'

import { useState } from 'react'
import { ArrowRight, Building2, Globe, Loader2 } from 'lucide-react'

interface Props {
  draftId: string
  initialOrgName?: string
  initialWebsite?: string
  onAnalysed?: () => void
}

const STATS = [
  { value: '28 → 53%', label: 'Annahmequote', color: '#F05A1A' },
  { value: '+579%', label: 'SaaS-Umsatz / 6 Mo', color: '#1A5FD4' },
  { value: '< 3 Mo', label: 'Sales-Cycle', color: '#D4192B' },
  { value: '3x', label: 'verkauft sich besser', color: '#0D0D0B' },
]

const WHY_CARDS = [
  { title: '„Mein Team baut Angebote ad hoc."', body: 'Jedes Mal andere Qualität. Du rettest jeden zweiten Pitch persönlich. Das System hängt an Dir.' },
  { title: '„Cycles ziehen sich, Quoten stagnieren."', body: 'Die richtigen Leute sagen zu langsam Ja, die falschen zu spät Nein. Beides kostet Cash und Marge.' },
  { title: '„Wettbewerber machen uns vergleichbar."', body: 'Du landest in Excel-Tabellen, in denen nur der Preis zählt. Marge erodiert, ohne dass jemand es merkt.' },
  { title: '„Ich ahne: Es ist nicht der Vertrieb."', body: 'Es ist das Angebot selbst. Mehr Pitch-Training ändert daran nichts. Du brauchst Substanz im Angebot, nicht mehr Pitch-Talent.' },
]

const MILES = [
  'Keine Rabatte vergeben.',
  'Keine Deals mehr, die slippen.',
  'Kundengewinn ohne technische Fragen.',
  'Keine Besuche aus reiner Hoffnung.',
  'Fünf Kunden in einer Woche gewinnen.',
  '200 % der Ziele — ohne mehr Aufwand.',
  'Verkaufen ohne Hinterherjagen.',
  'Kunden, die ihre Worte halten.',
  'Stabil sechsstellig verdienen.',
]

const STEPS_OVERVIEW = [
  { num: '★ · Pre', title: 'Welcome', sub: 'Wir lernen Dein Unternehmen kennen.' },
  { num: '01', title: 'Business + Produkt + Bausteine', sub: 'Markt, Modell, Angebot, Top 5 + Bonus.' },
  { num: '02', title: 'ICP', sub: 'Wer leidet, beurteilt, entscheidet.' },
  { num: '03', title: 'Herausforderungen + erhoffte Ergebnisse', sub: 'Heute spüren, morgen wollen.' },
  { num: '04', title: 'Beef-Radar', sub: 'WHAT → HOW → WHY pro Baustein.' },
  { num: '05', title: 'Future Problems', sub: 'Was nach dem Erfolg kommt.' },
  { num: '06', title: 'Wirtschaftliche Bewertung', sub: 'Cluster + Maximalbudget.' },
  { num: '07', title: 'Optimaler Weg', sub: 'Bulletproof Plan + Roadmap-SVG.' },
  { num: '08', title: 'Currencies pro Phase', sub: 'Mess-Punkte pro Phase.', optional: true },
  { num: '09', title: 'Preis', sub: 'Marktest-Preis, nie glatt.' },
  { num: '10', title: 'Scarcity', sub: 'Echte Knappheit.', optional: true },
  { num: '11', title: 'Risk-Reversal', sub: 'Commitment gegen Commitment.', optional: true },
  { num: '12', title: 'Name + Headline', sub: 'Die letzten 20 %.' },
]

export function WelcomeStepV2({ draftId, initialOrgName = '', initialWebsite = '', onAnalysed }: Props) {
  const [orgName, setOrgName] = useState(initialOrgName)
  const [url, setUrl] = useState(initialWebsite)
  const [analysing, setAnalysing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyse() {
    if (!url.trim()) { setError('Bitte gib Eure Website-URL ein.'); return }
    setAnalysing(true); setError(null)
    try {
      const res = await fetch(`/api/wizard/v2/${draftId}/welcome/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organisationName: orgName, websiteUrl: url }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Analyse fehlgeschlagen.'); setAnalysing(false); return }
      onAnalysed?.()
    } catch (e) { setError(String(e)) }
    finally { setAnalysing(false) }
  }

  return (
    <>
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-cream px-6 pb-20 pt-14 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue opacity-[0.12] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-orange opacity-[0.10] blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-blue" />
              SalesMade · Der Bauplan
            </span>
          </div>
          <h1 className="text-center font-serif leading-[1.05] tracking-tight text-ink" style={{ fontSize: 'clamp(48px, 7vw, 88px)' }}>
            BOOM.<br />
            <span className="text-blue">Schön Dich zu sehen.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-relaxed text-ink sm:text-xl">
            Viele Unternehmen, die glauben, sie haben ein Sales-Problem, haben mindestens auch ein Angebotsproblem. Möchten wir nicht alle erleben, dass Kunden komplett ausflippen, weil sie unsere Angebote so gut finden?
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-muted">
            Klasse, dass Du Dich entschieden hast, hier Deinen Bauplan für unwiderstehliche Angebote zu bauen — der verspricht ja genau das zu machen. In dreizehn Schritten von „boring und irrelevant" zu einem Angebot, das Dein Team wieder und wieder verwenden kann. Wir befreien Deine Kundengewinnung von inneren Widerständen — vielleicht schon beim nächsten Kunden.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="#welcome-research" className="rounded-full bg-[#0A0D14] px-8 py-4 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90">
              Bauplan starten →
            </a>
            <a href="#why" className="rounded-full border border-gray-300 bg-white px-6 py-4 text-sm font-semibold text-ink hover:bg-gray-50">
              Erst kurz erklären
            </a>
          </div>
          <div className="mt-16 grid grid-cols-2 divide-x divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 px-4 py-7">
                <span className="text-3xl font-bold sm:text-4xl" style={{ color: s.color }}>{s.value}</span>
                <span className="text-xs font-medium text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center font-serif text-lg italic text-muted">
            „Sie verkaufen sich Ihr Zeug hier ja selbst." — Kunde nach drei Wochen Bauplan-Arbeit
          </p>
        </div>
      </section>

      {/* ── WHY (4 Cards) ────────────────────────────── */}
      <section id="why" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <span className="mb-4 inline-block rounded-full bg-red-bg px-3 py-1 text-xs font-bold uppercase tracking-widest text-red">
              Wenn Dir das vertraut vorkommt
            </span>
            <h2 className="text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Vier Sätze, die Gründer<br />insgeheim denken.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              Wenn drei oder vier davon zutreffen, hast Du kein Sales-Problem. Du hast ein Angebots-Problem. Genau dafür ist dieser Bauplan da.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {WHY_CARDS.map((c) => (
              <div key={c.title} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-bg">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4192B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <h3 className="mb-2 text-lg font-bold text-ink">{c.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4-MINUTE MILES (9 Cards) ─────────────────── */}
      <section className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-blue" />
              Was nach dem Bauplan normal wird
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Neun Sachen, die Gründer heute<br />noch für unmöglich halten.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
              1954 lief Roger Bannister die erste 4-Minuten-Meile. Was bis dahin als unmöglich galt. Danach folgten andere in Monaten. Die Unmöglichkeit war meist mental. Das hier sind unsere neun.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MILES.map((m, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-2 font-serif text-3xl text-blue">{String(i + 1).padStart(2, '0')}</div>
                <p className="font-semibold text-ink">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13-STEP-ÜBERSICHT ─────────────────────────── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <span className="mb-4 inline-block rounded-full bg-orange-bg px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange">
              So funktioniert das
            </span>
            <h2 className="text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Pre + zwölf Schritte.<br />Vier Stunden Tiefenarbeit.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              Scroll Dich von oben nach unten. Jeder Schritt baut auf dem vorherigen auf. Auto-Save alle 30 Sekunden — keine Sorge ums Speichern.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS_OVERVIEW.map((s) => (
              <div key={s.num} className="rounded-xl border border-gray-100 bg-cream p-5">
                <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-blue">
                  {s.num}{s.optional && <span className="ml-1 text-amber">· optional</span>}
                </div>
                <div className="font-bold text-ink">{s.title}</div>
                <p className="mt-1 text-xs text-gray-600">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 rounded-2xl border border-orange-border bg-orange-bg p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:items-center">
              <div>
                <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-widest text-orange">Was Du am Ende in der Hand hältst</span>
                <h3 className="font-serif text-3xl text-ink">Unwiderstehliche Angebote, die Dein Team wieder und wieder verwenden kann.</h3>
              </div>
              <p className="text-base leading-relaxed text-gray-700">
                Ein vollständig ausformuliertes Angebot, das Dein Vertrieb sofort pitchen kann. Bauplan-PDF als wiederholbare Methodik für jedes neue Angebot. Offer-OnePager, mit dem Dein Team in jedem Call überzeugt. Roadmap, die im Vorstandszimmer des Kunden überlebt. Vier Stunden Tiefenarbeit jetzt — und Dein Team macht das ab nächster Woche selbst.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESEARCH BOX ─────────────────────────────── */}
      <section id="welcome-research" className="bg-cream px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-border bg-blue-bg px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-blue" />
              Pre · Welcome
            </span>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Bevor wir loslegen — lass mich<br />Dein Unternehmen kennenlernen.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              Damit ich Dir in jedem der zwölf Schritte passend zuarbeite und nichts erfinde, brauche ich einmal Deinen Kontext. Gib mir Eure Website-URL — in dreißig Sekunden scanne ich, was es da gibt, und schlage Dir vor. Du korrigierst, wir gehen weiter.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-bg">
                <Building2 size={22} className="text-blue" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink">Organisations-Scan</h3>
                <p className="text-sm text-muted">URL eintippen → Summary, Value Proposition, Zielgruppe, Tone, Keywords, Brand-Farben sind in 30 Sek im System.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Organisations-Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="z.B. Eilers+Friends"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Website URL</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="eilersfriends.com"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm focus:border-blue focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={analyse}
              disabled={analysing || !url.trim()}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0A0D14] px-6 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {analysing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              {analysing ? 'Analysiere…' : 'Analyse starten'}
            </button>
            {error && <p className="mt-3 text-xs text-red">{error}</p>}

            <p className="mt-3 text-xs italic text-muted">
              Was passiert in den 30 Sekunden: Ich öffne Deine Website, lese die wichtigsten Sub-Pages, fasse zusammen, was ich finde. Du siehst alles, kannst alles ändern. Nichts wird ohne Dein OK übernommen.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
