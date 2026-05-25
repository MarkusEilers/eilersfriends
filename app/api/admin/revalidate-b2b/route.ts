import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'

const SEED_TOKEN = process.env.SEED_TOKEN

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!SEED_TOKEN || token !== SEED_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Revalidate the marketing pages that pull from DB content
  revalidatePath('/b2b-offers')
  revalidatePath('/en/b2b-offers')
  revalidatePath('/es/b2b-offers')
  revalidatePath('/frameworks/b2b-angebote')
  return NextResponse.json({ ok: true, revalidated: ['/b2b-offers', '/en/b2b-offers', '/es/b2b-offers', '/frameworks/b2b-angebote'] })
}
