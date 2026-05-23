import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateOffer, getOfferById } from '@/lib/db/queries/offers'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * POST /api/admin/offers/[id]/customer-logo
 * FormData: { file }
 *
 * - Uploads color version to Vercel Blob as `offers/<offer-number>/customer-logo.<ext>`
 * - For raster files generates BW version via sharp
 * - Updates offers.customer_logo_url + customer_logo_url_bw
 * - Returns { ok: true, url, urlBw }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const offer = await getOfferById(id)
  if (!offer) return NextResponse.json({ ok: false, error: 'offer_not_found' }, { status: 404 })

  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ ok: false, error: 'invalid_form_data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'no_file' }, { status: 400 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    return NextResponse.json({ ok: false, error: 'blob_not_configured' }, { status: 500 })
  }

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

  // Filename — offer-number is human-readable + unique
  const safeOfferNo = String(offer.offer_number).replace(/[^A-Za-z0-9_-]/g, '-')

  // Color
  let colorUrl: string
  try {
    const blob = await put(`offers/${safeOfferNo}/customer-logo.${ext}`, buffer, {
      access: 'public', contentType, token: blobToken, allowOverwrite: true,
    })
    colorUrl = blob.url
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'blob_put_color_failed', detail: err instanceof Error ? err.message : 'unknown' }, { status: 500 })
  }

  // BW (raster only)
  let bwUrl: string | null = null
  if (ext !== 'svg') {
    try {
      const sharp = (await import('sharp')).default
      const bwBuffer = await sharp(buffer)
        .grayscale()
        .toFormat(ext === 'webp' ? 'webp' : ext === 'png' ? 'png' : 'jpeg')
        .toBuffer()
      const blobBw = await put(`offers/${safeOfferNo}/customer-logo-bw.${ext}`, bwBuffer, {
        access: 'public', contentType, token: blobToken, allowOverwrite: true,
      })
      bwUrl = blobBw.url
    } catch (err) {
      console.error('[offers/customer-logo] BW failed', err)
    }
  }

  await updateOffer(id, {
    customerLogoUrl: colorUrl,
    customerLogoUrlBw: bwUrl,
  })

  revalidatePath(`/admin/offers/${id}`)
  revalidatePath(`/offer/${offer.access_salt}`)

  return NextResponse.json({ ok: true, url: colorUrl, urlBw: bwUrl })
}
