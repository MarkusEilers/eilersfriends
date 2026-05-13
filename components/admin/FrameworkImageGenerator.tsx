'use client'

import { useState } from 'react'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'

interface Props {
  slug: string
  defaultPrompt: string
  hasImage: boolean
}

type Provider = 'openai-2' | 'openai-1' | 'gemini'

export function FrameworkImageGenerator({ slug, defaultPrompt, hasImage }: Props) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [provider, setProvider] = useState<Provider>('openai-2')
  const [size, setSize] = useState<'1024x1024' | '1024x1536' | '1536x1024'>('1024x1024')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, prompt, provider, size, quality }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.detail
          ? `${data.error}: ${typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail).slice(0, 200)}`
          : data.error || `HTTP ${res.status}`
        throw new Error(msg)
      }
      setStatus('done')
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
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Prompt + Modell
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

      {/* Provider + Size + Quality selectors */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Modell</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            disabled={status === 'loading'}
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-300"
          >
            <option value="openai-2">GPT-Image-2 (best)</option>
            <option value="openai-1">GPT-Image-1</option>
            <option value="gemini">Gemini Flash Image</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Größe</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as '1024x1024' | '1024x1536' | '1536x1024')}
            disabled={status === 'loading' || provider === 'gemini'}
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-300 disabled:opacity-50"
          >
            <option value="1024x1024">Square 1024</option>
            <option value="1536x1024">Landscape 1536</option>
            <option value="1024x1536">Portrait 1536</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Qualität</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
            disabled={status === 'loading' || provider === 'gemini'}
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-300 disabled:opacity-50"
          >
            <option value="low">low (~$0.02)</option>
            <option value="medium">medium (~$0.17)</option>
            <option value="high">high (~$0.50)</option>
          </select>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={6}
        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-xs font-mono outline-none focus:border-blue-300"
        disabled={status === 'loading'}
        placeholder="Cinematic editorial photograph of…"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === 'loading' || !prompt.trim()}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#1A5FD4' }}
        >
          {status === 'loading' && <Loader2 size={12} className="animate-spin" />}
          {status === 'loading' ? 'Generiere…' : status === 'done' ? '✓ Fertig — neu laden' : 'Generieren (~15–40s)'}
        </button>
        <span className="text-[10px] text-gray-400">
          {provider === 'openai-2' ? 'GPT-Image-2 · 2026' : provider === 'openai-1' ? 'GPT-Image-1 · 2025' : 'Gemini 2.5 Flash Image'}
        </span>
      </div>

      {error && (
        <p className="mt-2 text-xs leading-relaxed text-red-600">{error}</p>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-gray-400">
        Tipp: Editorial photography + tone hints (deep navy, cyan accents) liefern die besten Ergebnisse. Bei gpt-image-2 darfst Du auch Typografie im Prompt verlangen — das Modell kann Text rendern.
      </p>
    </div>
  )
}
