'use client'

import { useState, useTransition } from 'react'
import { Search, Loader2, Check, Building2, Globe } from 'lucide-react'
import { suggestCompaniesAction, findLogoCandidatesAction, quickAddLogoAction, type CompanySuggestion, type LogoCandidate } from '@/lib/actions/logo-finder'
import { LOGO_CATEGORIES } from '@/lib/logos/categories'

/** Logo hinzufügen nur per Firmenname: Vorschläge (CRM + Web) → Logo wird von der Website geholt → übernehmen. */
export function LogoQuickAdd() {
  const [q, setQ] = useState('')
  const [companies, setCompanies] = useState<CompanySuggestion[] | null>(null)
  const [picked, setPicked] = useState<CompanySuggestion | null>(null)
  const [logos, setLogos] = useState<LogoCandidate[] | null>(null)
  const [logo, setLogo] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, start] = useTransition()

  function search() {
    if (q.trim().length < 2) return
    setMsg(null); setPicked(null); setLogos(null); setLogo(null)
    start(async () => setCompanies(await suggestCompaniesAction(q)))
  }

  function pick(c: CompanySuggestion) {
    setPicked(c); setName(c.name); setLogos(null); setLogo(null); setMsg(null)
    start(async () => {
      const found = await findLogoCandidatesAction(c.domain)
      const list = c.logo ? [{ url: c.logo, label: 'Logo aus dem CRM', kind: 'img' as const }, ...found] : found
      setLogos(list)
      setLogo(list[0]?.url ?? null)
    })
  }

  function add() {
    if (!picked || !logo) return
    start(async () => {
      const r = await quickAddLogoAction({ name: name || picked.name, domain: picked.domain, logoUrl: logo, categories: cats })
      if (r.ok) { setMsg(`${name} ist in der Logoleiste.`); setTimeout(() => window.location.reload(), 900) }
      else setMsg(r.error ?? 'Hat nicht geklappt.')
    })
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Firmenname</label>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
          placeholder="z. B. Upvest, NavVis, Knowunity" className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm" />
        <button type="button" onClick={search} disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {busy && !picked ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Vorschläge
        </button>
      </div>

      {companies && !companies.length && <p className="mt-3 text-xs text-gray-500">Keine Treffer. Versuch es mit der Domain (z. B. firma.de).</p>}

      {companies && companies.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {companies.map((c) => (
            <button key={c.source + c.domain} type="button" onClick={() => pick(c)}
              className={`flex items-center gap-3 rounded-xl border bg-white p-3 text-left hover:border-blue-400 ${picked?.domain === c.domain ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200'}`}>
              <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${c.source === 'crm' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                {c.domain
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(c.domain)}&sz=64`} alt="" className="h-5 w-5 object-contain" />
                  : c.source === 'crm' ? <Building2 size={15} /> : <Globe size={15} />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900">{c.name}</span>
                <span className="block truncate text-xs text-gray-500">{c.domain || 'ohne Domain'} · {c.source === 'crm' ? 'aus dem CRM' : 'aus dem Web'}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {picked && (
        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Logo von {picked.domain}</span>
            {busy && !logos && <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Loader2 size={12} className="animate-spin" /> Suche auf der Website …</span>}
          </div>
          {logos && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {logos.map((l) => (
                <button key={l.url} type="button" onClick={() => setLogo(l.url)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 ${logo === l.url ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-400'}`}>
                  <span className="flex h-12 w-full items-center justify-center rounded bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.url} alt="" className="max-h-9 max-w-[90%] object-contain" />
                  </span>
                  <span className="text-[10px] text-gray-500">{l.label}</span>
                </button>
              ))}
            </div>
          )}
          {logos && (
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-gray-400">Anzeigename</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pb-2">
                <span className="text-[10px] uppercase tracking-widest text-gray-400">Zeigen auf</span>
                {LOGO_CATEGORIES.map((c) => (
                  <label key={c.key} className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-gray-700">
                    <input type="checkbox" checked={cats.includes(c.key)} onChange={(e) => setCats(e.target.checked ? [...cats, c.key] : cats.filter((x) => x !== c.key))}
                      className="h-3.5 w-3.5 rounded border-gray-300" style={{ accentColor: '#1A5FD4' }} />
                    {c.label}
                  </label>
                ))}
              </div>
              <button type="button" onClick={add} disabled={busy || !logo}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Logo übernehmen
              </button>
            </div>
          )}
        </div>
      )}
      {msg && <p className="mt-3 text-sm font-semibold text-gray-700">{msg}</p>}
    </div>
  )
}
