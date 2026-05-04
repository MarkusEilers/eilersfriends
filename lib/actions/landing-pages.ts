'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { landingPages, landingPageSections } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { lpTemplates, type LpTemplate } from '@/lib/templates/program-welsh'

/** New enum values introduced for Welsh-style program templates. */
const NEW_SECTION_TYPES = [
  'origin_story',
  'curriculum',
  'bonus_deliverables',
  'fit_check',
  'pricing_card',
  'risk_reversal',
  'tweet_wall',
  'framework_steps',
  'lead_magnet',
] as const

/**
 * Idempotently adds new values to the landing_page_section_type enum
 * if they don't exist yet. Safe to call repeatedly. Postgres 12+ supports
 * ADD VALUE IF NOT EXISTS without a transaction block.
 */
async function ensureSectionEnumValues() {
  for (const value of NEW_SECTION_TYPES) {
    await db.execute(
      sql.raw(
        `ALTER TYPE "landing_page_section_type" ADD VALUE IF NOT EXISTS '${value}';`,
      ),
    )
  }
  // Also ensure templateKey column on landing_pages exists
  await db.execute(
    sql.raw(
      `ALTER TABLE "landing_pages" ADD COLUMN IF NOT EXISTS "template_key" TEXT;`,
    ),
  )
}

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
  title?: string
  slug?: string
  metaDescription?: string | null
  emailList?: string | null
  accentColor?: string | null
  locale?: string
}) {
  await requireAdmin()

  await db.update(landingPages).set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
      ...(input.emailList !== undefined ? { emailList: input.emailList } : {}),
      ...(input.accentColor !== undefined ? { accentColor: input.accentColor } : {}),
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
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

/**
 * Erzeugt eine neue Landing Page aus einem Template-Bauplan.
 * Slug wird zwingend gebraucht (muss eindeutig sein).
 */
export async function createLandingPageFromTemplate({
  templateKey,
  slug,
  title,
  metaDescription,
  accentColor,
  locale = 'de',
}: {
  templateKey: string
  slug: string
  title?: string
  metaDescription?: string
  accentColor?: string
  locale?: string
}) {
  const template: LpTemplate | undefined = lpTemplates[templateKey]
  if (!template) {
    throw new Error(`Template "${templateKey}" not found`)
  }

  // 0. Ensure enum knows about new section types (idempotent)
  await ensureSectionEnumValues()

  // 1. Insert landing page
  const [page] = await db
    .insert(landingPages)
    .values({
      slug,
      title: title ?? template.defaultTitle,
      metaDescription: metaDescription ?? template.defaultMetaDescription,
      status: 'draft',
      locale,
      accentColor: accentColor ?? template.accentColor,
      templateKey: template.key,
    })
    .returning()

  // 2. Insert sections in template order
  await db.insert(landingPageSections).values(
    template.sections.map((s, i) => ({
      landingPageId: page.id,
      type: s.type,
      order: i * 10, // gaps for later inserts
      isVisible: true,
      content: s.content,
    })),
  )

  return page
}
