import { Link } from '@/lib/i18n/navigation'

export const metadata = {
  title: 'Stachelbehr AG — Hochsicherheits-Schutzräume seit 1924',
  robots: { index: false, follow: false },
}

const SIMULATION_NOTICE = 'Die Stachelbehr AG ist ein simuliertes Unternehmen der SalesMade Academy.'

const STATS = [
  { v: '$ 1,4 Mrd.', l: 'Umsatz 2024' },
  { v: '12.415', l: 'Mitarbeitende' },
  { v: '12', l: 'Werke weltweit' },
  { v: '345.000 m²', l: 'Werksfläche' },
  { v: '4', l: 'Generationen' },
]

const SOLUTIONS = [
  {
    title: 'Residential',
    tagline: 'Family Suites',
    body: 'Für Eigentümer:innen hochpräsenter Liegenschaften. Nahtlos in Architektur und Smart-Home integriert. Reaktionszeit unter 14 Sekunden.',
  },
  {
    title: 'Corporate',
    tagline: 'Executive Vaults',
    body: 'Geschützte Räume für Vorstandsetagen und Krisenstäbe. Standardausstattung umfasst gefilterte Atemluft für 96 Stunden und gesicherte Kommunikation.',
  },
  {
    title: 'Government',
    tagline: 'Continuity Rooms',
    body: 'Für Ministerien, Botschaften und kritische Infrastruktur. Mehrlagige Authentifizierung. EMP- und ABC-resistent. Zertifiziert nach NATO STANAG 4569.',
  },
  {
    title: 'Maritime & Mobile',
    tagline: 'On-Vessel Citadels',
    body: 'Modular installierbar in Yachten, Privatflugzeugen und Spezialfahrzeugen. Baumustergeprüft gemäß SOLAS Ch. XI-2 und ISPS-Code.',
  },
]

const OPEN_POSITIONS = [
  { title: 'Sales Chief Brazil', loc: 'São Paulo · Vollzeit · Sofort' },
  { title: 'QM Manager China', loc: 'Shanghai · Vollzeit · Q3 2026' },
  { title: 'Senior Engineer Composite', loc: 'Solingen · Vollzeit · Sofort' },
  { title: 'Head of Operations DACH', loc: 'Solingen · Vollzeit · Q4 2026' },
]

const LOCATIONS = [
  'Solingen', 'Detroit', 'Riad', 'Singapur', 'São Paulo', 'Tokio',
  'Mailand', 'Mexiko-Stadt', 'Mumbai', 'Johannesburg', 'Shanghai', 'Sydney',
]

