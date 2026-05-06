import { NextResponse } from 'next/server'
import { eq, and, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 503 })
  }

  let body: { slug: string; prompt: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!body.slug || !body.prompt) {
    return NextResponse.json({ error: 'slug and prompt required' }, { status: 400 })
  }

  const [page] = await db.select().from(landingPages).where(eq(landingPages.slug, body.slug)).limit(1)
  if (!page) return NextResponse.json({ error: 'framework not found' }, { status: 404 })

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: body.prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    },
  )
  if (!geminiRes.ok) {
    const detail = await geminiRes.text()
    return NextResponse.json({ error: `Gemini ${geminiRes.status}`, detail: detail.slice(0, 800) }, { status: 502 })
  }
  const data = await geminiRes.json()
  const parts = data?.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p: any) => p.inlineData?.data)
  if (!imagePart) {
    return NextResponse.json({ error: 'no image in response' }, { status: 502 })
  }

  const base64 = imagePart.inlineData.data as string
  const mime = (imagePart.inlineData.mimeType as string) || 'image/png'

  let imageUrl: string
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (blobToken) {
    try {
      const { put } = await import('@vercel/blob')
      const buffer = Buffer.from(base64, 'base64')
      const blob = await put(`frameworks/${body.slug}-${Date.now()}.png`, buffer, {
        access: 'public', contentType: mime, token: blobToken,
      })
      imageUrl = blob.url
    } catch {
      imageUrl = `data:${mime};base64,${base64}`
    }
  } else {
    imageUrl = `data:${mime};base64,${base64}`
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
    storage: blobToken ? 'blob' : 'data-url',
    bytes: base64.length,
  })
}
