import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Calendar, ArrowRight, Shield, Check, AlertTriangle,
  TrendingUp, Users, Target, Sparkles, Award, BookOpen,
} from 'lucide-react'
import { SalesMadeRoiCalculator } from './RoiCalculator'

export const metadata: Metadata = {
  title: 'SalesMade Academy — Vom experimentellen Freestyle zum planbaren Umsatzsystem',
  description:
    '12-monatiges Transformationsprogramm für B2B-Vertriebsteams. Conversion 28 % → 60 %. AI-powered Plattform mit persönlichem Sparring. 100 % Geld-zurück-Garantie nach 90 Tagen.',
}

const CRISIS_STATS = [
  {
    persona: 'der B2B-Verkäufer',
    number: '93%',
    label: 'ohne professionelle Ausbildung',
    description:
      'Aufmerksamkeit gewinnen, Gespräche führen, überzeugen, Angebote machen — alles experimenteller Freestyle.',
  },
  {
    persona: 'der Sales-Mitarbeitenden',
    number: '67%',
    label: 'fühlen sich nicht bereit',
    description:
      'Sie fühlen sich für ihren Job und die damit verbundenen Erwartungen nicht ausreichend vorbereitet.',
  },
  {
    persona: 'der Founder, CEOs & Owner',
    number: '88%',
    label: 'wollen sich auf ihr Team verlassen',
    description:
      'Dieser Mangel kostet Unternehmen große Teile ihrer möglichen Umsätze und beschädigt den Unternehmenswert.',
  },
]

const RULES_STATS = [
  {
    number: '75%',
    label: 'bevorzugen kein Sales',
    text: 'der B2B-Käufer wünschen sich ein Kauferlebnis ohne direkten Sales-Kontakt. Deine Verkäufer müssen also echten Mehrwert bieten — oder sie werden überflüssig.',
  },
  {
    number: '79%',
    label: 'entscheiden allein',
    text: 'der Kunden sprechen nicht mehr mit Anbietern, bevor die Entscheidung fällt. Wer nicht früh genug als Sparringspartner wahrgenommen wird, kommt zu spät.',
  },
]

const SYMPTOMS = [
  'Sinkende Aktivität & Selbstvertrauen',
  'Kaum Zugang zu Entscheidern',
  'Niedrige Conversion-Raten',
  'Demotivierende Abwärtsspirale',
]

const VISION = [
  'Ein selbstsicheres, charismatisches und gut trainiertes Sales-Team',
  'Die Aufmerksamkeit der richtigen Entscheider gewinnen',
  'Kunden, die sich komplett verstanden fühlen',
  'Schlaues Infotainment auf Augenhöhe, das zu gut informierten Entscheidungen inspiriert',
  'Angebote, die so unwiderstehlich verpackt sind, dass der Kunde sich bekloppt vorkommt, wenn er nicht zuschlägt',
  'Planbare, vorhersehbare Umsätze und höhere Auftragsvolumen',
]

const SYSTEM_STATS = [
  { value: '12', label: 'Monate Begleitung' },
  { value: '50', label: 'Exklusive Plätze' },
  { value: '13', label: 'Core Skills' },
  { value: '24', label: 'Trainings-Module' },
]

const SYSTEM_MEASURES = [
  'Monatliches Live-Training mit Top Sales-Leadern',
  'Group-Coaching für taktische Problemlösung',
  'Community mit erfahrenen Coaches',
  'AI-Tools, Playbooks & GPT Engines',
  'Zertifikate für erworbene Fähigkeiten',
  'Quartalsweise Re-Assessments',
]

const RESULTS = [
  'Steigerung der Effizienz und Qualität der Vertriebsgespräche um mindestens 30 %',
  'Erhöhung der Abschlussquoten in Discovery Calls von durchschnittlich 28 % auf bis zu 60 %',
  'Messbare Reduktion der durchschnittlichen Dauer eines Verkaufszyklus um bis zu 38 %',
  'Professionell ausgebildete Seller erzielen 48 % – 280 % höhere Umsätze',
  'Aufbau einer klaren, bewährten Vertriebsstruktur',
  'Deutlich verbesserte Kundenzufriedenheit durch gezielte und empathische Kommunikation',
]

