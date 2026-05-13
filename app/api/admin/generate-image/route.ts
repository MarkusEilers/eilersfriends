import { NextResponse } from 'next/server'
import { eq, and, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 90

type Provider = 'openai-2' | 'openai-1' | 'gemini'

interface RequestBody {
  slug: string
  prompt: string
  provider?: Provider
  /** Optional override size / quality (OpenAI only) */
  size?: '1024x1024' | '1024x1536' | '1536x1024'
  quality?: 'low' | 'medium' | 'high'
}

async function generateWithOpenAI(
  apiKey: string,
  model: 'gpt-image-1' | 'gpt-image-2',
  prompt: string,
  size: string,
  quality: string,
): Promise<{ b64: string; mime: string } | { error: string; status: number }> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
  })
  if (!res.ok) {
    const detail = await res.text()
    return { error: `OpenAI ${res.status}: ${detail.slice(0, 400)}`, status: 502 }
  }
  const data = await res.json()
  const b64 = data?.data?.[0]?.b64_json
  if (!b64) return { error: 'no image in OpenAI response', status: 502 }
  return { b64, mime: 'image/png' }
}

async function generateWithGemini(
  apiKey: string,
  prompt: string,
): Promise<{ b64: string; mime: string } | { error: string; status: number }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    },
  )
  if (!res.ok) {
    const detail = await res.text()
    return { error: `Gemini ${res.status}: ${detail.slice(0, 400)}`, status: 502 }
  }
  const data = await res.json()
  const parts = data?.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p: { inlineData?: { data: string; mimeType?: string } }) => p.inlineData?.data)
  if (!imagePart) return { error: 'no image in Gemini response', status: 502 }
  return { b64: imagePart.inlineData.data, mime: imagePart.inlineData.mimeType || 'image/png' }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: RequestBody
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!body.slug || !body.prompt) {
    return NextResponse.json({ error: 'slug and prompt required' }, { status: 400 })
  }

  const provider: Provider = body.provider ?? 'openai-2'
  const size = body.size ?? '1024x1024'
  const quality = body.quality ?? 'medium'

  const [page] = await db.select().from(landingPages).where(eq(landingPages.slug, body.slug)).limit(1)
  if (!page) return NextResponse.json({ error: 'framework not found' }, { status: 404 })

  let gen: { b64: string; mime: string } | { error: string; status: number }
  if (provider === 'openai-2' || provider === 'openai-1') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 503 })
    const model = provider === 'openai-2' ? 'gpt-image-2' : 'gpt-image-1'
    gen = await generateWithOpenAI(apiKey, model, body.prompt, size, quality)
  } else {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 503 })
    gen = await generateWithGemini(apiKey, body.prompt)
  }

  if ('error' in gen) {
    return NextResponse.json({ error: gen.error }, { status: gen.status })
  }

  let imageUrl: string
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (blobToken) {
    try {
      const { put } = await import('@vercel/blob')
      const buffer = Buffer.from(gen.b64, 'base64')
      const blob = await put(`frameworks/${body.slug}-${Date.now()}.png`, buffer, {
        access: 'public', contentType: gen.mime, token: blobToken,
      })
      imageUrl = blob.url
    } catch {
      imageUrl = `data:${gen.mime};base64,${gen.b64}`
    }
  } else {
    imageUrl = `data:${gen.mime};base64,${gen.b64}`
  }

  await db.update(landingPages)
    .set({ ogImageUrl: imageUrl, updatedAt: new Date() })
    .where(eq(landingPages.id, page.id))

  const sections = await db.select().from(landingPageSections)
    .where(and(eq(landingPageSections.landingPageId, page.id), eq(landingPageSections.type, 'hero')))
    .orderBy(asc(landingPageSections.order))
    .limit(1)
  if (sections.length > 0) {
    const hero = sections[0]
    const newContent = { ...((hero.content ?? {}) as Record<string, unknown>), backgroundImage: imageUrl }
    await db.update(landingPageSections)
      .set({ content: newContent, updatedAt: new Date() })
      .where(eq(landingPageSections.id, hero.id))
  }

  return NextResponse.json({
    ok: true,
    slug: body.slug,
    provider,
    storage: blobToken ? 'blob' : 'data-url',
    bytes: gen.b64.length,
  })
}
