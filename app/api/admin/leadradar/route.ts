import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { leadsFor, summaryFor, addLead } from '@/lib/leadradar/queries'
import { rescoreAll } from '@/lib/leadradar/scoring'

export const runtime = 'nodejs'
export const maxDuration = 60

async function guard() {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'admin' && role !== 'coach') return null
  return session
}

/** Leads und Zusammenfassung fuer die Karte. */
export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const companyId = url.searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId ist Pflicht' }, { status: 400 })
  const hours = Number(url.searchParams.get('hours') ?? 24 * 30)

  const [leads, summary] = await Promise.all([
    leadsFor(companyId, { hours, rating: url.searchParams.get('rating') }),
    summaryFor(companyId),
  ])
  return NextResponse.json({ ok: true, leads, summary, generatedAt: new Date().toISOString() })
}

/** Einen Lead aufnehmen — der Weg, den die Sammler spaeter nehmen. */
export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body?.companyId || !body?.orgName || body?.lat == null || body?.lon == null) {
    return NextResponse.json({ error: 'companyId, orgName, lat und lon sind Pflicht' }, { status: 400 })
  }
  const id = await addLead(body)
  return NextResponse.json({ ok: true, id, duplicate: id === null })
}

/** Nach einer Gewichtsaenderung alles neu bewerten. */
export async function PATCH(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { companyId } = (await req.json().catch(() => ({}))) ?? {}
  if (!companyId) return NextResponse.json({ error: 'companyId ist Pflicht' }, { status: 400 })
  return NextResponse.json({ ok: true, rescored: await rescoreAll(companyId) })
}
