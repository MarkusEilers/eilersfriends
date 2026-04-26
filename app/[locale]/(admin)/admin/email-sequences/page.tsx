import { db } from '@/lib/db'
import { emailSequences, emailSequenceSteps } from '@/lib/db/schema'
import { desc, eq, count } from 'drizzle-orm'
import { Plus, Zap, Clock, CheckCircle } from 'lucide-react'
import { EmailSequenceEditor } from '@/components/admin/EmailSequenceEditor'

export default async function EmailSequencesPage() {
  let sequences: (typeof emailSequences.$inferSelect & { stepCount: number })[] = []

  try {
    const raw = await db.select().from(emailSequences).orderBy(desc(emailSequences.updatedAt))
    sequences = await Promise.all(
      raw.map(async (seq) => {
        const [{ count: stepCount }] = await db
          .select({ count: count() })
          .from(emailSequenceSteps)
          .where(eq(emailSequenceSteps.sequenceId, seq.id))
        return { ...seq, stepCount: Number(stepCount) }
      })
    )
  } catch (_) {}

  const triggerLabels: Record<string, string> = {
    newsletter_signup: 'Newsletter-Anmeldung',
    doi_confirmed: 'DOI bestätigt',
    landing_page_signup: 'Landing Page Formular',
    program_enrollment: 'Programm-Buchung',
    manual: 'Manuell',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email-Sequenzen</h1>
          <p className="mt-1 text-sm text-gray-500">
            Automatische Email-Ketten. Jeder Trigger startet eine Sequenz — nach x Stunden folgt der nächste Schritt.
          </p>
        </div>
        <EmailSequenceEditor mode="create">
          <button className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: '#F05A1A' }}>
            <Plus size={16} /> Neue Sequenz
          </button>
        </EmailSequenceEditor>
      </div>

      {sequences.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
          <Zap size={32} className="mx-auto mb-4 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Noch keine Sequenzen.</p>
          <p className="mt-1 text-xs text-gray-400">Erstelle deine erste Sequenz — z.B. eine 5-teilige Welcome-Serie nach DOI-Bestätigung.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sequences.map((seq) => (
            <div key={seq.id} className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Status-Dot */}
                <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${seq.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                <div>
                  <p className="font-semibold text-gray-900">{seq.name}</p>
                  {seq.description && <p className="text-sm text-gray-500 mt-0.5">{seq.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                      <Zap size={10} /> {triggerLabels[seq.trigger] ?? seq.trigger}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                      <Clock size={10} /> {seq.stepCount} Schritte
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase text-gray-500">
                      {seq.locale}
                    </span>
                    {seq.isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        <CheckCircle size={10} /> Aktiv
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <EmailSequenceEditor mode="edit" sequence={seq}>
                <button className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-900">
                  Bearbeiten
                </button>
              </EmailSequenceEditor>
            </div>
          ))}
        </div>
      )}

      {/* Erklärungs-Box */}
      <div className="mt-8 rounded-2xl border border-purple-100 bg-purple-50 p-5">
        <p className="text-sm font-semibold text-purple-900">Wie Sequenzen funktionieren</p>
        <div className="mt-3 space-y-2 text-sm text-purple-800">
          <p>1. Ein Subscriber-Ereignis triggert eine Sequenz (z.B. DOI-Bestätigung)</p>
          <p>2. Schritt 1 wird sofort oder nach x Stunden gesendet</p>
          <p>3. Jeder weitere Schritt folgt mit konfigurierter Verzogerung</p>
          <p>4. Der Cron-Job <code className="rounded bg-purple-100 px-1 font-mono text-xs">/api/cron/sequences</code> läuft stündlich</p>
        </div>
      </div>
    </div>
  )
}
