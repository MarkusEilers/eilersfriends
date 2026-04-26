import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Calendar, ArrowRight, Shield, Zap, Users, BarChart3, Target, Compass } from 'lucide-react'

export const metadata: Metadata = {
  title: 'SalesMade Academy — 12 Monate, 13 Werkzeuge für planbares B2B-Wachstum',
  description: 'Das systematische Vertriebs-Programm für B2B-Gründer:innen. 12 Monate. 13 Werkzeuge. Planbarer Umsatz statt Hoffnungsverkauf. 30-Tage Geld-zurück-Garantie.',
}

const TOOLS = [
  { num: '01', title: 'ICP & Pain-Map', body: 'Wen du wirklich bedienst — und welcher Schmerz dein Angebot zieht.' },
  { num: '02', title: 'Value-Pyramid', body: 'Vom Feature zum Outcome. Was Kunden wirklich kaufen.' },
  { num: '03', title: 'Offer-Stack', body: 'Dein Hauptangebot + Bonus + Garantie als Paket.' },
  { num: '04', title: 'Pricing-Anker', body: 'Preise, die Wert kommunizieren statt Rabatt zu erfordern.' },
  { num: '05', title: 'Proof-Stack', body: 'Case Studies, Zahlen, Stimmen — strukturiert, nicht zufällig.' },
  { num: '06', title: 'Outbound-System', body: 'Replizierbarer Pipeline-Aufbau. Kein Glücksspiel.' },
  { num: '07', title: 'Discovery-Call-Frame', body: 'Das Gespräch, das Kunden qualifiziert statt überredet.' },
  { num: '08', title: 'Demo / Walkthrough', body: 'Demos, die verkaufen — ohne Feature-Dumping.' },
  { num: '09', title: 'Angebots-Präsentation', body: 'Vom Pitch-Deck zum Entscheidungs-Dokument.' },
  { num: '10', title: 'Verhandlung & Closing', body: 'Standhaft im Preis. Klar bei Bedingungen.' },
  { num: '11', title: 'Follow-Up & Nurture', body: '80% der Deals entstehen nach Nein-2. Hier ist dein System.' },
  { num: '12', title: 'Account-Expansion', body: 'Bestandskunden ausbauen statt ständig neue jagen.' },
  { num: '13', title: 'Sales-Ops & KPIs', body: 'Was du misst, kannst du steuern. Pipeline, Conversion, ACV.' },
]

const TESTIMONIALS = [
  {
    quote: 'Wir dachten, wir bräuchten mehr Leads. Wir brauchten ein System. Jetzt schließt unser Team Deals, die ich früher selbst machen musste.',
    name: 'Female Founder',
    role: 'Series A B2B SaaS',
  },
  {
    quote: 'Vor SalesMade war Vertrieb bei mir Bauchgefühl. Heute ist es ein Prozess, den ich erklären, übergeben und skalieren kann.',
    name: 'Co-Founder',
    role: 'Industrial Tech Scaleup',
  },
  {
    quote: 'Markus zeigt nicht „wie verkaufen", er zeigt wie man ein Vertriebssystem baut. Das ist ein Unterschied wie Tag und Nacht.',
    name: 'Managing Director',
    role: 'B2B Services',
  },
]

const FAQ = [
  {
    q: 'Für wen ist die Academy gedacht?',
    a: 'B2B-Gründer:innen und Sales-Verantwortliche im Umsatzbereich €500k–€10M, die wiederholbaren Vertrieb aufbauen wollen — typischerweise Founder, die noch zu viel selbst verkaufen, oder Sales-Leads, die ohne System ramp-en.',
  },
  {
    q: 'Was ist der Unterschied zwischen Academy und Premium?',
    a: 'Academy ist das vollständige Self-Paced-Programm mit allen 13 Werkzeugen, Worksheets, Templates und Community. Premium fügt monatliche 1:1-Sparringsessions mit Markus, individuelles Account-Audit und priorisierten Support hinzu.',
  },
  {
    q: 'Wie viel Zeit muss ich pro Woche investieren?',
    a: 'Plan: 2–3 Stunden Lernen + 2–3 Stunden Umsetzung pro Woche. Wer mehr Geschwindigkeit will, geht schneller durch die Module. Alle Inhalte bleiben dauerhaft verfügbar.',
  },
  {
    q: 'Was, wenn es nichts für mich ist?',
    a: 'Du hast 30 Tage volle Geld-zurück-Garantie. Schreib uns innerhalb der ersten 30 Tage, du bekommst 100 % zurück — keine Rückfragen.',
  },
]