function SimulationBanner({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div
      style={{
        backgroundColor: '#B7560D',
        color: '#FFF8EE',
        borderTop: position === 'bottom' ? '1px solid rgba(0,0,0,0.20)' : undefined,
        borderBottom: position === 'top' ? '1px solid rgba(0,0,0,0.20)' : undefined,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-2.5 text-[11px] sm:text-xs font-medium tracking-wide flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span aria-hidden="true">⚠</span>
        <span>{SIMULATION_NOTICE}</span>
        <span style={{ opacity: 0.6 }}>·</span>
        <Link href="/salesmade" className="underline underline-offset-2 hover:no-underline">
          Was ist das?
        </Link>
      </div>
    </div>
  )
}

export default function StachelbehrPage() {
  return (
    <div style={{ backgroundColor: '#1B1F25', color: '#E9E5DC', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <SimulationBanner position="top" />

      {/* Mock corporate header */}
      <header style={{ backgroundColor: '#15181D', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <Link href="/salesmade/scenarios/stachelbehr" className="flex items-center gap-3 group">
            <div
              className="h-9 w-9 rounded-sm flex items-center justify-center font-bold text-base"
              style={{ backgroundColor: '#C8A67A', color: '#1B1F25', fontFamily: '"DM Serif Display", serif' }}
              aria-hidden="true"
            >
              S
            </div>
            <div className="leading-tight">
              <div
                className="font-bold text-base tracking-wide"
                style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
              >
                Stachelbehr
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: '#C8A67A' }}>
                Aktiengesellschaft
              </div>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-[13px]" style={{ color: '#D9D5C9' }}>
            <span className="cursor-default">Lösungen</span>
            <span className="cursor-default">Branchen</span>
            <span className="cursor-default">Innovation</span>
            <span className="cursor-default">Karriere</span>
            <span className="cursor-default">Investor Relations</span>
            <span className="cursor-default">Kontakt</span>
          </nav>
          <button
            className="hidden md:inline-flex items-center text-[11px] px-4 py-2.5 rounded-sm uppercase tracking-[0.18em]"
            style={{ backgroundColor: '#C8A67A', color: '#1B1F25', fontWeight: 600 }}
          >
            Beratung anfragen
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#15181D' }}>
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ backgroundImage: 'linear-gradient(135deg, #2D4F6B 0%, transparent 65%)', opacity: 0.30 }}
        />
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ backgroundImage: 'radial-gradient(circle at 78% 22%, rgba(200,166,122,0.12) 0%, transparent 55%)' }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-28 md:py-36">
          <div className="text-[11px] uppercase tracking-[0.3em] mb-6" style={{ color: '#C8A67A' }}>
            Seit 1924 · Solingen · Made in Germany
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-7xl leading-[1.05] max-w-4xl"
            style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
          >
            Wenn Sekunden über alles entscheiden.
          </h1>
          <p className="mt-8 text-base md:text-xl max-w-2xl leading-relaxed" style={{ color: '#C9C4B8' }}>
            Die Stachelbehr AG entwickelt und fertigt seit vier Generationen die hochwertigsten Schutzräume der Welt — für Familien, Konzerne und Regierungen, die keine zweite Chance haben.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center px-6 py-3 text-[11px] uppercase tracking-[0.18em] rounded-sm"
              style={{ backgroundColor: '#C8A67A', color: '#1B1F25', fontWeight: 600 }}
            >
              Lösungen ansehen
            </button>
            <button
              className="inline-flex items-center px-6 py-3 text-[11px] uppercase tracking-[0.18em] rounded-sm border"
              style={{ borderColor: 'rgba(242,239,233,0.30)', color: '#F2EFE9' }}
            >
              Investor Relations
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        style={{
          backgroundColor: '#1B1F25',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-8 gap-x-6">
          {STATS.map((s) => (
            <div key={s.l}>
              <div
                className="text-3xl md:text-4xl"
                style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
              >
                {s.v}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.25em]" style={{ color: '#9C9888' }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-10 mb-14 items-end">
            <div>
              <div className="text-[11px] uppercase tracking-[0.3em] mb-4" style={{ color: '#C8A67A' }}>
                Lösungen
              </div>
              <h2
                className="text-3xl md:text-5xl leading-tight"
                style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
              >
                Vier Welten. Eine Maxime.
              </h2>
            </div>
            <p className="text-base leading-relaxed max-w-xl" style={{ color: '#C9C4B8' }}>
              Jeder Schutzraum, den wir liefern, ist nach denselben kompromisslosen Standards gebaut: Stahl, Statik, Sauerstoff, Steuerung. Was sich unterscheidet, ist die Welt, für die wir bauen.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SOLUTIONS.map((c) => (
              <div
                key={c.title}
                className="rounded-sm p-7"
                style={{ backgroundColor: '#212630', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: '#C8A67A' }}>
                  {c.tagline}
                </div>
                <h3
                  className="text-xl mb-4"
                  style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
                >
                  {c.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#A8A498' }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Heritage */}
      <section
        className="py-24"
        style={{
          backgroundColor: '#15181D',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.3em] mb-4" style={{ color: '#C8A67A' }}>
              Heritage
            </div>
            <h2
              className="text-3xl md:text-5xl leading-tight"
              style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
            >
              Familienunternehmen.
              <br />
              Vier Generationen.
              <br />
              Ein Versprechen.
            </h2>
          </div>
          <div className="md:col-span-7 space-y-6 text-base leading-relaxed" style={{ color: '#C9C4B8' }}>
            <p>
              Gegründet 1924 in Solingen als Familienbetrieb für Tresorbau, ist die Stachelbehr AG heute Weltmarktführer für hochsichere Schutzräume. Die Mehrheit der Stimmrechte liegt seit 2019 bei BlackRock; die operative Leitung verbleibt in Familienhand.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 pt-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: '#9C9888' }}>
                  Operative Führung
                </div>
                <div className="text-sm" style={{ color: '#F2EFE9' }}>
                  Familie Stachelbehr (4. Generation)
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: '#9C9888' }}>
                  Stimmrechtsanteil
                </div>
                <div className="text-sm" style={{ color: '#F2EFE9' }}>
                  BlackRock 52% · Familie & Friends 48%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: '#9C9888' }}>
                  Hauptsitz
                </div>
                <div className="text-sm" style={{ color: '#F2EFE9' }}>
                  Solingen, Deutschland
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] mb-1" style={{ color: '#9C9888' }}>
                  Werke
                </div>
                <div className="text-sm" style={{ color: '#F2EFE9' }}>
                  12 Standorte · 4 Kontinente
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pull-quote */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p
            className="text-2xl md:text-4xl leading-snug"
            style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
          >
            „Wir verkaufen keine Räume. Wir verkaufen Zeit."
          </p>
          <div className="mt-6 text-[10px] uppercase tracking-[0.3em]" style={{ color: '#C8A67A' }}>
            Marko Ehlers · Finanzvorstand
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24" style={{ backgroundColor: '#15181D' }}>
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.3em] mb-4" style={{ color: '#C8A67A' }}>
              Karriere
            </div>
            <h2
              className="text-3xl md:text-5xl leading-tight"
              style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
            >
              Wir wachsen — und wir suchen.
            </h2>
            <p className="mt-4 text-base" style={{ color: '#C9C4B8' }}>
              14 offene Positionen weltweit. Im Folgenden ein Auszug.
            </p>
          </div>
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-4">
            {OPEN_POSITIONS.map((p) => (
              <div
                key={p.title}
                className="p-5 rounded-sm"
                style={{ backgroundColor: '#212630', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-base font-medium" style={{ color: '#F2EFE9' }}>
                  {p.title}
                </div>
                <div className="mt-2 text-xs" style={{ color: '#9C9888' }}>
                  {p.loc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact + Locations */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.3em] mb-4" style={{ color: '#C8A67A' }}>
              Investor Relations
            </div>
            <h2
              className="text-3xl mb-6 leading-tight"
              style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
            >
              Marko Ehlers
            </h2>
            <div className="text-sm mb-1" style={{ color: '#C9C4B8' }}>
              Finanzvorstand
            </div>
            <div className="text-sm mb-6" style={{ color: '#9C9888' }}>
              marko.ehlers@stachelbehr.example
            </div>
            <p className="text-sm leading-relaxed max-w-md" style={{ color: '#A8A498' }}>
              Anfragen rund um Geschäftsentwicklung, strategische Partnerschaften und institutionelle Investoren.
            </p>
          </div>
          <div
            className="md:col-span-7 rounded-sm"
            style={{ backgroundColor: '#212630', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="p-8">
              <div className="text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: '#9C9888' }}>
                Hauptsitz
              </div>
              <div className="text-base mb-6" style={{ color: '#F2EFE9' }}>
                Stachelbehr AG · Industriestraße 1 · 42655 Solingen · Deutschland
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: '#9C9888' }}>
                Globale Präsenz
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm" style={{ color: '#C9C4B8' }}>
                {LOCATIONS.map((loc, i) => (
                  <span key={loc}>
                    {loc}
                    {i < LOCATIONS.length - 1 && <span style={{ color: '#5A5648', marginLeft: 8 }}>·</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SimulationBanner position="bottom" />

      {/* Mock corporate footer */}
      <footer style={{ backgroundColor: '#0F1116', color: '#A8A498' }}>
        <div className="mx-auto max-w-7xl px-6 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-10 text-sm">
          <div>
            <div
              className="text-base mb-3"
              style={{ fontFamily: '"DM Serif Display", serif', color: '#F2EFE9' }}
            >
              Stachelbehr AG
            </div>
            <p className="text-xs leading-relaxed">
              Hochsicherheits-Schutzräume seit 1924. Familienunternehmen mit globaler Präsenz.
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: '#9C9888' }}>
              Lösungen
            </div>
            <ul className="space-y-2 text-xs">
              <li>Residential</li>
              <li>Corporate</li>
              <li>Government</li>
              <li>Maritime &amp; Mobile</li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: '#9C9888' }}>
              Unternehmen
            </div>
            <ul className="space-y-2 text-xs">
              <li>Heritage</li>
              <li>Karriere</li>
              <li>Investor Relations</li>
              <li>Presse</li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: '#9C9888' }}>
              Rechtliches
            </div>
            <ul className="space-y-2 text-xs">
              <li>Impressum</li>
              <li>Datenschutz</li>
              <li>AGB</li>
              <li>Compliance</li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mx-auto max-w-7xl px-6 py-5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div>© 2024 Stachelbehr AG · Industriestraße 1 · 42655 Solingen</div>
            <div style={{ color: '#9C9888' }}>
              Mock-Site — Inhalte fiktiv. Teil der SalesMade-Simulation.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
