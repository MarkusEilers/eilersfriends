import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getFacts, listFactKeys, addUserItems, setFactItemStatus, confirmFact, rejectFact, pendingItems,
} from '@/lib/strategy/facts'
import { splitForPrompt, visibleItems } from '@/lib/strategy/items'

export const runtime = 'nodejs'
export const maxDuration = 60

async function guard() {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) return null
  return session
}

/** Die Faktenbasis eines Kunden — Listen aufgeschluesselt nach gesetzt, offen, verworfen. */
export async function GET(req: Request) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const companyId = url.searchParams.get('companyId')
  const productId = url.searchParams.get('productId')
  const keys = url.searchParams.get('keys')?.split(',').filter(Boolean)
  if (!companyId) return NextResponse.json({ error: 'companyId ist Pflicht' }, { status: 400 })

  const [facts, keyRows] = await Promise.all([getFacts(companyId, productId, keys), listFactKeys()])
  const labels = Object.fromEntries(keyRows.map((k) => [k.key, k.label]))

  return NextResponse.json({
    ok: true,
    facts: facts.map((f) => {
      const list = Array.isArray(f.value)
      const split = list ? splitForPrompt(f.value) : null
      return {
        id: f.id, key: f.key, label: labels[f.key] ?? f.key,
        source: f.source, status: f.status, confidence: f.confidence, version: f.version,
        value: list ? visibleItems(f.value) : f.value,
        counts: split
          ? { gesetzt: split.settled.length, offen: split.open.length, verworfen: split.rejected.length }
          : null,
      }
    }),
    offen: await pendingItems(companyId, productId),
  })
}

/**
 * Eintraege bestaetigen, verwerfen oder eigene ergaenzen.
 *
 * Drei Vorgaenge an einer Stelle, weil sie dasselbe tun: sie machen aus einem
 * Vorschlag eine Entscheidung. Und Entscheidungen ueberleben jeden weiteren
 * Agent-Lauf.
 */
export async function POST(req: Request) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const userId = session.user.id ?? null

  try {
    switch (body?.action) {
      case 'item': {
        const { factId, index, status } = body
        if (!factId || typeof index !== 'number' || !['confirmed', 'rejected'].includes(status)) {
          return NextResponse.json({ error: 'factId, index und status sind Pflicht' }, { status: 400 })
        }
        return NextResponse.json({ ok: true, item: await setFactItemStatus({ factId, index, status, userId }) })
      }
      case 'fact': {
        const { factId, status } = body
        if (!factId) return NextResponse.json({ error: 'factId ist Pflicht' }, { status: 400 })
        if (status === 'rejected') await rejectFact(factId)
        else await confirmFact(factId, userId)
        return NextResponse.json({ ok: true })
      }
      case 'add': {
        const { companyId, productId, key, items } = body
        if (!companyId || !key || !Array.isArray(items) || !items.length) {
          return NextResponse.json({ error: 'companyId, key und items sind Pflicht' }, { status: 400 })
        }
        return NextResponse.json({
          ok: true,
          ...(await addUserItems({ companyId, productId: productId ?? null, key, items, userId })),
        })
      }
      default:
        return NextResponse.json({ error: "action muss 'item', 'fact' oder 'add' sein" }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
