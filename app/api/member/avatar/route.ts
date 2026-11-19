import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

/** Profilfoto hochladen: quadratisch zuschneiden (512 px), in den Blob-Speicher, an den Nutzer hängen. */
export async function POST(req: Request) {
  const s = await auth()
  if (!s?.user?.id) return NextResponse.json({ ok: false, error: 'Nicht angemeldet' }, { status: 401 })
  const fd = await req.formData().catch(() => null)
  const f = fd?.get('file')
  if (!f || typeof f === 'string') return NextResponse.json({ ok: false, error: 'Keine Datei' }, { status: 400 })
  if (f.size > 8_000_000) return NextResponse.json({ ok: false, error: 'Das Bild ist größer als 8 MB.' }, { status: 413 })
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type)) return NextResponse.json({ ok: false, error: 'Bitte ein JPG, PNG oder WebP.' }, { status: 415 })
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return NextResponse.json({ ok: false, error: 'Speicher nicht eingerichtet' }, { status: 500 })
  const sharp = (await import('sharp')).default
  let out: Buffer
  try { out = await sharp(Buffer.from(await f.arrayBuffer())).rotate().resize(512, 512, { fit: 'cover', position: 'attention' }).jpeg({ quality: 84 }).toBuffer() }
  catch { return NextResponse.json({ ok: false, error: 'Das Bild ließ sich nicht lesen.' }, { status: 400 }) }
  const { put } = await import('@vercel/blob')
  const blob = await put(`avatars/${s.user.id}-${Date.now()}.jpg`, out, { access: 'public', contentType: 'image/jpeg', token })
  await db.execute(sql`UPDATE users SET avatar_url = ${blob.url}, updated_at = now() WHERE id = ${s.user.id}`)
  return NextResponse.json({ ok: true, url: blob.url })
}
