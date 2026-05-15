'use client'

import { useState } from 'react'
import { Search, Check, Loader2 } from 'lucide-react'
import { searchLogoCandidatesAction, saveTrustLogoAction } from '@/lib/actions/trust-logos'

interface Props {
  slug: string
  name: string
}

interface Candidate {
  source: string
  url: string
  label: string
}

export function LogoSearchPanel({ slug, name }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState(name)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [applying, setApplying] = useState<string | null>(null)

  async function handleSearch() {
    setLoading(true)
    setCandidates([])
    try {
      const result = await searchLogoCandidatesAction(query)
      setCandidates(result)
    } finally {
      setLoading(false)
    }
  }

  async function applyCandidate(c: Candidate) {
    setApplying(c.url)
    const fd = new FormData()
    fd.set('slug', slug)
    fd.set('name', name)
    fd.set('src', c.url)
    fd.set('order', '0')
    fd.set('isVisible', 'true')
    try {
      await saveTrustLogoAction(fd)
      window.location.reload()
    } catch (e) {
      console.error(e)
      setApplying(null)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        <Search size={12} /> Suche
      </button>
    )
  }

  return (
    <div className="w-72 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Marke / Domain"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />}
          Suchen
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] text-gray-400 hover:text-gray-700"
        >
          Schließen
        </button>
      </div>

      {candidates.length > 0 && (
        <div className="space-y-2">
          {candidates.map((c) => (
            <div
              key={c.url}
              className="flex items-center gap-2 rounded-lg bg-white p-2"
            >
              <div className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.url}
                  alt={c.label}
                  className="h-6 max-w-[60px] object-contain opacity-50 grayscale"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-gray-700 truncate">{c.label}</div>
                <div className="text-[9px] text-gray-400 truncate">{c.url}</div>
              </div>
              <button
                type="button"
                onClick={() => applyCandidate(c)}
                disabled={applying === c.url}
                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {applying === c.url ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                Übernehmen
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && candidates.length === 0 && (
        <p className="mt-2 text-[10px] text-gray-400">
          Quellen: Simple-Icons (Tech-Brands), Clearbit (jede Domain), Google-Favicon.
        </p>
      )}
    </div>
  )
}
