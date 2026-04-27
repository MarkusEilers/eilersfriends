import { db } from '@/lib/db'
import { landingPages } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { Plus, ExternalLink, Globe, FileText, Archive, Sparkles } from 'lucide-react'
import { createLandingPage, createLandingPageFromTemplate } from '@/lib/actions/landing-pages'
import { lpTemplates } from '@/lib/templates/program-welsh'
import { redirect } from 'next/navigation'

async function createFromWelshAction() {
  'use server'
  const slug = `programm-${Date.now().toString(36)}`
  const page = await createLandingPageFromTemplate({
    templateKey: 'program-welsh',
    slug,
  })
  redirect(`/admin/landing-pages/${page.id}`)
}

async function createFromNewsletterAction() {
  'use server'
  const slug = `newsletter-${Date.now().toString(36)}`
  const page = await createLandingPageFromTemplate({
    templateKey: 'newsletter-welsh',
    slug,
  })
  redirect(`/admin/landing-pages/${page.id}`)
}

export default async function LandingPagesPage() {
  let pages: (typeof landingPages.$inferSelect)[] = []
  try {
    pages = await db.select().from(landingPages).orderBy(desc(landingPages.updatedAt))
  } catch (_) {}

  const published = pages.filter((p) => p.status === 'published')
  const drafts = pages.filter((p) => p.status === 'draft')
  const archived = pages.filter((p) => p.status === 'archived')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Erstelle Seiten für jedes Framework und Programm. Email-Adressen werden automatisch gesammelt.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <form action={createFromWelshAction}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
              style={{ color: '#1A5FD4', borderColor: '#BBCFF5', backgroundColor: '#EBF1FF' }}
              title={lpTemplates['program-welsh'].description}
            >
              <Sparkles size={16} />
              Aus Programm-Template
            </button>
          </form>
          <form action={createFromNewsletterAction}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
              style={{ color: '#F05A1A', borderColor: '#FECDBB', backgroundColor: '#FFF1EB' }}
              title={lpTemplates['newsletter-welsh'].description}
            >
              <Sparkles size={16} />
              Aus Newsletter-Template
            </button>
          </form>
          <form action={createLandingPage}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#F05A1A' }}
            >
              <Plus size={16} />
              Leere Seite
            </button>
          </form>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <Globe size={32} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Noch keine Landing Pages.</p>
          <p className="mt-1 text-xs text-gray-400">
            Erstelle deine erste Seite für SalesMade, Liquid Leadership oder ein neues Framework.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {published.length > 0 && (
            <PageGroup title="Veröffentlicht" icon={<Globe size={14} />} pages={published} color="green" />
          )}
          {drafts.length > 0 && (
            <PageGroup title="Entwürfe" icon={<FileText size={14} />} pages={drafts} color="orange" />
          )}
          {archived.length > 0 && (
            <PageGroup title="Archiviert" icon={<Archive size={14} />} pages={archived} color="gray" />
          )}
        </div>
      )}
    </div>
  )
}

function PageGroup({
  title, icon, pages, color,
}: {
  title: string
  icon: React.ReactNode
  pages: (typeof landingPages.$inferSelect)[]
  color: 'green' | 'orange' | 'gray'
}) {
  const colorMap = {
    green: 'text-green-700 bg-green-50',
    orange: 'text-orange-700 bg-orange-50',
    gray: 'text-gray-600 bg-gray-100',
  }

  return (
    <div>
      <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colorMap[color]}`}>
        {icon}
        {title} ({pages.length})
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <div key={page.id} className="group relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{page.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">/lp/{page.slug}</p>
              </div>
              <a
                href={`/lp/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>
            {page.emailList && (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                Liste: {page.emailList}
              </div>
            )}
            <div className="mt-4 text-xs text-gray-400">
              {new Date(page.updatedAt).toLocaleDateString('de-AT')}
            </div>
            <Link
              href={`/admin/landing-pages/${page.id}`}
              className="absolute inset-0 rounded-2xl"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
