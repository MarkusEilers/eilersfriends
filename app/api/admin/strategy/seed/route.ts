import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ensureStrategySchema, seedStrategySteps, listSteps } from '@/lib/db/queries/strategy'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Legt das Strategie-Schema an und seedet den Schritt-Katalog (idempotent). */
export async function POST() {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    await ensureStrategySchema()
    await seedStrategySteps()
    const steps = await listSteps()
    return NextResponse.json({
      ok: true,
      steps: steps.length,
      company: steps.filter((s) => s.scope === 'company').length,
      product: steps.filter((s) => s.scope === 'product').length,
      keys: steps.map((s) => s.key),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    await ensureStrategySchema()
    const steps = await listSteps()
    return NextResponse.json({ ok: true, steps })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
