'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'coach')) {
    throw new Error('Unauthorized')
  }
}

// ── Landing Page erstellen ────────────────────────────────────────────────────
export async function createLandingPage() {
  await requireAdmin()

  const slug = `neue-seite-${Date.now()}`
  const inserted = await db
    .insert(landingPages)
    .values({
      slug,
      title: 'Neue Landing Page',
      status: 'draft',
      locale: 'de',
    })
    .returning({ id: landingPages.id })

  revalidatePath('/admin/landing-pages')
  redirect(`/admin/landing-pages/${inserted[0].id}`)
}

// ── Meta-Daten aktualisieren ──────────────────────────────────────────────────
export async function updateLandingPageMeta(input: {
  id: string
  title: string
  slug: string
  metaDescription: string
  emailList: string
  accentColor: string
  locale: string
}) {
  await requireAdmin()

  await db.update(landingPages).set({
    title: input.title,
    slug: input.slug.replace(/^\/lp\//, '').replace(/^\//, ''),
    metaDescription: input.metaDescription || null,
    emailList: input.emailList || null,
    accentColor: input.accentColor || null,
    locale: input.locale,
    updatedAt: new Date(),
  }).where(eq(landingPages.id, input.id))

  revalidatePath('/admin/landing-pages')
  revalidatePath(`/admin/landing-pages/${input.id}`)
}

// ── Status ändern ─────────────────────────────────────────────────────────────
export async function publishLandingPage(id: string, status: 'draft' | 'published' | 'archived') {
  await requireAdmin()
  await db.update(landingPages).set({ status, updatedAt: new Date() }).where(eq(landingPages.id, id))
  revalidatePath('/admin/landing-pages')
  revalidatePath(`/admin/landing-pages/${id}`)
}

// ── Sektion speichern / erstellen ────────────────────────────────────────────
export async function upsertSection(input: {
  id?: string
  landingPageId: string
  type: string
  order: number
  isVisible: boolean
  content: Record<string, unknown>
}): Promise<typeof landingPageSections.$inferSelect> {
  await requireAdmin()

  if (input.id) {
    const updated = await db.update(landingPageSections).set({
      type: input.type as typeof landingPageSections.$inferSelect['type'],
      order: input.order,
      isVisible: input.isVisible,
      content: input.content,
      updatedAt: new Date(),
    }).where(eq(landingPageSections.id, input.id)).returning()
    return updated[0]
  }

  const inserted = await db.insert(landingPageSections).values({
    landingPageId: input.landingPageId,
    type: input.type as typeof landingPageSections.$inferSelect['type'],
    order: input.order,
    isVisible: input.isVisible,
    content: input.content,
  }).returning()

  revalidatePath(`/admin/landing-pages/${input.landingPageId}`)
  return inserted[0]
}

// ── Sektion löschen ───────────────────────────────────────────────────────────
export async function deleteSection(id: string) {
  await requireAdmin()
  await db.delete(landingPageSections).where(eq(landingPageSections.id, id))
}

// ── Sektionen neu sortieren ───────────────────────────────────────────────────
export async function reorderSections(sections: { id: string; order: number }[]) {
  await requireAdmin()
  await Promise.all(
    sections.map((s) =>
      db.update(landingPageSections).set({ order: s.order }).where(eq(landingPageSections.id, s.id))
    )
  )
}

// ── Sichtbarkeit togglen ──────────────────────────────────────────────────────
export async function toggleSectionVisibility(id: string, isVisible: boolean) {
  await requireAdmin()
  await db.update(landingPageSections).set({ isVisible, updatedAt: new Date() }).where(eq(landingPageSections.id, id))
}
