'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import {
  upsertTrustLogo,
  deleteTrustLogo,
  reorderTrustLogos,
} from '@/lib/db/queries/trust-logos'

function slugify(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('unauthorized')
  }
}

export async function saveTrustLogoAction(formData: FormData) {
  await requireAdmin()
  const slug = String(formData.get('slug') || '').trim()
  const name = String(formData.get('name') || '').trim()
  const domain = String(formData.get('domain') || '').trim() || null
  let src: string | null = String(formData.get('src') || '').trim() || null
  const order = parseInt(String(formData.get('order') || '0'), 10) || 0
  const isVisible = formData.get('isVisible') === 'on' || formData.get('isVisible') === 'true'
  if (!name) throw new Error('name required')
  const finalSlug = slug || slugify(name)

  // Optional file upload — overrides src if a file is supplied
  const file = formData.get('logoFile')
  if (file && file instanceof File && file.size > 0) {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobToken) throw new Error('BLOB_READ_WRITE_TOKEN not set — cannot upload logo file')
    const { put } = await import('@vercel/blob')
    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const allowed = ['png', 'jpg', 'jpeg', 'svg', 'webp']
    if (!allowed.includes(ext)) throw new Error(`unsupported file type .${ext}`)
    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType =
      ext === 'svg' ? 'image/svg+xml' :
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
      ext === 'webp' ? 'image/webp' : 'image/png'
    const blob = await put(`trust-logos/${finalSlug}-${Date.now()}.${ext}`, buffer, {
      access: 'public', contentType, token: blobToken,
    })
    src = blob.url
  }

  await upsertTrustLogo({
    slug: finalSlug,
    name,
    domain,
    src,
    alt: name,
    order,
    isVisible,
  })
  revalidatePath('/')
  revalidatePath('/admin/logos')
}

export async function deleteTrustLogoAction(formData: FormData) {
  await requireAdmin()
  const slug = String(formData.get('slug') || '').trim()
  if (!slug) throw new Error('slug required')
  await deleteTrustLogo(slug)
  revalidatePath('/')
  revalidatePath('/admin/logos')
}

export async function reorderTrustLogosAction(slugs: string[]): Promise<void> {
  await requireAdmin()
  await reorderTrustLogos(slugs)
  revalidatePath('/')
  revalidatePath('/admin/logos')
}

/**
 * Search for a logo across multiple sources and return candidates.
 * Strategy: try simple-icons CDN first (good for tech brands),
 * fall back to Clearbit Logo API (works for any domain).
 */
export async function searchLogoCandidatesAction(query: string): Promise<Array<{ source: string; url: string; label: string }>> {
  await requireAdmin()
  const candidates: Array<{ source: string; url: string; label: string }> = []
  const slug = slugify(query)

  // 1) Simple-Icons CDN (works for ~3000 popular brands)
  const siUrl = `https://cdn.jsdelivr.net/npm/simple-icons/icons/${slug}.svg`
  try {
    const res = await fetch(siUrl, { method: 'HEAD', cache: 'no-store' })
    if (res.ok && res.headers.get('content-type')?.includes('svg')) {
      candidates.push({ source: 'simple-icons', url: siUrl, label: `Simple-Icons · ${slug}` })
    }
  } catch {}

  // 2) Clearbit Logo (any domain) — slug interpreted as domain or as `name.com`
  const domain = query.includes('.') ? query : `${slug}.com`
  const cbUrl = `https://logo.clearbit.com/${domain}?size=200`
  try {
    const res = await fetch(cbUrl, { method: 'HEAD', cache: 'no-store' })
    if (res.ok) {
      candidates.push({ source: 'clearbit', url: cbUrl, label: `Clearbit · ${domain}` })
    }
  } catch {}

  // 3) Wikipedia favicon as last-resort
  candidates.push({
    source: 'favicon',
    url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
    label: `Google favicon · ${domain}`,
  })

  return candidates
}
