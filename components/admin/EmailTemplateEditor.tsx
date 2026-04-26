'use client'

import { useState, useTransition, ReactNode } from 'react'
import { X, Eye, EyeOff, Loader2 } from 'lucide-react'
import { saveEmailTemplate, deleteEmailTemplate } from '@/lib/actions/email-templates'

type TemplateType = 'doi_confirmation' | 'doi_welcome' | 'sequence_step' | 'transactional'

interface Template {
  id: string
  type: TemplateType
  name: string
  locale: string
  subject: string
  bodyHtml: string
  bodyText: string | null
  fromName: string | null
  fromEmail: string | null
  isDefault: boolean
  variables: string[] | null
}

interface EmailTemplateEditorProps {
  mode: 'create' | 'edit'
  template?: Template
  children: ReactNode
}

const TYPE_OPTIONS = [
  { value: 'doi_confirmation', label: 'DOI-Bestätigung' },
  { value: 'doi_welcome', label: 'Welcome nach DOI' },
  { value: 'sequence_step', label: 'Sequenz-Schritt' },
  { value: 'transactional', label: 'Transaktional' },
]

export function EmailTemplateEditor({ mode, template, children }: EmailTemplateEditorProps) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    type: (template?.type ?? 'doi_confirmation') as TemplateType,
    name: template?.name ?? '',
    locale: template?.locale ?? 'de',
    subject: template?.subject ?? '',
    bodyHtml: template?.bodyHtml ?? '',
    bodyText: template?.bodyText ?? '',
    fromName: template?.fromName ?? 'Eilers+Friends',
    fromEmail: template?.fromEmail ?? 'hallo@eilersfriends.com',
    isDefault: template?.isDefault ?? false,
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const target = e.target
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
    setForm((f) => ({ ...f, [target.name]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await saveEmailTemplate({
          id: template?.id,
          ...form,
        })
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
      }
    })
  }

  function handleDelete() {
    if (!template?.id) return
    if (!confirm('Template wirklich löschen?')) return
    startTransition(async () => {
      await deleteEmailTemplate(template.id)
      setOpen(false)
    })
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                {mode === 'create' ? 'Neues Template' : `Template bearbeiten: ${template?.name}`}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreview((p) => !p)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400"
                >
                  {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                  {preview ? 'Editor' : 'HTML-Vorschau'}
                </button>
                <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-gray-400 hover:text-gray-900">
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6">
                {/* Preview */}
                {preview ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="border-b border-gray-200 bg-white px-4 py-2 text-xs text-gray-500">
                      Vorschau ({{firstName}} = &quot;Maria&quot;, {{confirmUrl}} = &quot;https://...&quot;)
                    </div>
                    <iframe
                      srcDoc={form.bodyHtml
                        .replace(/\{\{firstName\}\}/g, 'Maria')
                        .replace(/\{\{confirmUrl\}\}/g, 'https://eilersfriends.com/api/newsletter/confirm?token=demo')
                        .replace(/\{\{year\}\}/g, new Date().getFullYear().toString())}
                      className="h-[500px] w-full"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="grid gap-5">
                    {/* Zeile 1: Typ + Locale + Standard */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Typ</label>
                        <select
                          name="type"
                          value={form.type}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        >
                          {TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Sprache</label>
                        <select
                          name="locale"
                          value={form.locale}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        >
                          <option value="de">Deutsch (DE)</option>
                          <option value="en">Englisch (EN)</option>
                          <option value="ru">Russisch (RU)</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isDefault"
                            checked={form.isDefault}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                          />
                          Standard für diesen Typ
                        </label>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Interner Name</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="z.B. DOI-Bestätigung Deutsch v2"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                      />
                    </div>

                    {/* Absender */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Absender-Name</label>
                        <input
                          name="fromName"
                          value={form.fromName}
                          onChange={handleChange}
                          placeholder="Eilers+Friends"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Absender-Email</label>
                        <input
                          name="fromEmail"
                          value={form.fromEmail}
                          onChange={handleChange}
                          placeholder="hallo@eilersfriends.com"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Betreff */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">Betreff</label>
                      <input
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                        placeholder="Bitte bestätige deine Anmeldung ✉️"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                      />
                    </div>

                    {/* HTML Body */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        HTML-Body{' '}
                        <span className="font-normal text-gray-400">({'{{firstName}}'} etc. werden ersetzt)</span>
                      </label>
                      <textarea
                        name="bodyHtml"
                        value={form.bodyHtml}
                        onChange={handleChange}
                        required
                        rows={14}
                        placeholder="<!DOCTYPE html><html>..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs focus:border-orange-400 focus:outline-none resize-y"
                      />
                    </div>

                    {/* Plaintext Body */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        Plaintext-Fallback <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        name="bodyText"
                        value={form.bodyText}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Hey {{firstName}}, ..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none resize-y"
                      />
                    </div>

                    {error && (
                      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                <div>
                  {mode === 'edit' && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isPending}
                      className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      Template löschen
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:border-gray-400"
                  >
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
