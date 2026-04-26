import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Check, Calendar, ArrowRight, Shield, Target, Users, BookOpen,
  Cpu, MessageSquareText, GraduationCap, TrendingUp, AlertTriangle,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'SalesMade Academy — Vom Sales-Glücksspiel zum planbaren Umsatzsystem',
  description: 'Die 12-monatige AI-powered Transformation für B2B-Vertriebsteams. Von "experimentellem Freestyle" zu planbaren Umsätzen. Conversion 28 % → 60 %. Für Founders, CEOs, Owners und Investoren mit 5–50 Verkäufer:innen.',
}

const PAINS = [
  {
    icon: Users,
    title: 'Unskilled Sales-Team',
    body: 'Erstgespräche, Demos, Verhandlung, Closing — dein Team improvisiert. Jede:r macht es anders. Keine:r macht es konsistent gut.',
  },
  {
    icon: AlertTriangle,
    title: 'Random Quality',
    body: 'Ein Deal läuft brillant, der nächste verpufft. Niemand weiß, woran es lag. Skalierbar ist das nicht — und für Investoren nicht nachvollziehbar.',
  },
  {
    icon: TrendingUp,
    title: 'Unpredictable Revenue',
    body: 'Forecast ist Wunschdenken. Pipeline ist Bauchgefühl. Quartal ist Glücksspiel. Du steuerst dein Unternehmen ohne belastbare Umsatzbasis.',
  },
]

const PILLARS = [
  {
    icon: GraduationCap,
    title: 'Live-Training (90 Min/Monat)',
    body: 'Jeden Monat ein neues Skill-Modul, live mit Top-Sales-Leadern. Direkt anwendbar im nächsten Kundengespräch.',
  },
  {
    icon: MessageSquareText,
    title: 'Group-Coaching (120 Min/Monat)',
    body: 'Echte Cases aus dem Team, taktische Problemlösung. Lernen am eigenen Pipeline-Stoff statt an Lehrbuch-Beispielen.',
  },
  {
    icon: Cpu,
    title: 'AI-Tools, Playbooks & GPT-Engines',
    body: 'Custom-GPTs für Discovery-Vorbereitung, Einwand-Behandlung, Demo-Skripte und Angebot-Texte. On-the-job, nicht im Workshop-Raum.',
  },
  {
    icon: BookOpen,
    title: 'Library & Frameworks',
    body: 'Vollständige Bibliothek: Skripte, Templates, E-Mails, Decks. Sofort einsatzfähig — oder per AI auf deinen Kontext angepasst.',
  },
  {
    icon: Users,
    title: 'Community erfahrener Sales-Leader',
    body: 'Peer-Sparring mit anderen Founder:innen, CEOs und Sales-Verantwortlichen. Du bist nicht der/die Einzige mit deinem Problem.',
  },
  {
    icon: Target,
    title: '1:1 Sparring (Premium)',
    body: 'Monatliche 60-Min-Session mit einem SalesMade-Coach. Auf deinem Account, deinen Deals, deinen Zahlen. Bis zu +50 % zusätzliche Performance.',
  },
]

const OUTCOMES = [
  { value: '28% → 60%', label: 'Conversion in Discovery Calls' },
  { value: '+48–280%', label: 'höhere Umsätze pro Seller' },
  { value: '−38%', label: 'kürzerer Verkaufszyklus' },
  { value: '+30%', label: 'mehr Effizienz & Qualität in Vertriebs-Calls' },
]