const TOOLS = [
  { title: 'Beef Radar', desc: 'Vom Merkmal zum Financial Impact. Wichtige Botschaften entwickeln, damit auch der CFO zuhört.' },
  { title: 'Elevator Pitch 2.0', desc: 'Eine Vision malen statt Features aufzählen. Interesse in 30 Sekunden wecken.' },
  { title: 'Lösungsquadrant', desc: 'Bedarf, Mehrwerte, Welleneffekte und Financial Impact sauber dekodieren.' },
  { title: 'Instant Authority', desc: 'Schon im ersten Gespräch als Experte auf Augenhöhe positionieren.' },
  { title: 'Taktische Empathie', desc: 'Vertrauen aufbauen durch Labeling, Mirroring und limbische Kommunikation.' },
  { title: 'Unwiderstehliche Angebote', desc: 'Angebote so verpacken, dass der Kunde sich bekloppt vorkommt, wenn er ablehnt.' },
  { title: 'Strategische Vorbereitung', desc: 'In 8 Schritten auch in wichtigen und schwierigen Gesprächen überzeugen.' },
  { title: 'Einwandbehandlung', desc: 'Einwände gezielt vorwegnehmen und zu unserem Vorteil nutzen.' },
  { title: 'Micro- & Trial-Closing', desc: 'Niederlagenlos zur Entscheidung führen. Schritt für Schritt zum Abschluss.' },
]

const FAQ = [
  {
    q: 'Für wen ist die Academy geeignet?',
    a: 'Die SalesMade Academy richtet sich an B2B-Vertriebsteams, die systematisch ihre Conversion-Rates verbessern und planbare Umsätze erzielen möchten. Ideal für Unternehmen mit 5–50 Verkäufer:innen, die bereit sind, in professionelle Ausbildung zu investieren.',
  },
  {
    q: 'Wie viel Zeit muss mein Team investieren?',
    a: 'Das Programm ist auf 12 Monate ausgelegt mit 90 Minuten Live-Training pro Monat, 120 Minuten Group-Coaching und selbstgesteuertem Lernen. Die Inhalte sind praxisnah und direkt im Tagesgeschäft anwendbar.',
  },
  {
    q: 'Was passiert, wenn wir keine Ergebnisse sehen?',
    a: 'Wir bieten eine 100 % Geld-zurück-Garantie. Wenn Du nach 90 Tagen keine messbaren Verbesserungen in Deinen KPIs siehst, erstatten wir die volle Investition zurück. Keine Fragen gestellt.',
  },
  {
    q: 'Können wir auch nur einzelne Mitarbeiter schicken?',
    a: 'Ja, das ist möglich. Allerdings sind die besten Ergebnisse zu sehen, wenn das gesamte Team gemeinsam trainiert wird. So entsteht eine einheitliche Verkaufssprache und -methodik im gesamten Unternehmen.',
  },
  {
    q: 'Was unterscheidet die Academy von klassischen Trainings?',
    a: '6-tägige Classroom-Trainings sind out — und aus ziemlich guten Gründen. Die SalesMade Academy ist eine digitale, AI-powered Plattform mit persönlichem Sparring durch erfahrene Sales-Leader. Wir holen jedes Teammitglied genau da ab, wo es heute steht, und führen es monatlich schrittweise durch die passenden Skills.',
  },
]

