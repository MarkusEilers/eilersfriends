import { db } from '@/lib/db'
import { emailTemplates } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor'
import { Plus } from 'lucide-react'

export default async function EmailTemplatesPage() {
  let templates: (typeof emailTemplates.$inferSelect)[] = []
  try {
    templates = await db
      .select()
      .from(emailTemplates)
      .orderBy(desc(emailTemplates.updatedAt))
  } catch (_) {
    // DB noch nicht verbunden
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email-Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Erstelle und bearbeite alle Emails: DOI-Bestätigung, Welcome, Sequenz-Schritte.
          </p>
        </div>
        <EmailTemplateEditor mode="create">
          <button className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: '#F05A1A' }}>
            <Plus size={16} />
            Neues Template
          </button>
        </EmailTemplateEditor>
      </div>

      {/* Template-Liste */}
      {templates.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-gray-500">Noch keine Templates angelegt.</p>
          <p className="mt-1 text-xs text-gray-400">
            Klick auf „Neues Template" um zu starten. Die DOI-Email hat einen eingebauten Fallback.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <TypeBadge type={tpl.type} />
                  <LocaleBadge locale={tpl.locale} />
                  {tpl.isDefault && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Standard
                    </span>
                  )}
                </div>
                <p className="mt-2 font-semibold text-gray-900 truncate">{tpl.name}</p>
                <p className="text-sm text-gray-500 truncate">Betreff: {tpl.subject}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Zuletzt geändert: {new Date(tpl.updatedAt).toLocaleDateString('de-AT')}
                </p>
              </div>
              <EmailTemplateEditor mode="edit" template={tpl}>
                <button className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors">
                  Bearbeiten
                </button>
              </EmailTemplateEditor>
            </div>
          ))}
        </div>
      )}

      {/* Hinweis-Box */}
      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">Verfügbare Variablen</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ['{{firstName}}', 'Vorname des Subscribers'],
            ['{{confirmUrl}}', 'DOI-Bestätigungslink'],
            ['{{year}}', 'Aktuelles Jahr'],
            ['{{loginUrl}}', 'Portal-Login-Link'],
            ['{{email}}', 'Email-Adresse'],
          ].map(([variable, desc]) => (
            <div key={variable} className="rounded-lg bg-white p-3 border border-blue-100">
              <code className="text-xs font-bold text-blue-700">{variable}</code>
              <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    doi_confirmation: { label: 'DOI Bestätigung', color: 'bg-orange-50 text-orange-700' },
    doi_welcome: { label: 'Welcome', color: 'bg-green-50 text-green-700' },
    sequence_step: { label: 'Sequenz-Schritt', color: 'bg-purple-50 text-purple-700' },
    transactional: { label: 'Transaktional', color: 'bg-gray-100 text-gray-600' },
  }
  const { label, color } = labels[type] ?? { label: type, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{label}</span>
  )
}

function LocaleBadge({ locale }: { locale: string }) {
  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 uppercase">
      {locale}
    </span>
  )
}