const FAQ = [
  {
    q: 'Für wen ist die Academy geeignet?',
    a: 'Founders, CEOs, Owners und Investoren, die ein B2B-Vertriebsteam mit 5–50 Verkäufer:innen führen oder verantworten — und denen Umsatz, Forecast-Treue und Team-Skill systematisch wichtig genug sind, um zu investieren.',
  },
  {
    q: 'Was unterscheidet die Academy von klassischen Trainings?',
    a: '6-tägige Classroom-Trainings sind out — und aus guten Gründen. Die SalesMade Academy ist eine digitale, AI-powered Plattform mit persönlichem Sparring durch erfahrene Sales-Leader. Wir holen jedes Teammitglied dort ab, wo es heute steht, und führen es monatlich schrittweise durch die passenden Skills. On-the-job, nicht im Workshop-Raum.',
  },
  {
    q: 'Wie viel Zeit muss mein Team investieren?',
    a: '12 Monate. 90 Minuten Live-Training pro Monat, 120 Minuten Group-Coaching, plus selbstgesteuertes Lernen mit Library & AI-Tools. Inhalte sind praxisnah und direkt im Tagesgeschäft anwendbar.',
  },
  {
    q: 'Können einzelne Verkäufer:innen teilnehmen oder nur das ganze Team?',
    a: 'Beides ist möglich. Die besten Ergebnisse zeigen sich, wenn das gesamte Team gemeinsam trainiert wird — so entsteht eine einheitliche Verkaufssprache und -methodik im Unternehmen.',
  },
  {
    q: 'Wie funktioniert der Einstieg?',
    a: 'Mit einem unverbindlichen Benchmarking-Gespräch. Dein Team durchläuft ein realistisches Kundenszenario — wir beobachten und bewerten 13 entscheidende Sales-Skills. Du bekommst einen klaren Status-Quo und einen konkreten Entwicklungsvorschlag.',
  },
  {
    q: 'Was ist die Garantie?',
    a: '100 % Geld-zurück-Garantie. Wenn du nach 90 Tagen keine messbaren Verbesserungen in deinen KPIs siehst, erstatten wir die volle Investition zurück. Keine Fragen gestellt.',
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
            12 Monate · AI-powered · On-the-Job
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Vom Sales-Glücksspiel<br />
            <span style={{ color: accent }}>zum planbaren Umsatzsystem.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Die SalesMade Academy ist kein Seminar. Es ist ein 12-monatiges
            Transformationsprogramm, das Deine Verkäufer:innen zu unverzichtbaren
            Sparringspartnern für Deine Kunden macht — mit AI, Live-Coaching, Library
            und Community.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              <Calendar size={16} /> Benchmarking-Gespräch buchen <ArrowRight size={16} />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              So funktioniert die Academy
            </a>
          </div>
          <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            45 Min · Kein Pitch · Konkreter Skill-Status für dein Team
          </p>
        </div>
      </section>

      {/* ─── AUTHORITY STRIP ─────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 text-center sm:grid-cols-3">
          <div>
            <div className="text-3xl font-bold" style={{ color: accent }}>500+</div>
            <div className="mt-1 text-sm text-gray-500">Gründer:innen begleitet</div>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: accent }}>€50M+</div>
            <div className="mt-1 text-sm text-gray-500">aktivierter Umsatz</div>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: accent }}>5–50</div>
            <div className="mt-1 text-sm text-gray-500">Verkäufer:innen pro Team</div>
          </div>
        </div>
      </section>

      {/* ─── PAIN ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Die unsichtbare Krise im B2B-Vertrieb
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Aufmerksamkeit, Gespräche, Angebote — alles experimenteller Freestyle.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              Du verantwortest den Umsatz. Aber drei Probleme machen ihn jeden Monat
              zur Wundertüte:
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PAINS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#EBF1FF' }}
                >
                  <Icon size={20} style={{ color: accent }} />
                </div>
                <h3 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VISION ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
            Wie es sich anfühlt, wenn das System steht
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
            Ein selbstsicheres, gut trainiertes Sales-Team.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-700">
            Schlaues Infotainment auf Augenhöhe — das Kunden zu gut informierten
            Entscheidungen inspiriert. Planbare, vorhersehbare Umsätze. Höhere
            Auftragsvolumen. Ein Forecast, dem dein Board glauben kann.
          </p>
        </div>
      </section>

      {/* ─── 6 SÄULEN / WAS DU BEKOMMST ──────────────────────────────── */}
      <section id="how" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>So funktioniert die Academy</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Sechs Säulen, ein Transformationssystem
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              6-tägige Classroom-Trainings sind out. Die SalesMade Academy ist eine
              digitale, AI-powered Plattform mit persönlichem Sparring — die jedes
              Teammitglied dort abholt, wo es heute steht.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md"
                style={{ borderColor: '#BBCFF5' }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: '#EBF1FF' }}
                >
                  <Icon size={20} style={{ color: accent }} />
                </div>
                <h3 className="text-base font-bold" style={{ color: '#0D0D0B' }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 13 SKILLS-FRAME ─────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#93B8F5' }}>
            Der Lehrplan
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-white">
            13 entscheidende Sales-Skills.<br />
            <span style={{ color: accent }}>Beobachtet. Bewertet. Trainiert.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Im Benchmarking-Gespräch durchläuft dein Team ein realistisches
            Kundenszenario. Wir beobachten und bewerten 13 Skills entlang der
            gesamten Customer Journey — von Bedarfsanalyse über Demo, Einwand-
            Behandlung bis Closing. Daraus entsteht für jeden Seller ein
            maßgeschneiderter Entwicklungsplan mit Szenarien in 5 Schwierigkeitsstufen.
          </p>
          <Link
            href="/kontakt"
            className="mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Calendar size={16} /> Benchmarking-Gespräch sichern
          </Link>
        </div>
      </section>

      {/* ─── OUTCOMES / KPIs ─────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Belastbare Outcomes
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Das passiert mit deinen Zahlen
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-600">
              Durchschnittswerte unserer Kunden nach 12 Monaten. Keine Versprechen —
              Erfahrungswerte aus 500+ Begleitungen.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {OUTCOMES.map(({ value, label }) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
                <div className="text-3xl font-bold" style={{ color: accent }}>{value}</div>
                <div className="mt-2 text-sm text-gray-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COACH ───────────────────────────────────────────────────── */}
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
              Revenue Systems · B2B-Vertrieb · Keynote Speaker
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-[280px_1fr] md:items-start">
            {/* Photo */}
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

            {/* Bio + Quote */}
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

            {/* ─── PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
              Soft-Launch · Limitierte Plätze
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Bewirb Dich auf einen Platz
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              Wir starten klein und arbeiten persönlich. Erzähl uns von Deinem Team —
              wir entscheiden gemeinsam, ob die Academy oder Premium der richtige
              Einstieg ist.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">

            {/* Academy */}
            <div className="rounded-3xl border border-gray-200 bg-white p-8">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Standard</div>
              <h3 className="mt-2 text-2xl font-bold" style={{ color: '#0D0D0B' }}>SalesMade Academy</h3>
              <div className="mt-4 flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 w-fit">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#F05A1A' }} />
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Soft-Launch · Limitierte Plätze</span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Das vollständige 12-Monate-Programm für dein Sales-Team. Live-Training,
                Group-Coaching, AI-Tools, Library, Community.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  '12 × monatliche 90-Min-Live-Trainings',
                  '12 × monatliche 120-Min-Group-Coaching',
                  'AI-Tools, Playbooks & Custom-GPT-Engines',
                  'Vollständige Library: Skripte, Templates, Decks',
                  'Community erfahrener Sales-Leader',
                  'Skill-Benchmark + persönlicher Entwicklungsplan',
                ].map((f) => (
                  <li key={f} className="flex gap-3 text-sm text-gray-700">
                    <Check size={18} className="flex-shrink-0" style={{ color: accent }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/kontakt"
                className="mt-8 block w-full rounded-full border-2 px-6 py-3 text-center text-sm font-semibold transition-colors"
                style={{ color: accent, borderColor: accent }}
              >
                Jetzt bewerben
              </Link>
            </div>

            {/* Premium */}
            <div className="relative rounded-3xl p-8 text-white shadow-xl" style={{ backgroundColor: accent }}>
              <span
                className="absolute -top-3 right-6 rounded-full bg-white px-3 py-1 text-xs font-bold tracking-widest"
                style={{ color: accent }}
              >
                Empfohlen
              </span>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
                + 1:1 Sparring
              </div>
              <h3 className="mt-2 text-2xl font-bold">SalesMade Premium</h3>
              <div className="mt-4 flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.85)' }}>Premium-Tier · Bewerbung erforderlich</span>
              </div>
              <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Academy + monatliche 60-Min-1:1-Sparringsessions mit einem
                SalesMade-Coach. Auf deinen Accounts, deinen Deals, deinen Zahlen.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Alles aus Academy',
                  '12 × 60-Min-1:1 mit SalesMade-Coach',
                  'Persönliche Pipeline- & Account-Reviews',
                  'Live-Review von Discovery-Calls & Demos',
                  'Bis zu +50 % zusätzliche individuelle Performance',
                  'Direkter Zugang zu Sparring zwischen Sessions',
                ].map((f) => (
                  <li key={f} className="flex gap-3 text-sm">
                    <Check size={18} className="flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/kontakt"
                className="mt-8 block w-full rounded-full bg-white px-6 py-3 text-center text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ color: accent }}
              >
                Jetzt bewerben
              </Link>
            </div>

          </div>
          <p className="mt-8 text-center text-xs text-gray-500">
            Konditionen werden im Bewerbungsgespräch transparent gemacht und auf
            Team-Größe (5–50 Seller) abgestimmt.
          </p>
        </div>
      </section>

      {/* ─── GUARANTEE ───────────────────────────────────────────────── */}
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
              90-Tage Transformations-Garantie
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Wir bieten eine 100 % Geld-zurück-Garantie. Wenn du nach 90 Tagen keine
              messbaren Verbesserungen in deinen KPIs siehst, erstatten wir die volle
              Investition zurück. Keine Fragen gestellt.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────── */}
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

      {/* ─── FINAL CTA ───────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: navy }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">
            Wie überzeugend arbeitet dein Team — wirklich?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Das unverbindliche Benchmarking-Gespräch zeigt dir den ehrlichen
            Skill-Status deines Teams entlang von 13 Sales-Skills. Daraus entsteht
            ein konkreter Entwicklungsvorschlag — ohne Pitch.
          </p>
          <Link
            href="/kontakt"
            className="mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Calendar size={16} /> Benchmarking-Gespräch buchen <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Kostenlos · Kein Pitch · Konkreter Skill-Status für dein Team
          </p>
        </div>
      </section>

    </main>
  )
}
