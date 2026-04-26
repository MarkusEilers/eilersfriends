'use client'

import { useState, useTransition, ReactNode } from 'react'
import { X, Plus, Trash2, Loader2, Clock } from 'lucide-react'
import { saveEmailSequence, deleteEmailSequence } from '@/lib/actions/email-sequences'

interface SequenceStep {
  id?: string
  templateId: string
  order: number
  delayHours: number
  isActive: boolean
}

interface Sequence {
  id: string
  name: string
  description: string | null
  trigger: string
  isActive: boolean
  locale: string
}

interface EmailSequenceEditorProps {
  mode: 'create' | 'edit'
  sequence?: Sequence & { stepCount: number }
  children: ReactNode
}

const TRIGGERS = [
  { value: 'newsletter_signup', label: 'Newsletter-Anmeldung' },
  { value: 'doi_confirmed', label: 'DOI bestätigt' },
  { value: 'landing_page_signup', label: 'Landing Page Formular' },
  { value: 'program_enrollment', label: 'Programm-Buchung' },
  { value: 'manual', label: 'Manuell' },
]

function hoursLabel(h: number) {
  if (h === 0) return 'Sofort'
  if (h < 24) return `${h} Stunde${h !== 1 ? 'n' : ''}`
  const d = Math.floor(h / 24)
  return `${d} Tag${d !== 1 ? 'e' : ''}`
}

export function EmailSequenceEditor({ mode, sequence, children }: EmailSequenceEditorProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: sequence?.name ?? '',
    description: sequence?.description ?? '',
    trigger: sequence?.trigger ?? 'doi_confirmed',
    isActive: sequence?.isActive ?? false,
    locale: sequence?.locale ?? 'de',
  })

  const [steps, setSteps] = useState<SequenceStep[]>([])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await saveEmailSequence({ id: sequence?.id, ...form, steps })
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
      }
    })
  }

  function addStep() {
    setSteps((s) => [...s, { templateId: '', order: s.length, delayHours: s.length === 0 ? 0 : 24, isActive: true }])
  }

  function removeStep(idx: number) {
    setSteps((s) => s.filter((_, i) => i !== idx).map((step, i) => ({ ...step, order: i })))
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                {mode === 'create' ? 'Neue Sequenz' : sequence?.name}
              </h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-gray-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Name der Sequenz</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="z.B. Welcome-Serie nach DOI"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Beschreibung */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Beschreibung (intern)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                  />
                </div>

                {/* Trigger + Locale */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Trigger</label>
                    <select
                      value={form.trigger}
                      onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    >
                      {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Sprache</label>
                    <select
                      value={form.locale}
                      onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                    >
                      <option value="de">Deutsch</option>
                      <option value="en">Englisch</option>
                      <option value="ru">Russisch</option>
                    </select>
                  </div>
                </div>

                {/* Aktiv */}
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Sequenz aktivieren</span>
                  <span className="text-xs text-gray-400">(inaktive Sequenzen werden nicht ausgelöst)</span>
                </label>

                {/* Schritte */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">Schritte ({steps.length})</label>
                    <button type="button" onClick={addStep} className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-800">
                      <Plus size={12} /> Schritt hinzufügen
                    </button>
                  </div>

                  {steps.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                      Noch keine Schritte. Füge einen Schritt hinzu und wähle ein Email-Template.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#F05A1A' }}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Template-ID</label>
                              <input
                                value={step.templateId}
                                onChange={(e) => setSteps((s) => s.map((st, i) => i === idx ? { ...st, templateId: e.target.value } : st))}
                                placeholder="UUID des Templates"
                                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-mono focus:border-orange-400 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">
                                <Clock size={10} className="inline mr-1" />
                                Verzögerung
                              </label>
                              <select
                                value={step.delayHours}
                                onChange={(e) => setSteps((s) => s.map((st, i) => i === idx ? { ...st, delayHours: Number(e.target.value) } : st))}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-orange-400 focus:outline-none"
                              >
                                {[0, 1, 2, 4, 8, 12, 24, 48, 72, 96, 120, 168, 336].map((h) => (
                                  <option key={h} value={h}>{hoursLabel(h)}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button type="button" onClick={() => removeStep(idx)} className="text-red-300 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                <div>
                  {mode === 'edit' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!sequence?.id || !confirm('Sequenz wirklich löschen?')) return
                        await deleteEmailSequence(sequence.id)
                        setOpen(false)
                      }}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Sequenz löschen
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:border-gray-400">
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#F05A1A' }}
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    Speichern
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
