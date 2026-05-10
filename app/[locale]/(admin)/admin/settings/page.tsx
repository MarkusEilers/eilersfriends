import { getAllSettings } from '@/lib/db/queries/settings'
import { updateSettingAction } from '@/lib/actions/settings'

const SETTING_LABELS: Record<string, { label: string; hint: string; group: string }> = {
  'calendly.markus': {
    label: 'Markus · Calendly-URL',
    hint: 'Strategie-Gespräch / Kennenlernen mit Markus',
    group: 'Calendly',
  },
  'calendly.aljona': {
    label: 'Aljona · Calendly-URL',
    hint: 'Liquid Leadership Strategie-Gespräch / Kennenlernen mit Aljona',
    group: 'Calendly',
  },
}

export default async function AdminSettingsPage() {
  const settings = await getAllSettings()

  // Group by category
  const grouped: Record<string, typeof settings> = {}
  for (const s of settings) {
    const meta = SETTING_LABELS[s.key]
    const group = meta?.group ?? 'Sonstige'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(s)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
        <p className="mt-2 text-sm text-gray-600">
          Werte werden über alle Locales hinweg ausgespielt. Änderungen sind nach dem Speichern sofort live.
        </p>
      </div>

      {Object.entries(grouped).map(([group, items]) => (
        <section key={group} className="mb-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">{group}</h2>
          <div className="space-y-4">
            {items.map((s) => {
              const meta = SETTING_LABELS[s.key]
              return (
                <form
                  key={s.key}
                  action={updateSettingAction}
                  className="rounded-2xl border border-gray-200 bg-white p-5"
                >
                  <input type="hidden" name="key" value={s.key} />
                  <div className="mb-2">
                    <label className="block text-sm font-bold text-gray-900">
                      {meta?.label ?? s.key}
                    </label>
                    {meta?.hint && (
                      <p className="mt-0.5 text-xs text-gray-500">{meta.hint}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      name="value"
                      type="url"
                      defaultValue={s.value}
                      placeholder="https://calendly.com/..."
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-400 focus:bg-white"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Speichern
                    </button>
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-widest text-gray-400">
                    Key: <code>{s.key}</code>
                  </div>
                </form>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