export default function SalesMadePage() {
  const accent = '#1A5FD4'
  const navy = '#0F1E3A'

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-4xl text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'rgba(26,95,212,0.25)', color: '#93B8F5' }}
          >
            SalesMade Academy · Soft-Launch · Limitierte Plätze
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Von Unsicherheit zu<br />
            <span style={{ color: accent }}>planbaren Umsätzen.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Die SalesMade Academy ist kein Seminar. Es ist ein 12-monatiges
            Transformationsprogramm, das Deine Verkäufer:innen zu unverzichtbaren
            Sparringspartnern für Deine Kunden macht.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              <Calendar size={16} /> Jetzt Benchmarking-Gespräch buchen <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Nur noch wenige Plätze für den Soft-Launch verfügbar.
          </p>
        </div>
      </section>

      {/* ─── 1. CRISIS ───────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Die unsichtbare Krise im B2B-Vertrieb
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Weil ohne Wissen und ohne Können,<br />bringt alles Machen wenig.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {CRISIS_STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="text-xs uppercase tracking-widest text-gray-400">{s.persona}</div>
                <div className="mt-3 text-4xl font-bold" style={{ color: accent }}>{s.number}</div>
                <div className="mt-1 text-sm font-bold" style={{ color: '#0D0D0B' }}>{s.label}</div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. RULES ────────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Markt-Realität
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Die Spielregeln haben sich geändert
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-700">
              Käufer sind heute besser informiert als je zuvor. Sie recherchieren
              eigenständig, vergleichen Anbieter und treffen Entscheidungen, bevor
              ein Verkäufer überhaupt ins Spiel kommt. Wer in diesem Umfeld noch mit
              klassischem Pitch und Produktpräsentation arbeitet, verliert — nicht
              weil das Produkt schlecht ist, sondern weil der Verkaufsansatz
              überholt ist.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {RULES_STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-white p-6" style={{ borderColor: '#BBCFF5' }}>
                <div className="text-4xl font-bold" style={{ color: accent }}>{s.number}</div>
                <div className="mt-1 text-sm font-bold" style={{ color: '#0D0D0B' }}>{s.label}</div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. SYMPTOMS ─────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Erkennst du das?</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Typische Symptome
            </h2>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {SYMPTOMS.map((s) => (
              <li
                key={s}
                className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-5"
              >
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#D4192B' }} />
                <span className="text-sm font-semibold text-gray-800">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── 4. GOOD NEWS ────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#FFF1EB' }}>
        <div className="mx-auto max-w-3xl text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'white', color: '#F05A1A', border: '1px solid #FECDBB' }}
          >
            Die gute Nachricht
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Die Herausforderung ist lösbar.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-gray-700">
            Im direkten Vergleich geht es den meisten Wettbewerbern in einem Markt
            gleich. Unternehmen, die das nachholen, sehen schnell deutlich bessere
            Ergebnisse in Conversions, im Umfang ihrer Abschlüsse und in der
            Motivation ihrer Teams. Insgesamt sind{' '}
            <strong style={{ color: '#F05A1A' }}>
              Umsatzsteigerungen um 48 % in den ersten 12 Monaten die Regel.
            </strong>
          </p>
        </div>
      </section>

      {/* ─── 5. VISION ───────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>So fühlt sich Erfolg an</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Das, worauf Du als Founder/CEO eigentlich Anspruch hast
            </h2>
          </div>
          <ul className="mt-12 grid gap-4 md:grid-cols-2">
            {VISION.map((v) => (
              <li
                key={v}
                className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6"
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#EBF1FF' }}
                >
                  <Check size={16} style={{ color: accent }} />
                </div>
                <span className="text-sm leading-relaxed text-gray-700">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── 6. SYSTEM ───────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>
              Das System für planbaren Erfolg
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-white">
              Die SalesMade Academy ist kein Seminar.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Es ist ein 12-monatiges Transformationsprogramm, das Deine
              Verkäufer:innen zu unverzichtbaren Sparringspartnern für Deine Kunden
              macht.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Step 1 */}
            <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm" style={{ border: '1px solid rgba(147,184,245,0.25)' }}>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: 'rgba(26,95,212,0.4)', color: '#93B8F5' }}>
                Schritt 1
              </span>
              <h3 className="mt-3 text-xl font-bold text-white">Simuliertes Kundenszenario</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Jeder Teilnehmer durchläuft ein realistisches Kundenszenario, in dem{' '}
                <strong style={{ color: accent }}>13 entscheidende Sales-Skills</strong>{' '}
                individuell gemessen und bewertet werden.
              </p>
            </div>
            {/* Step 2 */}
            <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm" style={{ border: '1px solid rgba(147,184,245,0.25)' }}>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: 'rgba(26,95,212,0.4)', color: '#93B8F5' }}>
                Schritt 2
              </span>
              <h3 className="mt-3 text-xl font-bold text-white">Individueller Lernpfad</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Basierend auf dem Benchmark entwickeln wir für jeden Seller einen{' '}
                <strong style={{ color: accent }}>maßgeschneiderten Entwicklungsplan</strong>{' '}
                — mit angepassten Szenarien in 5 Schwierigkeitsstufen und
                Echtzeit-Feedback.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {SYSTEM_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-bold" style={{ color: accent }}>{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Measures */}
          <div className="mt-16 rounded-3xl bg-white/5 p-8 backdrop-blur-sm" style={{ border: '1px solid rgba(147,184,245,0.25)' }}>
            <h3 className="text-center text-sm font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>
              Begleitende Maßnahmen
            </h3>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {SYSTEM_MEASURES.map((m) => (
                <li key={m} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: accent }} />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 7. RESULTS ──────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Outcomes</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Was unsere Teilnehmer konkret erreichen
            </h2>
          </div>
          <ul className="mt-12 grid gap-4 md:grid-cols-2">
            {RESULTS.map((r) => (
              <li
                key={r}
                className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#EBF1FF' }}>
                  <TrendingUp size={16} style={{ color: accent }} />
                </div>
                <span className="text-sm leading-relaxed text-gray-700">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── 8. COACH ────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Dein Coach
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Markus Eilers
            </h2>
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
              Revenue Systems · B2B-Vertrieb
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['TEDx Speaker', 'TOP 100 Trainer', 'TOP 100 Speaker', 'Keynote Speaker'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ color: accent, borderColor: '#BBCFF5', backgroundColor: '#EBF1FF' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-10 md:grid-cols-[280px_1fr] md:items-start">
            <div className="mx-auto md:mx-0">
              <div
                className="overflow-hidden rounded-3xl"
                style={{ width: 280, height: 360, backgroundColor: '#EBF1FF' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/markus-photo.jpg"
                  alt="Markus Eilers"
                  className="h-full w-full object-cover"
                  style={{ filter: 'grayscale(100%)' }}
                />
              </div>
            </div>
            <div>
              <div className="space-y-4 text-sm leading-relaxed text-gray-700">
                <p>
                  Markus baut seit über zwei Jahrzehnten Vertriebsorganisationen
                  auf — von Start-ups bis Konzerne. Sein Schwerpunkt: wie B2B-Teams
                  im KI-Zeitalter Kund:innen wirksam überzeugen, ohne ins
                  Pitching-Klischee zu verfallen.
                </p>
                <p>
                  Aus 500+ begleiteten Gründer:innen und €50M+ aktiviertem Umsatz
                  ist die SalesMade-Methodik entstanden — das System, das hinter
                  dieser Academy steht. Dazu kommt seine Erfahrung als gefragter
                  Keynote-Speaker für modernen Vertrieb, KI im Verkauf und
                  Kundenkommunikation auf Augenhöhe.
                </p>
              </div>
              <blockquote
                className="mt-8 rounded-2xl border-l-4 px-6 py-5 italic text-gray-700"
                style={{ borderColor: accent, backgroundColor: '#EBF1FF' }}
              >
                „Die meisten Sales-Teams improvisieren. Die besten haben ein
                System — und ein gemeinsames Vokabular dafür. Genau das bauen wir
                in der Academy."
                <footer className="mt-3 text-xs font-semibold uppercase tracking-widest not-italic" style={{ color: accent }}>
                  — Markus Eilers
                </footer>
              </blockquote>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://www.linkedin.com/in/markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: accent, borderColor: '#BBCFF5' }}
                >
                  LinkedIn
                </a>
                <a
                  href="https://youtube.com/@markuseilers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ color: '#D4192B', borderColor: '#F5BBBC' }}
                >
                  YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. TOOLS ────────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Werkzeuge statt Theorie
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Frameworks, die sofort funktionieren
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              Wir statten Dein Team mit praxiserprobten Frameworks aus — klare,
              sofort anwendbare Werkzeuge von der Gestaltung effektiver
              Erstgespräche bis zum effektiven Closing.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t, i) => (
              <div key={t.title} className="rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md" style={{ borderColor: '#BBCFF5' }}>
                <div className="text-xs font-bold tracking-widest" style={{ color: accent }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-2 text-base font-bold" style={{ color: '#0D0D0B' }}>{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. COMPARISON ──────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Du hast die Wahl
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Zwei Wege. Eine Entscheidung.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-8">
              <h3 className="text-xl font-bold" style={{ color: '#0D0D0B' }}>Der harte Weg</h3>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                In der Unsicherheit selbst experimentieren, gelegentlich Erfahrungen
                mit anderen Unternehmern austauschen und durch ein unangenehmes aber
                vermutlich unvermeidbares Hire & Fire gehen. Das wird am Ende
                funktionieren, dauert zwischen{' '}
                <strong className="text-gray-900">3 und 5 Jahren</strong>. Kostet
                ein Vermögen und produziert wachsende Frustration im Team und bei
                den Eigentümern.
              </p>
            </div>
            <div className="rounded-3xl border-2 p-8" style={{ borderColor: accent, backgroundColor: '#EBF1FF' }}>
              <h3 className="text-xl font-bold" style={{ color: '#0D0D0B' }}>Der einfache Weg</h3>
              <p className="mt-4 text-sm leading-relaxed text-gray-700">
                Einmal vollständig übernehmen, was schon funktioniert und messbare,
                bessere Ergebnisse liefert.{' '}
                <strong style={{ color: accent }}>
                  Umsatzsteigerungen um 48 % in den ersten 12 Monaten sind die Regel.
                </strong>{' '}
                Damit bezahlen die Maßnahmen sich selbst.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. PLATINUM EXTRAS ────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: 'rgba(176,124,10,0.25)', color: '#FFD37A' }}
            >
              Platinum-Extras · Limitiert auf 30 Seats
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-white">
              Wenn Du es schneller willst
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-8 backdrop-blur-sm" style={{ border: '1px solid rgba(255,211,122,0.25)' }}>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FFD37A' }}>
                Exklusive Leistungen
              </div>
              <ul className="mt-6 space-y-4 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                <li className="flex items-start gap-3">
                  <Sparkles size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#FFD37A' }} />
                  Monatliche individuelle 1:1 Coaching Sessions (60 Min.) mit unseren
                  führenden SalesMade Coaches
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#FFD37A' }} />
                  Exklusive monatliche VIP-Gruppen-Session zur Vertiefung spezifischer
                  strategischer Themen
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white/5 p-8 backdrop-blur-sm" style={{ border: '1px solid rgba(255,211,122,0.25)' }}>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FFD37A' }}>
                Quantifizierte Vorteile
              </div>
              <ul className="mt-6 space-y-4 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                <li className="flex items-start gap-3">
                  <Award size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#FFD37A' }} />
                  Zusätzliche Steigerung der individuellen Verkaufs-Performance um bis
                  zu 50 %
                </li>
                <li className="flex items-start gap-3">
                  <Award size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#FFD37A' }} />
                  Schnelleres Erreichen individueller Vertriebsziele durch intensive
                  1:1-Begleitung
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              <Calendar size={16} /> Jetzt bewerben
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 12. ROI CALCULATOR ─────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Wie viel Potenzial bleibt ungenutzt?
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Rechne es selbst
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-600">
              Passe die Werte an Deine Situation an.
            </p>
          </div>
          <div className="mt-12">
            <SalesMadeRoiCalculator accent={accent} />
          </div>
        </div>
      </section>

      {/* ─── 13. GUARANTEE ──────────────────────────────────────────── */}
      <section className="px-6 py-16" style={{ backgroundColor: '#FFF1EB' }}>
        <div className="mx-auto flex max-w-3xl items-start gap-6 rounded-3xl bg-white p-8 shadow-sm">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: '#FFF1EB' }}
          >
            <Shield size={24} style={{ color: '#F05A1A' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>
              90-Tage 100 % Geld-zurück-Garantie
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Wenn Du nach 90 Tagen keine messbaren Verbesserungen in Deinen KPIs
              siehst, erstatten wir die volle Investition zurück. Keine Fragen
              gestellt.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 14. FAQ ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Häufige Fragen
          </h2>
          <div className="mt-10 space-y-4">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-colors open:bg-gray-50"
              >
                <summary
                  className="flex cursor-pointer items-center justify-between text-base font-semibold"
                  style={{ color: '#0D0D0B' }}
                >
                  {f.q}
                  <span
                    className="ml-4 text-2xl transition-transform group-open:rotate-45"
                    style={{ color: accent }}
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 15. FINAL CTA ──────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>
            Von Unsicherheit zu planbaren Umsätzen.
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-white">
            45 Minuten für Deine nächsten 36 Monate.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Wie überzeugend arbeitet Dein Team im direkten Vergleich? Unser
            unverbindlicher Benchmark kann Dir wertvolle Einblicke geben. Dein Team
            durchläuft ein realistisches Kundenszenario, in dem wir 13 entscheidende
            Sales-Skills beobachten und bewerten.
          </p>
          <Link
            href="/kontakt"
            className="mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Calendar size={16} /> Jetzt Benchmarking-Gespräch buchen <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Nur noch wenige Plätze für den Soft-Launch verfügbar.
          </p>
        </div>
      </section>

    </main>
  )
}
