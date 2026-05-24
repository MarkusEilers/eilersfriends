import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { ensureWizardTables } from '@/lib/db/self-heal'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { WizardAccordion } from '@/components/wizard/WizardAccordion'

export const dynamic = 'force-dynamic'

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

      <WizardAccordion answers={answers} stepsCompleted={stepsCompleted} />
    </div>
  )
}
