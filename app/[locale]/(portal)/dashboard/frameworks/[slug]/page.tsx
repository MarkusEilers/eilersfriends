import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureWizardTables } from '@/lib/db/self-heal'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

const B2B_STEPS = [
  { voice: 'Beef-Radar', title: 'Inhalte → Value → Impact', why: 'Pro Baustein: direkter Effekt, Wellen-Effekt, messbarer Impact.' },
  { voice: 'Doppelschmerz', title: 'Heute & Morgen', why: 'Welche Probleme löst dein Angebot heute — welche kommen in 12-24 Monaten.' },
  { voice: 'Sichtbarer Pfad', title: 'Bulletproof Delivery Plan', why: '3-5 benannte Phasen, jede mit Input/Output/Dauer.' },
  { voice: 'Phasen-Währung', title: 'Currency pro Phase', why: 'Hauptwährung mit Baseline + Drei-Punkt-Korridor + Mess-Zeitpunkt.' },
  { voice: 'Beweis-Stapel', title: 'ROI-Hypothesen oder Beweise', why: '3-7 Beweise nach Klassen A-E, mindestens 2 aus A oder B im Top-3.' },
  { voice: 'Booster', title: 'Adjacent Pain mit Anker', why: '1-3 Booster, echter Lieferaufwand ≤ 20 % des wahrgenommenen Werts.' },
  { voice: 'Wort-Garantie', title: 'Verteidigbare Garantie', why: 'Typ + Trigger + Konsequenz + Liefer-Anker + Espresso-Test.' },
  { voice: 'Die letzten 20 %', title: 'Name + Headline + CTA', why: 'Drei Mikro-Entscheidungen, die das Angebot lesbar machen.' },
]

interface Row { current_step: number; progress: number; status: string; started_at: Date; step_answers: Record<string, unknown> | null }

export default async function FrameworkWizardPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  if (slug !== 'b2b-angebote') notFound()

  await ensureWizardTables()

  // Load or create state
  const userId = session.user.id
  const existing = (await db.execute(sql`
    SELECT current_step, progress, status, started_at, step_answers
    FROM user_framework_state
    WHERE user_id = ${userId} AND framework_slug = ${slug}
    LIMIT 1
  `)) as unknown as Row[]
  let row: Row
  if (existing.length === 0) {
    await db.execute(sql`
      INSERT INTO user_framework_state (user_id, framework_slug, current_step, progress, status)
      VALUES (${userId}, ${slug}, 0, 0, 'active')
      ON CONFLICT (user_id, framework_slug) DO NOTHING
    `)
    row = { current_step: 0, progress: 0, status: 'active', started_at: new Date(), step_answers: {} }
  } else {
    row = existing[0]
  }

  const answers = (row.step_answers ?? {}) as Record<string, unknown>
  const stepsCompleted = Object.keys(answers).length

  return (
    <div>
      <div className="mb-6">
        <Link href={'/dashboard/frameworks' as '/'} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900">
          <ArrowLeft size={12} /> Meine Frameworks
        </Link>
      </div>

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>SalesMade · Pillar-Asset</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Der Bauplan für unwiderstehliche B2B-Angebote</h1>
        <p className="mt-1 text-sm text-gray-600">
          Acht Schritte, vier Stunden, ein verteidigbares B2B-Angebot. Du kannst pausieren und jederzeit weitermachen.
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Dein Fortschritt</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{stepsCompleted} / 8 Schritte</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-blue-700">
            <Clock size={14} /> Gestartet {new Date(row.started_at).toLocaleDateString('de-DE')}
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-blue-100">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.round((stepsCompleted / 8) * 100)}%` }} />
        </div>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2">
        {B2B_STEPS.map((s, i) => {
          const done = answers[String(i)] != null
          const current = !done && i === stepsCompleted
          return (
            <li key={i} className={`rounded-2xl border p-5 ${current ? 'border-blue-400 bg-white shadow-sm' : done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${done ? 'bg-green-600 text-white' : current ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {done ? <CheckCircle2 size={16} /> : String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>{s.voice}</p>
                    <p className="text-sm font-bold text-gray-900">{s.title}</p>
                  </div>
                </div>
                {current && <Sparkles size={16} className="text-blue-500" />}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-600">{s.why}</p>
              <div className="mt-4">
                {done ? (
                  <span className="text-xs font-semibold text-green-700">✓ Abgeschlossen</span>
                ) : current ? (
                  <button disabled className="rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white opacity-90">
                    Hier weitermachen — Wizard-UI kommt nach
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Wird freigeschaltet nach Schritt {i}</span>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-800">Beta-Hinweis</p>
        <p className="mt-1 text-sm text-amber-900">
          Du siehst gerade die Struktur deines Wizards. Die interaktive Step-by-Step-Eingabe (mit AI-Begleitung + Beispielen + Speichern) rollen wir in den nächsten Tagen schrittweise frei. Dein Fortschritt wird ab jetzt schon gespeichert.
        </p>
      </div>
    </div>
  )
}
