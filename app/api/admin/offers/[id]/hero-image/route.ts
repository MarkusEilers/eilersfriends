import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getOfferById, updateOffer } from '@/lib/db/queries/offers'

export const runtime = 'nodejs'
export const maxDuration = 300

interface Body {
  prompt: string
  model?: 'gpt-image-2' | 'gpt-image-1.5' | 'gpt-image-1'
  quality?: 'low' | 'medium' | 'high'
}

/** Generiert das Hero-Hintergrundbild eines Angebots und speichert es (Blob → hero_image_url). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params

  let body: Body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  if (!body.prompt?.trim()) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

  const offer = await getOfferById(id)
  if (!offer) return NextResponse.json({ error: 'offer not found' }, { status: 404 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 503 })

  const model = body.model ?? 'gpt-image-2'
  const quality = body.quality ?? 'high'

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: body.prompt, size: '1536x1024', quality, n: 1 }),
  })
  if (!res.ok) {
    const detail = await res.text()
    return NextResponse.json({ error: `OpenAI ${res.status}: ${detail.slice(0, 400)}` }, { status: 502 })
  }
  const data = await res.json()
  const b64: string | undefined = data?.data?.[0]?.b64_json
  if (!b64) return NextResponse.json({ error: 'no image in response' }, { status: 502 })

  let imageUrl: string
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (blobToken) {
    try {
      const { put } = await import('@vercel/blob')
      const blob = await put(`offers/${id}-hero-${Date.now()}.png`, Buffer.from(b64, 'base64'), {
        access: 'public', contentType: 'image/png', token: blobToken,
      })
      imageUrl = blob.url
    } catch {
      imageUrl = `data:image/png;base64,${b64}`
    }
  } else {
    imageUrl = `data:image/png;base64,${b64}`
  }

  await updateOffer(id, { heroImageUrl: imageUrl })

  return NextResponse.json({ ok: true, imageUrl, model, quality, storage: blobToken ? 'blob' : 'data-url' })
}