export default function SalesMadePage() {
  const accent = '#1A5FD4'

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-28" style={{ backgroundColor: '#0F1E3A' }}>
        <div className="mx-auto max-w-4xl text-center">
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
            style={{ backgroundColor: 'rgba(26,95,212,0.25)', color: '#93B8F5' }}
          >
            SalesMade Academy · Kohorte 27. Mai 2026
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            12 Monate. 13 Werkzeuge.<br />
            <span style={{ color: accent }}>Planbarer B2B-Umsatz.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Dein Unternehmen ist mit Energie gewachsen. Energie skaliert nicht endlos —
            ein funktionierendes System schon. SalesMade ist der strukturierte Weg
            vom Hoffnungs-Vertrieb zum planbaren Umsatzsystem.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              Plätze sichern <ArrowRight size={16} />
            </a>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Calendar size={16} /> Strategie-Gespräch buchen
            </Link>
          </div>
          <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            30-Tage Geld-zurück-Garantie · Keine Vorabzahlung über 50 % · DE/EN-Sprache
          </p>
        </div>
      </section>

      {/* ─── AUTHORITY ───────────────────────────────────────────────── */}
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
            <div className="text-3xl font-bold" style={{ color: accent }}>12 Monate</div>
            <div className="mt-1 text-sm text-gray-500">geführter Aufbau</div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Warum jetzt</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Wachstum hat Nebenwirkungen.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="text-sm font-bold" style={{ color: accent }}>€1–3M Umsatz</div>
              <h3 className="mt-2 text-lg font-bold" style={{ color: '#0D0D0B' }}>Der unsichtbare Preis</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Dein LinkedIn sagt Erfolg. Dein Bauchgefühl sagt: irgendwas stimmt nicht.
                Du triffst 47 Entscheidungen am Tag und fragst Dich abends, ob das so weitergehen kann.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="text-sm font-bold" style={{ color: accent }}>€10M+ Umsatz</div>
              <h3 className="mt-2 text-lg font-bold" style={{ color: '#0D0D0B' }}>Das Chaos wächst mit</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Die Zahlen stimmen. Aber unter der Oberfläche: Zu viele Baustellen, zu wenig
                Struktur. Deine besten Leute spüren das. Du auch. Irgendwo muss der Hebel sein.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 13 WERKZEUGE ────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#EBF1FF' }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Der Lehrplan</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              13 Werkzeuge, ein System
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600">
              Kein Theorie-Kurs. Jedes Werkzeug ist ein konkreter Baustein, den du baust,
              testest und im echten Vertriebs-Alltag einsetzt.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => (
              <div key={t.num} className="rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md" style={{ borderColor: '#BBCFF5' }}>
                <div className="text-xs font-bold tracking-widest" style={{ color: accent }}>{t.num}</div>
                <h3 className="mt-2 text-base font-bold" style={{ color: '#0D0D0B' }}>{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Was Gründer:innen sagen</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Du bist in guter Gesellschaft
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="rounded-2xl border border-gray-100 bg-white p-6">
                <blockquote className="text-sm leading-relaxed text-gray-700">„{t.quote}"</blockquote>
                <figcaption className="mt-4 border-t border-gray-100 pt-4">
                  <div className="text-sm font-bold" style={{ color: '#0D0D0B' }}>{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Investiere in dein System</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#0D0D0B' }}>
              Zwei Wege in dieselbe Richtung
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">

            {/* Academy */}
            <div className="rounded-3xl border border-gray-200 bg-white p-8">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Self-Paced</div>
              <h3 className="mt-2 text-2xl font-bold" style={{ color: '#0D0D0B' }}>SalesMade Academy</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold" style={{ color: '#0D0D0B' }}>€1.997</span>
                <span className="text-sm text-gray-400">einmalig · netto</span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Das komplette Programm, in deinem Tempo. Ideal für Gründer:innen,
                die selbstständig durch das System gehen wollen.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Alle 13 Werkzeuge mit Video-Modulen',
                  '100+ Worksheets, Templates & Skripte',
                  '12 Monate Zugriff auf Inhalte + Updates',
                  'Community-Forum mit Peer-Reviews',
                  'Monatlicher Live-Group-Q&A mit dem Coach-Team',
                ].map((f) => (
                  <li key={f} className="flex gap-3 text-sm text-gray-700">
                    <Check size={18} className="flex-shrink-0" style={{ color: accent }} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://buy.stripe.com/eilersfriends/academy"
                className="mt-8 block w-full rounded-full border-2 px-6 py-3 text-center text-sm font-semibold transition-colors"
                style={{ color: accent, borderColor: accent }}
              >
                Academy buchen
              </a>
            </div>

            {/* Premium */}
            <div className="relative rounded-3xl p-8 text-white shadow-xl" style={{ backgroundColor: accent }}>
              <span className="absolute -top-3 right-6 rounded-full bg-white px-3 py-1 text-xs font-bold tracking-widest" style={{ color: accent }}>
                Empfohlen
              </span>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>1:1 Coaching</div>
              <h3 className="mt-2 text-2xl font-bold">SalesMade Premium</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold">€5.485</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>einmalig · netto</span>
              </div>
              <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Academy + monatliche 1:1-Sparringsession mit Markus, Account-Audit und
                priorisierter Support. Für Gründer:innen, die schneller Ergebnisse wollen.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Alles aus Academy',
                  '12× 60-min 1:1 mit Markus Eilers',
                  'Persönliches Pipeline- & Angebot-Audit',
                  'Live-Review deines Discovery-Call & Demo',
                  'Direkter Slack-Channel für 12 Monate',
                  'Aufnahme in Founder-Mastermind-Calls',
                ].map((f) => (
                  <li key={f} className="flex gap-3 text-sm">
                    <Check size={18} className="flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://buy.stripe.com/eilersfriends/premium"
                className="mt-8 block w-full rounded-full bg-white px-6 py-3 text-center text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ color: accent }}
              >
                Premium-Platz reservieren
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ─── GUARANTEE ───────────────────────────────────────────────── */}
      <section className="px-6 py-16" style={{ backgroundColor: '#FFF1EB' }}>
        <div className="mx-auto flex max-w-3xl items-start gap-6 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#FFF1EB' }}>
            <Shield size={24} style={{ color: '#F05A1A' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#0D0D0B' }}>30-Tage Geld-zurück-Garantie</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Geh die ersten 30 Tage durch das Programm. Wenn du den Wert nicht siehst,
              schreib uns eine Mail — du bekommst 100 % zurück. Keine Rückfragen, keine Bedingungen.
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
              <details key={i} className="group rounded-2xl border border-gray-100 bg-white p-6 transition-colors open:bg-gray-50">
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold" style={{ color: '#0D0D0B' }}>
                  {f.q}
                  <span className="ml-4 text-2xl transition-transform group-open:rotate-45" style={{ color: accent }}>+</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#0F1E3A' }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl text-white">
            Lass uns herausfinden, wo Du stehst.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            45 Minuten. Kein Pitch. Nur ein ehrliches Gespräch darüber, was bei Dir
            gerade wirklich los ist — und ob SalesMade für dich passt.
          </p>
          <Link
            href="/kontakt"
            className="mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            <Calendar size={16} /> Strategie-Gespräch buchen <ArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Kostenlos · Kein Verkaufsgespräch · Nur Klarheit
          </p>
        </div>
      </section>

    </main>
  )
}
