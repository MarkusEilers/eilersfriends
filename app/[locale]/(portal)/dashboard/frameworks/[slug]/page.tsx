import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureWizardTables } from '@/lib/db/self-heal'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { BeefRadarStep } from '@/components/wizard/BeefRadarStep'

export const dynamic = 'force-dynamic'

const B2B_STEPS = [
  { key: '01-beef-radar', voice: 'Beef-Radar', title: 'Inhalte → Value → Impact', why: 'WAS · WIE · WARUM pro Baustein.' },
  { key: '02-doppelschmerz', voice: 'Doppelschmerz', title: 'Heute & Morgen', why: 'Pflaster + Strecke. Heute löst, morgen vorausgesehen.' },
  { key: '03-sichtbarer-pfad', voice: 'Sichtbarer Pfad', title: 'Bulletproof Delivery Plan', why: '3-5 benannte Phasen mit Input/Output/Dauer.' },
  { key: '04-phasen-waehrung', voice: 'Phasen-Währung', title: 'Currency pro Phase', why: 'Baseline + Pessimist/Realist/Optimist + Mess-Zeitpunkt.' },
  { key: '05-beweis-stapel', voice: 'Beweis-Stapel', title: 'ROI-Beweise A-E', why: '3-7 Beweise nach Klassen, mind. 2 aus A oder B im Top-3.' },
  { key: '06-booster', voice: 'Booster', title: 'Adjacent Pain mit Anker', why: '1-3 Booster, Lieferaufwand ≤ 20% Wert.' },
  { key: '07-wort-garantie', voice: 'Wort-Garantie', title: 'Verteidigbare Garantie', why: 'Typ + Trigger + Konsequenz + Anker + Espresso-Test.' },
  { key: '08-letzten-20-prozent', voice: 'Die letzten 20 %', title: 'Name + Headline + CTA', why: 'Drei Mikro-Entscheidungen zum Schluss.' },
]

interface Row { current_step: number; progress: number; status: string; started_at: Date; step_answers: Record<string, unknown> | null }

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  if (r && typeof r === 'object' && 'rows' in r) {
    const x = (r as { rows: unknown }).rows
    if (Array.isArray(x)) return x as T[]
  }
  return []
}

export default async function FrameworkWizardPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')
  if (slug !== 'b2b-angebote') notFound()

  await ensureWizardTables()
  const userId = session.user.id
  await db.execute(sql`
    INSERT INTO user_framework_state (user_id, framework_slug, current_step, progress, status)
    VALUES (${userId}, ${slug}, 0, 0, 'active')
    ON CONFLICT (user_id, framework_slug) DO NOTHING
  `)
  const result = await db.execute(sql`
    SELECT current_step, progress, status, started_at, step_answers
    FROM user_framework_state
    WHERE user_id = ${userId} AND framework_slug = ${slug}
    LIMIT 1
  `)
  const rows = rowsOf<Row>(result)
  const row = rows[0] ?? { current_step: 0, progress: 0, status: 'active', started_at: new Date(), step_answers: {} }
  const answers = (row.step_answers ?? {}) as Record<string, unknown>
  const stepsCompleted = Object.keys(answers).length

  const beefAnswers = answers['01-beef-radar'] as
    | { cards?: { column: 'what'|'how'|'why'; text: string; detail?: string }[]; offerDescription?: string; icpSnapshot?: string; pricingRange?: string }
    | undefined

  return (
    <div>
      <div className="mb-6">
        <Link href={'/dashboard/frameworks' as '/'} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900">
          <ArrowLeft size={12} /> Meine Frameworks
        </Link>
      </div>

      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>SalesMade · Pillar-Asset</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Der Bauplan für unwiderstehliche B2B-Angebote</h1>
        <p className="mt-1 text-sm text-gray-600">
          Acht Schritte, vier Stunden, ein verteidigbares B2B-Angebot. Pausieren und weitermachen jederzeit.
        </p>
      </header>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Dein Fortschritt</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{stepsCompleted} / {B2B_STEPS.length} Schritte</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-blue-700">
            <Clock size={14} /> Gestartet {new Date(row.started_at).toLocaleDateString('de-DE')}
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-blue-100">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.round((stepsCompleted / B2B_STEPS.length) * 100)}%` }} />
        </div>
      </div>

      {/* Step 1 — interactive */}
      <section className="mb-10">
        <BeefRadarStep initialAnswers={beefAnswers} />
      </section>

      {/* Other steps — locked until Push B */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Folge-Schritte</h3>
        <ol className="grid gap-3 sm:grid-cols-2">
          {B2B_STEPS.slice(1).map((s, i) => {
            const stepIdx = i + 1
            const done = answers[s.key] != null
            return (
              <li key={s.key} className={`rounded-2xl border p-4 ${done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${done ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {done ? <CheckCircle2 size={16} /> : String(stepIdx + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1A5FD4' }}>{s.voice}</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{s.title}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600">{s.why}</p>
                <p className="mt-2 text-[11px] italic text-gray-400">
                  Interaktive Eingabe für diesen Schritt rollen wir im nächsten Update frei. Edge-Route + Prompt sind schon angelegt.
                </p>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
