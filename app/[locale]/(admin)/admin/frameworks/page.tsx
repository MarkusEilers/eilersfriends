import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Plus, ExternalLink, Globe, FileText, Archive, Edit3, BookOpen,
} from 'lucide-react'
import {
  createLandingPageFromTemplate,
  publishLandingPage,
} from '@/lib/actions/landing-pages'
import { seedB2BOffersAsFramework } from '@/lib/actions/seed-frameworks'

async function createFrameworkAction() {
  'use server'
  const slug = `framework-${Date.now().toString(36)}`
  const page = await createLandingPageFromTemplate({
    templateKey: 'framework-leadmagnet',
    slug,
  })
  redirect(`/admin/landing-pages/${page.id}`)
}

async function seedB2BAction() {
  'use server'
  const result = await seedB2BOffersAsFramework()
  redirect(`/admin/landing-pages/${result.id}`)
}

async function setStatusAction(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const status = formData.get('status') as 'draft' | 'published' | 'archived'
  if (id && status) await publishLandingPage(id, status)
}

export default async function AdminFrameworksPage() {
  let frameworks: (typeof landingPages.$inferSelect)[] = []
  try {
    frameworks = await db
      .select()
      .from(landingPages)
      .where(eq(landingPages.templateKey, 'framework-leadmagnet'))
      .orderBy(desc(landingPages.updatedAt))
  } catch (_) {}

  const stats = {
    total: frameworks.length,
    published: frameworks.filter((f) => f.status === 'published').length,
    drafts: frameworks.filter((f) => f.status === 'draft').length,
    archived: frameworks.filter((f) => f.status === 'archived').length,
  }

  const grouped = {
    published: frameworks.filter((f) => f.status === 'published'),
    drafts: frameworks.filter((f) => f.status === 'draft'),
    archived: frameworks.filter((f) => f.status === 'archived'),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Frameworks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lead-Magnet-Pages für jede Methode / jedes Tool. Im Index unter <a href="/frameworks" className="underline">/frameworks</a> sichtbar.
          </p>
        </div>
        <form action={createFrameworkAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1A5FD4' }}
          >
            <Plus size={16} />
            Neues Framework
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        <Stat label="Gesamt"        value={stats.total}     color="#0F1E3A" />
        <Stat label="Veröffentlicht" value={stats.published} color="#157A45" />
        <Stat label="Entwürfe"      value={stats.drafts}    color="#B07C0A" />
        <Stat label="Archiviert"    value={stats.archived}  color="#6B7280" />
      </div>

      {/* Empty state */}
      {frameworks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <BookOpen size={32} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Noch keine Frameworks angelegt.</p>
          <p className="mt-2 text-xs text-gray-400 max-w-md mx-auto">
            Klick auf „Neues Framework" für ein leeres Welsh-Style-Template,
            oder importiere die bestehende /b2b-offers-Seite als ersten Eintrag.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <form action={createFrameworkAction}>
              <button type="submit" className="rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#1A5FD4' }}>
                <Plus size={12} className="inline -mt-0.5 mr-1" /> Neues Framework
              </button>
            </form>
            <form action={seedB2BAction}>
              <button type="submit" className="rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-gray-50" style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}>
                B2B-Angebote (8 Schritte) importieren
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-end">
            <form action={seedB2BAction}>
              <button type="submit" className="text-xs text-gray-500 hover:text-gray-700 underline">
                B2B-Angebote (8 Schritte) als Framework importieren
              </button>
            </form>
          </div>
          {grouped.published.length > 0 && (
            <Group title="Veröffentlicht" icon={<Globe size={14} />} color="green" rows={grouped.published} />
          )}
          {grouped.drafts.length > 0 && (
            <Group title="Entwürfe" icon={<FileText size={14} />} color="orange" rows={grouped.drafts} />
          )}
          {grouped.archived.length > 0 && (
            <Group title="Archiviert" icon={<Archive size={14} />} color="gray" rows={grouped.archived} />
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function Group({
  title, icon, color, rows,
}: {
  title: string
  icon: React.ReactNode
  color: 'green' | 'orange' | 'gray'
  rows: (typeof landingPages.$inferSelect)[]
}) {
  const colorMap = {
    green: 'text-green-700 bg-green-50',
    orange: 'text-orange-700 bg-orange-50',
    gray: 'text-gray-600 bg-gray-100',
  }
  return (
    <div>
      <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colorMap[color]}`}>
        {icon} {title} ({rows.length})
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((p) => {
          const accent = p.accentColor ?? '#1A5FD4'
          return (
            <div key={p.id} className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}15` }}>
                    <BookOpen size={18} style={{ color: accent }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{p.title}</h3>
                    <p className="text-xs text-gray-400 font-mono">/frameworks/{p.slug}</p>
                  </div>
                </div>
              </div>
              {p.metaDescription && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{p.metaDescription}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-50">
                <div className="flex gap-1.5">
                  <Link
                    href={`/admin/landing-pages/${p.id}`}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    <Edit3 size={11} /> Bearbeiten
                  </Link>
                  {p.status === 'published' && (
                    <a
                      href={`/frameworks/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 border-blue-200"
                    >
                      <ExternalLink size={11} /> Live
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  {p.status !== 'published' && (
                    <form action={setStatusAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="published" />
                      <button type="submit" className="rounded-full px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-50">Publish</button>
                    </form>
                  )}
                  {p.status !== 'archived' && (
                    <form action={setStatusAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="archived" />
                      <button type="submit" className="rounded-full px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50">Archiv</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
