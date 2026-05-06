'use client'

import { useState } from 'react'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'

interface Props {
  slug: string
  defaultPrompt: string
  hasImage: boolean
}

export function FrameworkImageGenerator({ slug, defaultPrompt, hasImage }: Props) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, prompt }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.detail
          ? `${data.error}: ${typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail).slice(0, 200)}`
          : data.error || `HTTP ${res.status}`
        throw new Error(msg)
      }
      setStatus('done')
      // Refresh page to show new image
      setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      setStatus('error')
      setError((e as Error).message)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:bg-gray-50"
        style={{ color: '#1A5FD4', borderColor: '#BBCFF5' }}
        title={hasImage ? 'Bild neu generieren' : 'Bild generieren'}
      >
        {hasImage ? <RefreshCw size={11} /> : <Sparkles size={11} />}
        {hasImage ? 'Bild neu' : 'Bild generieren'}
      </button>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 w-full">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Prompt für Nano Banana
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-700"
          disabled={status === 'loading'}
        >
          Abbrechen
        </button>
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-xs font-mono outline-none focus:border-blue-300"
        disabled={status === 'loading'}
      />
      <button
        type="button"
        onClick={handleGenerate}
        disabled={status === 'loading' || !prompt.trim()}
        className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: '#1A5FD4' }}
      >
        {status === 'loading' && <Loader2 size={12} className="animate-spin" />}
        {status === 'loading' ? 'Generiere…' : status === 'done' ? '✓ Fertig — neu laden' : 'Generieren (~10s)'}
      </button>
      {error && (
        <p className="mt-2 text-xs leading-relaxed text-red-600">{error}</p>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-gray-400">
        Tipp: Cinematic + atmospheric + photorealistic + tone hints (deep blue, golden-hour) liefern die besten Ergebnisse. Vermeide Text und Gesichter im Prompt.
      </p>
    </div>
  )
}
