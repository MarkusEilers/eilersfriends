'use client'

import { useState } from 'react'
import { saveAuditSettings } from '@/lib/actions/services'
import { Save, Info } from 'lucide-react'

type Settings = {
  tiefe: string; quellen: string[]; suchen_je_quelle: number
  dimensionen: string[]; icp_soll: boolean; benchmark: boolean
  ton: string; doc_serie: string; broschuere: boolean; bilder: number
  benachrichtigen: string[]
}

export function AuditSettingsForm({ settings, quellen, dimensionen, orgs, schaetzung }: {
  settings: Settings
  quellen: Array<{ key: string; name: string; was: string }>
  dimensionen: Array<{ key: string; name: string }>
  orgs: Array<{ id: string; name: string }>
  schaetzung: { suchen: number; bilder: number; hinweis: string; kostenEur: number }
}) {
  const [gespeichert, setGespeichert] = useState(false)

  return (
    <form
      action={async (fd) => { await saveAuditSettings(fd); setGespeichert(true) }}
      className="mt-5 space-y-6"
    >
      {orgs.length ? (
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Gilt für</span>
          <select name="orgId" defaultValue="" className="mt-1.5 w-full max-w-sm rounded-xl border border-gray-200 px-3 py-2 text-sm">
            <option value="">Alle Kunden (Grundeinstellung)</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>Nur {o.name}</option>)}
          </select>
          <span className="mt-1 block text-xs text-gray-500">
            Eine Einstellung für einen Kunden gewinnt gegen die Grundeinstellung — Feld für Feld.
          </span>
        </label>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <fieldset className="rounded-2xl border border-gray-200 bg-white p-5">
          <legend className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Recherche</legend>

          <label className="mt-3 block text-sm">
            <span className="font-medium text-gray-900">Tiefe</span>
            <select name="tiefe" defaultValue={settings.tiefe} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
              <option value="knapp">knapp — schneller Eindruck, weniger Belege</option>
              <option value="normal">normal</option>
              <option value="gruendlich">gründlich — mehr Quellen, längere Laufzeit</option>
            </select>
          </label>

          <label className="mt-4 block text-sm">
            <span className="font-medium text-gray-900">Suchanfragen je Quellenklasse</span>
            <input
              type="number" name="suchen_je_quelle" min={1} max={8}
              defaultValue={settings.suchen_je_quelle}
              className="mt-1 w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <span className="ml-2 text-xs text-gray-500">Der größte Hebel für Laufzeit und Kosten.</span>
          </label>

          <div className="mt-4">
            <span className="text-sm font-medium text-gray-900">Quellenklassen</span>
            <div className="mt-2 space-y-2">
              {quellen.map((q) => (
                <label key={q.key} className="flex gap-2.5 text-sm">
                  <input type="checkbox" name="quellen" value={q.key}
                    defaultChecked={settings.quellen.includes(q.key)} className="mt-0.5" />
                  <span>
                    <span className="font-medium text-gray-800">{q.name}</span>
                    <span className="block text-xs text-gray-500">{q.was}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="mt-4 flex gap-2.5 text-sm">
            <input type="checkbox" name="icp_soll" defaultChecked={settings.icp_soll} className="mt-0.5" />
            <span>
              <span className="font-medium text-gray-800">ICP unabhängig recherchieren</span>
              <span className="block text-xs text-gray-500">
                Was der Markt wirklich will — ohne durch die Brille des Kunden-Messagings zu schauen.
                Aus der Differenz entsteht die Soll-Ist-Tabelle, oft der stärkste Teil des Audits.
              </span>
            </span>
          </label>
        </fieldset>

        <fieldset className="rounded-2xl border border-gray-200 bg-white p-5">
          <legend className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Bewertung &amp; Bericht</legend>

          <div className="mt-3">
            <span className="text-sm font-medium text-gray-900">Dimensionen</span>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {dimensionen.map((d) => (
                <label key={d.key} className="flex items-center gap-2 text-sm text-gray-800">
                  <input type="checkbox" name="dimensionen" value={d.key}
                    defaultChecked={settings.dimensionen.includes(d.key)} />
                  {d.name}
                </label>
              ))}
            </div>
          </div>

          <label className="mt-4 flex gap-2.5 text-sm">
            <input type="checkbox" name="benchmark" defaultChecked={settings.benchmark} className="mt-0.5" />
            <span>
              <span className="font-medium text-gray-800">Gegen die Benchmark-Datenbank vergleichen</span>
              <span className="block text-xs text-gray-500">Median und Bestwert je Dimension aus allen bisherigen Audits.</span>
            </span>
          </label>

          <label className="mt-4 block text-sm">
            <span className="font-medium text-gray-900">Ton der Kundenfassung</span>
            <select name="ton" defaultValue={settings.ton} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
              <option value="zurueckhaltend">zurückhaltend — Befunde ohne Urteil über Menschen</option>
              <option value="direkt">direkt — klarer benannt, für Kunden, die das wollen</option>
            </select>
            <span className="mt-1 block text-xs text-gray-500">
              Die interne Fassung bleibt immer direkt. Beef-Hebel, Einwände und Minenfelder erscheinen nie beim Kunden.
            </span>
          </label>
        </fieldset>

        <fieldset className="rounded-2xl border border-gray-200 bg-white p-5">
          <legend className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Broschüre</legend>

          <label className="mt-3 flex gap-2.5 text-sm">
            <input type="checkbox" name="broschuere" defaultChecked={settings.broschuere} className="mt-0.5" />
            <span className="font-medium text-gray-800">Broschüre erzeugen, sobald der Renderer steht</span>
          </label>

          <label className="mt-4 block text-sm">
            <span className="font-medium text-gray-900">Dokumentserie</span>
            <input name="doc_serie" defaultValue={settings.doc_serie} maxLength={8}
              className="mt-1 w-32 rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase" />
            <span className="ml-2 text-xs text-gray-500">z.&nbsp;B. EFGMA001</span>
          </label>

          <label className="mt-4 block text-sm">
            <span className="font-medium text-gray-900">Bilder je Broschüre</span>
            <input type="number" name="bilder" min={0} max={12} defaultValue={settings.bilder}
              className="mt-1 w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            <span className="ml-2 text-xs text-gray-500">Cover plus Banner. Kosten je Bild.</span>
          </label>

          <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <Info size={14} className="mt-0.5 shrink-0" />
            Der Render-Dienst steht noch nicht. Aufträge enden bis dahin mit dem fertigen Bericht
            und dem Vermerk, dass das Dokument aussteht.
          </p>
        </fieldset>

        <fieldset className="rounded-2xl border border-gray-200 bg-white p-5">
          <legend className="px-1 text-xs font-bold uppercase tracking-widest text-gray-500">Danach</legend>

          <label className="mt-3 block text-sm">
            <span className="font-medium text-gray-900">Benachrichtigen</span>
            <input name="benachrichtigen" defaultValue={settings.benachrichtigen.join(', ')}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="markus@eilersfriends.com, daniel@eilersfriends.com" />
            <span className="mt-1 block text-xs text-gray-500">Mehrere durch Komma getrennt.</span>
          </label>

          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Was ein Lauf ungefähr kostet</div>
            <div className="mt-1.5 text-sm text-gray-800">{schaetzung.hinweis}</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
              {schaetzung.kostenEur.toFixed(2)}&nbsp;€ an Stückkosten
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Suchanfragen und Bilder. Die Tokens kommen dazu und hängen am Umfang der Quellen.
            </div>
          </div>
        </fieldset>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Save size={15} /> Speichern
        </button>
        {gespeichert ? <span className="text-sm text-green-700">Gespeichert.</span> : null}
      </div>
    </form>
  )
}
