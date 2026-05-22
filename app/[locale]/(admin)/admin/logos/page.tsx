import { getAllTrustLogos } from '@/lib/db/queries/trust-logos'
import { saveTrustLogoAction, deleteTrustLogoAction } from '@/lib/actions/trust-logos'
import { LogoSearchPanel } from '@/components/admin/LogoSearchPanel'
import { Trash2, Save, Plus } from 'lucide-react'

export default async function AdminLogosPage() {
  const logos = await getAllTrustLogos()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Logoleiste</h1>
        <p className="mt-2 text-sm text-gray-600">
          Liste der Marken, die in der Logoleiste auf der Startseite erscheinen.
          Reihenfolge wird über das „Order"-Feld gesteuert. Bilder werden mit
          CSS-Grayscale + Opacity uniform dargestellt.
        </p>
      </div>

      {/* Existing logos */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
          Aktuelle Logos ({logos.length})
        </h2>
        <div className="space-y-3">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start gap-5">
                {/* Preview */}
                <div
                  className="flex h-16 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50"
                  aria-hidden="true"
                >
                  {logo.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="h-8 max-w-[100px] object-contain opacity-50 grayscale"
                    />
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-gray-300">No image</span>
                  )}
                </div>

                {/* Editable form */}
                <form action={saveTrustLogoAction} encType="multipart/form-data" className="flex-1 grid grid-cols-12 gap-3 items-end">
                  <input type="hidden" name="slug" value={logo.slug} />
                  <div className="col-span-3">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Name</label>
                    <input
                      name="name"
                      defaultValue={logo.name}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Domain</label>
                    <input
                      name="domain"
                      defaultValue={logo.domain ?? ''}
                      placeholder="example.com"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Source URL</label>
                    <input
                      name="src"
                      defaultValue={logo.src ?? ''}
                      placeholder="/logos/<slug>.svg or https://..."
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Order</label>
                    <input
                      type="number"
                      name="order"
                      defaultValue={logo.order}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-center"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center pb-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isVisible"
                        defaultChecked={logo.isVisible}
                        className="h-4 w-4 rounded border-gray-300"
                        style={{ accentColor: '#1A5FD4' }}
                      />
                      Sichtbar
                    </label>
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      title="Speichern"
                    >
                      <Save size={12} />
                    </button>
                  </div>
                  <div className="col-span-12">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                      Datei hochladen (überschreibt Source URL)
                    </label>
                    <input
                      type="file"
                      name="logoFile"
                      accept=".png,.jpg,.jpeg,.svg,.webp,image/*"
                      className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                    />
                  </div>
                </form>

                {/* Delete + search */}
                <div className="flex flex-col gap-1 items-end">
                  <LogoSearchPanel slug={logo.slug} name={logo.name} />
                  <form action={deleteTrustLogoAction}>
                    <input type="hidden" name="slug" value={logo.slug} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      title="Logo löschen"
                    >
                      <Trash2 size={12} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add new */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500">
          Neue Marke hinzufügen
        </h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <form action={saveTrustLogoAction} encType="multipart/form-data" className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-4">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Name</label>
              <input
                name="name"
                placeholder="z.B. TechCrunch"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Domain</label>
              <input
                name="domain"
                placeholder="techcrunch.com"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-4">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Source URL (optional)</label>
              <input
                name="src"
                placeholder="https://...logo.svg  oder leer lassen"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono text-xs"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Order</label>
              <input
                type="number"
                name="order"
                defaultValue={99}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-center"
              />
            </div>
            <div className="col-span-12 -mt-1">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                Logo-Datei hochladen <span className="normal-case font-normal">(optional · überschreibt Source URL · PNG / JPG / SVG / WEBP)</span>
              </label>
              <input
                type="file"
                name="logoFile"
                accept=".png,.jpg,.jpeg,.svg,.webp,image/*"
                className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
            <button
              type="submit"
              className="col-span-12 mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={14} /> Hinzufügen
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-400">
            Wenn keine Source-URL angegeben ist: nach dem Speichern auf „Suche" klicken,
            dann Quelle wählen — Simple-Icons (für bekannte Tech-Marken), Clearbit (für jede
            Domain) oder Google-Favicon als Last-Resort.
          </p>
        </div>
      </section>
    </div>
  )
}
