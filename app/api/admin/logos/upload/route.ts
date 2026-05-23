import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { upsertTrustLogo } from '@/lib/db/queries/trust-logos'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * POST /api/admin/logos/upload
 * FormData: { file, name, slug?, domain?, order?, isVisible? }
 *
 * - Uploads color version to Vercel Blob as `trust-logos/<slug>-logo.<ext>`
 * - For raster files (png/jpg/jpeg/webp): generates BW version via sharp and
 *   uploads as `trust-logos/<slug>-logo-bw.<ext>`
 * - For SVG: only color is stored — CSS grayscale handles display
 * - Upserts the trust_logos row with both URLs
 * - Returns { ok: true, src, srcBw }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_form_data' }, { status: 400 })
  }

  const file = form.get('file')
  const name = String(form.get('name') || '').trim()
  const slugInput = String(form.get('slug') || '').trim()
  const domain = String(form.get('domain') || '').trim() || null
  const order = parseInt(String(form.get('order') || '0'), 10) || 0
  const isVisibleRaw = form.get('isVisible')
  const isVisible = isVisibleRaw === null ? true : (isVisibleRaw === 'on' || isVisibleRaw === 'true')
  const displayScaleRaw = form.get('displayScale')
  const displayScale = displayScaleRaw == null ? undefined : Math.max(50, Math.min(150, parseInt(String(displayScaleRaw), 10) || 100))

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'no_file' }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ ok: false, error: 'name_required' }, { status: 400 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    return NextResponse.json(
      { ok: false, error: 'blob_not_configured', detail: 'BLOB_READ_WRITE_TOKEN missing in Vercel env. Settings → Environment Variables.' },
      { status: 500 },
    )
  }

  const finalSlug = slugInput || slugify(name)
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const allowed = ['png', 'jpg', 'jpeg', 'svg', 'webp']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ ok: false, error: `unsupported_type:${ext}` }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType =
    ext === 'svg' ? 'image/svg+xml' :
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
    ext === 'webp' ? 'image/webp' : 'image/png'

  const { put } = await import('@vercel/blob')

  // 1) Color version — deterministic filename: <slug>-logo.<ext>
  let colorUrl: string
  try {
    const blob = await put(`trust-logos/${finalSlug}-logo.${ext}`, buffer, {
      access: 'public',
      contentType,
      token: blobToken,
      allowOverwrite: true,
    })
    colorUrl = blob.url
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'blob_put_failed'
    return NextResponse.json({ ok: false, error: 'blob_put_color_failed', detail: msg }, { status: 500 })
  }

  // 2) BW version (raster only — sharp can't sensibly desat SVGs)
  let bwUrl: string | null = null
  if (ext !== 'svg') {
    try {
      const sharp = (await import('sharp')).default
      const bwBuffer = await sharp(buffer)
        .grayscale()
        .toFormat(ext === 'webp' ? 'webp' : ext === 'png' ? 'png' : 'jpeg')
        .toBuffer()
      const blobBw = await put(`trust-logos/${finalSlug}-logo-bw.${ext}`, bwBuffer, {
        access: 'public',
        contentType,
        token: blobToken,
        allowOverwrite: true,
      })
      bwUrl = blobBw.url
    } catch (err) {
      // BW failure is non-fatal — log and continue with color only
      console.error('[logos/upload] BW generation failed', err)
    }
  }

  // 3) Persist
  try {
    await upsertTrustLogo({
      slug: finalSlug,
      name,
      domain,
      src: colorUrl,
      srcBw: bwUrl,
      displayScale,
      alt: name,
      order,
      isVisible,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'db_upsert_failed'
    return NextResponse.json({ ok: false, error: 'db_upsert_failed', detail: msg }, { status: 500 })
  }

  revalidatePath('/')
  revalidatePath('/admin/logos')

  return NextResponse.json({ ok: true, slug: finalSlug, src: colorUrl, srcBw: bwUrl })
}
